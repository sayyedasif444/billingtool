import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

// CORS Response Helper
function corsResponse(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function POST(req: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken || !folderId) {
      console.warn("[DRIVE_UPLOAD_WARN] Google Drive variables not set in .env.local");
      return corsResponse(
        NextResponse.json(
          { error: "Google Drive credentials not configured" },
          { status: 501 }
        )
      );
    }

    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return corsResponse(
        NextResponse.json({ error: "No file provided" }, { status: 400 })
      );
    }

    // Validate file type (Only images, PDFs, and Excel spreadsheets)
    const allowedExtensions = [".pdf", ".xls", ".xlsx", ".csv", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isImage = file.type.startsWith("image/");
    const isAllowedDoc = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ].includes(file.type);

    if (!isImage && !isAllowedDoc && !allowedExtensions.includes(fileExt)) {
      return corsResponse(
        NextResponse.json(
          { error: "Invalid file format. Only PDF, Excel spreadsheet (.xls, .xlsx, .csv), and Image files are allowed." },
          { status: 400 }
        )
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize Auth
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });


    // Convert buffer to stream for upload
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // 1. Upload file to specific Google Drive Folder
    const fileMetadata = {
      name: `${Date.now()}_${file.name}`,
      parents: [folderId],
    };

    const media = {
      mimeType: file.type || "application/octet-stream",
      body: bufferStream,
    };

    console.log(`[DRIVE_UPLOAD] Uploading "${file.name}" to folder: ${folderId}`);
    
    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = driveFile.data.id;
    if (!fileId) {
      throw new Error("Failed to retrieve file ID from Google Drive");
    }

    // 2. Make the file publicly viewable (anyone with link can read)
    console.log(`[DRIVE_UPLOAD] Setting public permission on file: ${fileId}`);
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // 3. Fetch the public links
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: "webViewLink, webContentLink",
    });

    // Use webViewLink as the public viewable page
    const publicUrl = fileInfo.data.webViewLink || fileInfo.data.webContentLink;

    console.log(`[DRIVE_UPLOAD_SUCCESS] File uploaded. Public URL: ${publicUrl}`);

    return corsResponse(
      NextResponse.json({
        success: true,
        url: publicUrl,
        name: file.name
      }, { status: 201 })
    );
  } catch (error: any) {
    console.error("[DRIVE_UPLOAD_ERROR]", error);
    return corsResponse(
      NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
      )
    );
  }
}
