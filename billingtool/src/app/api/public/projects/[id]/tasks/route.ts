import { NextRequest, NextResponse } from "next/server";
import { dbApi, Task, TaskType } from "@/lib/firebase/db";

// CORS Response Helper
function corsResponse(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// Preflight request handler
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return corsResponse(
        NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
      );
    }

    const { title, description, type, acceptanceCriteria, stepsToReproduce, photoUrls } = body;

    // Validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return corsResponse(
        NextResponse.json({ error: "Task 'title' is required and must be a non-empty string" }, { status: 400 })
      );
    }

    // Default and check type
    let taskType: TaskType = "feature";
    if (type === "bug" || type === "feature") {
      taskType = type;
    }

    // Build the task payload forcing proposed state and backlog
    const taskPayload: Task = {
      projectId,
      title: title.trim(),
      type: taskType,
      description: typeof description === "string" ? description : "",
      status: "Proposed",
      sprintId: "" // Enforce backlog
    };

    if (Array.isArray(photoUrls)) {
      taskPayload.photoUrls = photoUrls.filter(url => typeof url === "string");
    }

    // Include type-specific optional fields
    if (taskType === "feature" && typeof acceptanceCriteria === "string") {
      taskPayload.acceptanceCriteria = acceptanceCriteria;
    } else if (taskType === "bug" && typeof stepsToReproduce === "string") {
      taskPayload.stepsToReproduce = stepsToReproduce;
    }

    // Create the task in database
    const taskId = await dbApi.createTask(taskPayload);

    return corsResponse(
      NextResponse.json(
        {
          success: true,
          message: "Task created successfully in proposed state",
          taskId,
          task: {
            id: taskId,
            ...taskPayload
          }
        },
        { status: 201 }
      )
    );
  } catch (error: any) {
    console.error("[PUBLIC_API_TASK_CREATE_ERROR]", error);
    return corsResponse(
      NextResponse.json(
        { error: error.message || "An unexpected error occurred" },
        { status: 500 }
      )
    );
  }
}
