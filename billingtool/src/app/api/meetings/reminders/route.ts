import { NextRequest, NextResponse } from "next/server";
import { dbApi, Project, ProjectMeeting } from "@/lib/firebase/db";
import { sendEmail } from "@/lib/mail";

export async function GET(req: NextRequest) {
  try {
    // 1. Security Check (Prevent public access)
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret') || authHeader?.replace('Bearer ', '');
    
    if (secret !== process.env.PDF_SECRET && secret !== process.env.CRON_SECRET) {
      console.warn("[REMINDER_CRON_UNAUTHORIZED] Blocked unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get all projects globally for the reminder scan
    const projects = await dbApi.getAllProjectsAdmin() as Project[];
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);
    const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60000);

    console.log(`[REMINDER_CRON] Checking for meetings between ${fifteenMinutesFromNow.toISOString()} and ${twentyMinutesFromNow.toISOString()}`);

    let emailsSent = 0;

    for (const project of projects) {
      if (!project.meetings || project.meetings.length === 0) continue;

      const meetingsToRemind = project.meetings.filter(m => {
        const startTime = new Date(m.startTime);
        return (
          m.status === 'scheduled' &&
          !m.remindersSent?.email15 &&
          startTime >= fifteenMinutesFromNow &&
          startTime <= twentyMinutesFromNow
        );
      });

      if (meetingsToRemind.length === 0) continue;

      // Get company info for this project (to get the email)
      const company = await dbApi.getCompany(project.companyId);
      if (!company || !company.email) continue;

      for (const meeting of meetingsToRemind) {
        try {
          await sendEmail({
            to: company.email,
            subject: `REMINDER: Meeting in 15 mins - ${meeting.title}`,
            text: `Hi, this is a reminder for your upcoming meeting.\n\nTitle: ${meeting.title}\nStarts at: ${new Date(meeting.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\nLocation: ${meeting.location || 'Online'}\n${meeting.link ? `Link: ${meeting.link}` : ''}\n\nProject: ${project.name}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1;">Meeting Reminder</h2>
                <p>You have a meeting starting in <strong>15 minutes</strong>.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p style="margin: 5px 0;"><strong>${meeting.title}</strong></p>
                  <p style="margin: 5px 0; color: #666;">Time: ${new Date(meeting.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                  ${meeting.location ? `<p style="margin: 5px 0; color: #666;">Location: ${meeting.location}</p>` : ''}
                </div>
                ${meeting.link ? `<a href="${meeting.link}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Join Meeting</a>` : ''}
                <p style="font-size: 12px; color: #999; margin-top: 20px;">Project: ${project.name}</p>
              </div>
            `
          });

          // Mark as sent in DB
          const updatedMeetings = project.meetings.map(m => 
            m.id === meeting.id 
              ? { ...m, remindersSent: { ...m.remindersSent, email15: true } } 
              : m
          );
          await dbApi.updateProject(project.id!, { meetings: updatedMeetings });
          
          emailsSent++;
          console.log(`[REMINDER_CRON] Sent reminder for "${meeting.title}" to ${company.email}`);
        } catch (err) {
          console.error(`[REMINDER_CRON] Failed to send reminder for ${meeting.id}:`, err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedAt: now.toISOString(),
      emailsSent 
    });
  } catch (error: any) {
    console.error("[REMINDER_CRON_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
