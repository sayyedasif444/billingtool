import { Project, Sprint, Task } from "@/lib/firebase/db";

// Helper to strip HTML tags from editor contents and preserve block line breaks
function stripHtml(html?: string): string {
  if (!html) return "";
  
  // Remove all literal carriage returns and newlines from the HTML source first to prevent duplicate line breaks
  let text = html.replace(/\r?\n/g, "");
  
  // Convert line breaks and paragraph closing tags to newlines
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/blockquote>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n");
    
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, "");
  
  // Decode HTML entities
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Collapse excessive consecutive newlines
    .trim();
}

// Helper to format Firestore timestamps into readable date strings
function formatFirestoreTimestamp(timestamp: any): string {
  if (!timestamp) return "";
  try {
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return isNaN(date.getTime()) ? "" : date.toLocaleString();
  } catch (e) {
    return "";
  }
}

export async function exportTasksToExcel(
  project: Project | null,
  activeSprint: Sprint | undefined,
  tasks: Task[],
  sprints: Sprint[] = []
) {
  // Dynamically import xlsx-js-style for client-side Excel styling
  const XLSX = await import("xlsx-js-style");

  const projectName = project?.name || "Project";
  
  // Format only the date range of the sprint (Start Date - End Date)
  let sprintLabel = "Backlog";
  let headerTitle = "Sprint Plan - Backlog";
  let sprintNumber = -1;

  if (activeSprint) {
    // Sort all sprints chronologically to find the correct Sprint Number
    const sorted = [...sprints].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    const sprintIndex = sorted.findIndex(s => s.id === activeSprint.id);
    sprintNumber = sprintIndex !== -1 ? sprintIndex + 1 : -1;
    const sprintNumStr = sprintNumber !== -1 ? `Sprint ${sprintNumber}` : "Sprint";

    const formattedDates = `${new Date(activeSprint.startDate).toLocaleDateString()} - ${new Date(activeSprint.endDate).toLocaleDateString()}`;
    sprintLabel = `${sprintNumStr} (${formattedDates})`;
    headerTitle = `Sprint Plan ${sprintLabel}`;
  }

  // Set up workbook structure with metadata rows (No Task ID column)
  const rows: any[][] = [
    [headerTitle.toUpperCase()],
    ["Project Name:", projectName],
    ["Sprint / Period:", sprintLabel],
    ["Exported On:", new Date().toLocaleString()],
    [], // Spacer row
    [
      "Type",
      "Title",
      "Status",
      "Est. Days",
      "Description",
      "Acceptance Criteria / Steps to Reproduce",
      "Created At",
      "Updated At"
    ]
  ];

  // Add tasks list without task ID
  tasks.forEach(t => {
    const details = t.type === "bug" ? (t.stepsToReproduce || "") : (t.acceptanceCriteria || "");
    rows.push([
      t.type.toUpperCase(),
      t.title || "",
      t.status || "",
      t.estimatedDays !== undefined ? String(t.estimatedDays) : "",
      stripHtml(t.description),
      stripHtml(details),
      formatFirestoreTimestamp(t.createdAt),
      formatFirestoreTimestamp(t.updatedAt)
    ]);
  });

  // Convert array of arrays to sheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

  // Merge title banner across all columns (8 columns total)
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
  ];

  // Apply styling to every cell
  const numRows = rows.length;
  const numCols = 8;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      let cell = worksheet[cellRef];
      
      // If cell doesn't exist, initialize it so we can apply grid borders
      if (!cell) {
        worksheet[cellRef] = { t: "s", v: "" };
        cell = worksheet[cellRef];
      }

      // 1. Title styling (Row 1)
      if (r === 0) {
        cell.s = {
          font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "0F172A" } }, // slate-900 background
          alignment: { horizontal: "left", vertical: "center", indent: 1 }
        };
      }
      // 2. Metadata Labels styling (Rows 2-4, Col A)
      else if (r > 0 && r < 4 && c === 0) {
        cell.s = {
          font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "475569" } }, // slate-600 label
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
      // 3. Metadata Values styling (Rows 2-4, Col B+)
      else if (r > 0 && r < 4 && c > 0) {
        cell.s = {
          font: { name: "Segoe UI", sz: 10, color: { rgb: "0F172A" } },
          alignment: { horizontal: "left", vertical: "center" }
        };
      }
      // 4. Spacer row (Row 5)
      else if (r === 4) {
        // Blank row
      }
      // 5. Table Headers styling (Row 6)
      else if (r === 5) {
        cell.s = {
          font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "334155" } }, // slate-700 background
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "475569" } },
            bottom: { style: "medium", color: { rgb: "0F172A" } },
            left: { style: "thin", color: { rgb: "475569" } },
            right: { style: "thin", color: { rgb: "475569" } }
          }
        };
      }
      // 6. Data Rows styling (Row 7+)
      else if (r >= 6) {
        const isEvenRow = r % 2 === 0;
        const rowBg = isEvenRow ? "F8FAFC" : "FFFFFF"; // alternate background colors

        // Default cell style
        const dataStyle: any = {
          font: { name: "Segoe UI", sz: 10, color: { rgb: "334155" } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { wrapText: true, vertical: "top" },
          border: {
            top: { style: "thin", color: { rgb: "E2E8F0" } },
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
          }
        };

        // Custom alignments and text properties per column
        if (c === 0) { // Type
          const val = String(cell.v).toUpperCase();
          const isBug = val === "BUG";
          dataStyle.font.bold = true;
          dataStyle.font.color = { rgb: isBug ? "EF4444" : "10B981" }; // Red for bugs, green for features
          dataStyle.alignment.horizontal = "center";
        } else if (c === 1) { // Title
          dataStyle.font.bold = true;
          dataStyle.alignment.horizontal = "left";
        } else if (c === 2) { // Status
          dataStyle.alignment.horizontal = "center";
        } else if (c === 3) { // Est. Days
          dataStyle.alignment.horizontal = "center";
        } else if (c === 4) { // Description
          dataStyle.alignment.horizontal = "left";
        } else if (c === 5) { // Details (AC / Steps)
          dataStyle.alignment.horizontal = "left";
        } else if (c === 6 || c === 7) { // Created At / Updated At
          dataStyle.alignment.horizontal = "center";
        }

        cell.s = dataStyle;
      }
    }
  }

  // Row heights styling (explicit for header/metadata; data rows are omitted so they auto-expand to fit wrapped text)
  const rowHeights = [
    { hpt: 38 }, // Row 1 (Title)
    { hpt: 20 }, // Row 2
    { hpt: 20 }, // Row 3
    { hpt: 20 }, // Row 4
    { hpt: 12 }, // Row 5
    { hpt: 26 }  // Row 6 (Headers)
  ];
  worksheet["!rows"] = rowHeights;

  // Width formatting - First column set to 20 for metadata labels
  worksheet["!cols"] = [
    { wch: 20 }, // Type (Increased to 20 to prevent metadata label clipping)
    { wch: 35 }, // Title
    { wch: 15 }, // Status
    { wch: 12 }, // Est. Days
    { wch: 55 }, // Description
    { wch: 55 }, // Acceptance Criteria / Steps to Reproduce
    { wch: 22 }, // Created At (Expanded to prevent clipping)
    { wch: 22 }  // Updated At (Expanded to prevent clipping)
  ];

  // Generate safe filename using date range
  const safeProjectName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  
  let safeSprintName = "backlog";
  if (activeSprint) {
    const sprintNumPrefix = sprintNumber !== -1 ? `sprint_${sprintNumber}_` : "sprint_";
    safeSprintName = `${sprintNumPrefix}${activeSprint.startDate}_to_${activeSprint.endDate}`;
  }
  const filename = `${safeProjectName}_${safeSprintName}_tasks.xlsx`;

  // Write file and trigger download
  XLSX.writeFile(workbook, filename);
}
