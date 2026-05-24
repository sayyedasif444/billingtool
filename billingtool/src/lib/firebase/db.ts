import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

// --- Types ---
export interface Company {
  id?: string;
  userId: string; // NEW: Links to the Auth User
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  bankDetails: string;
  logoUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ColumnType = "text" | "number" | "calculated";

export interface ColumnDef {
  id: string;
  label: string;
  type: ColumnType;
  formula?: string; // e.g. "col1 * col2"
  isTotal?: boolean;
}

export interface TemplateDef {
  id: string;
  name: string;
  defaultCurrency: string;
  topSection: string;
  bottomSection: string;
  columns: ColumnDef[];
}

export interface Client {
  id?: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  templates?: TemplateDef[];
  createdAt?: unknown;
}


export interface ProjectAsset {
  id: string;
  key: string;
  value?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: any;
}

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  updatedAt: any;
}

export interface ProjectMeeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  link?: string;
  status: "scheduled" | "cancelled" | "completed";
  remindersSent?: {
    email15: boolean;
    push: boolean;
  };
  createdAt: any;
}

export interface Project {
  id?: string;
  companyId: string;
  clientId: string;
  name: string;
  description: string;
  status: "active" | "completed";
  assets?: ProjectAsset[]; // Credentials & Config
  notes?: ProjectNote[];
  meetings?: ProjectMeeting[];
  tasks?: any[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type TaskStatus = "Proposed" | "inDiscussion" | "Approved" | "No Action" | "Pending" | "Blocked" | "In Progress" | "Development" | "To Merge" | "Production";
export type TaskType = "bug" | "feature";

export interface Task {
  id?: string;
  projectId: string;
  sprintId?: string; // If undefined, it belongs to backlog
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  
  // Feature specific
  acceptanceCriteria?: string;
  
  // Bug specific
  stepsToReproduce?: string;
  photoUrls?: string[];
  
  // Estimation
  estimatedDays?: number;
  
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Sprint {
  id?: string;
  projectId: string;
  name?: string;
  startDate: string;
  endDate: string;
  status?: "planned" | "active" | "completed";
  goal?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface QuotationPhase {
  id: string;
  name: string;
  amount: number;
  isBilled: boolean;
  billedAmount?: number;
}

export interface Quotation {
  id?: string;
  companyId: string;
  clientId: string;
  projectId?: string;
  quotationNumber: string;
  title: string;
  status: "draft" | "accepted" | "in_progress" | "completed";
  date: any;
  totalAmount: number;
  currency: string;
  
  // Legacy fields
  phases?: QuotationPhase[];
  
  // Dynamic Fields (each row can now have a billedAmount)
  dynamicRows?: Record<string, unknown>[];

  billingMode: "split" | "free";

  notes: string;
  templateId?: string;
  columns?: ColumnDef[];
  topSection?: string;
  bottomSection?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface LinkedItem {
  id: string;
  amount: number;
}

export interface Invoice {
  id?: string;
  companyId: string;
  clientId: string;
  projectId?: string;
  
  // Optional linkage to a quotation
  quotationId?: string;
  linkedPhases?: string[]; // Legacy
  linkedItems?: LinkedItem[]; // New: Tracks amount billed per item
  
  // For independent invoices
  isIndependent?: boolean;
  lineItems?: LineItem[];
  dynamicRows?: Record<string, unknown>[];

  invoiceNumber: string;
  status: "draft" | "sent" | "paid";
  date: any;
  dueDate?: any;
  amount: number;
  currency: string;
  notes: string;
  templateId?: string;
  columns?: ColumnDef[];
  topSection?: string;
  bottomSection?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Expense {
  id?: string;
  companyId: string;
  clientId: string;
  projectId?: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// Helper to strip undefined values recursively for Firestore compatibility
const cleanUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      clean[key] = cleanUndefined(obj[key]);
    }
  }
  return clean;
};

// --- Generic CRUD ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createRecord = async (collectionName: string, data: any) => {
  const cleanedData = cleanUndefined(data);
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, {
    ...cleanedData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateRecord = async (collectionName: string, id: string, data: any) => {
  const cleanedData = cleanUndefined(data);
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...cleanedData,
    updatedAt: serverTimestamp(),
  });
};

const getRecordsByCompany = async (collectionName: string, companyId: string): Promise<unknown[]> => {
  const q = query(
    collection(db, collectionName), 
    where("companyId", "==", companyId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown));
  // Sort by createdAt descending in memory to avoid composite index requirements
  return sortDocsByCreated(docs as unknown[]);
};

const getRecordById = async (collectionName: string, id: string): Promise<unknown> => {
  const docRef = doc(db, collectionName, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as unknown;
  }
  return null;
};

const deleteRecord = async (collectionName: string, id: string) => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

interface SortableDoc {
  createdAt?: { toMillis: () => number };
}

const sortDocsByCreated = (docs: unknown[]) => {
  return (docs as unknown[]).sort((a, b) => {
    const timeA = (a as SortableDoc).createdAt?.toMillis ? (a as SortableDoc).createdAt!.toMillis() : 0;
    const timeB = (b as SortableDoc).createdAt?.toMillis ? (b as SortableDoc).createdAt!.toMillis() : 0;
    return timeB - timeA;
  });
};

// --- Exports ---
export const dbApi = {
  // Company
  getCompaniesByUser: async (userId: string) => {
    const q = query(
      collection(db, "companies"), 
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in memory to avoid composite index
    return sortDocsByCreated(docs);
  },
  createCompany: (data: Company) => createRecord("companies", data),
  updateCompany: (id: string, data: Partial<Company>) => updateRecord("companies", id, data),
  getCompany: (id: string) => getRecordById("companies", id),
  deleteCompany: (id: string) => deleteRecord("companies", id),

  // Clients
  createClient: (data: Client) => createRecord("clients", data),
  updateClient: (id: string, data: Partial<Client>) => updateRecord("clients", id, data),
  getClients: (companyId: string) => getRecordsByCompany("clients", companyId),
  getClient: (id: string) => getRecordById("clients", id),
  deleteClient: (id: string) => deleteRecord("clients", id),

  // Projects
  createProject: (data: Project) => createRecord("projects", data),
  updateProject: (id: string, data: Partial<Project>) => updateRecord("projects", id, data),
  getProjects: (companyId: string) => getRecordsByCompany("projects", companyId),
  getAllProjectsAdmin: async () => {
    const colRef = collection(db, "projects");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  getProject: (id: string) => getRecordById("projects", id),
  deleteProject: (id: string) => deleteRecord("projects", id),

  // Quotations
  createQuotation: (data: Quotation) => createRecord("quotations", data),
  updateQuotation: (id: string, data: Partial<Quotation>) => updateRecord("quotations", id, data),
  getQuotations: (companyId: string) => getRecordsByCompany("quotations", companyId),
  getQuotation: (id: string) => getRecordById("quotations", id),
  deleteQuotation: (id: string) => deleteRecord("quotations", id),

  // Invoices
  createInvoice: async (data: Invoice) => {
    const invoiceId = await createRecord("invoices", data);
    
    // If linked to a quotation, update the billed amounts in the quotation
    if (data.quotationId && data.linkedItems && data.linkedItems.length > 0) {
      const quotation = await getRecordById("quotations", data.quotationId) as Quotation | null;
      if (quotation) {
        const payload: Partial<Quotation> = {};
        
        if (quotation.dynamicRows) {
          payload.dynamicRows = quotation.dynamicRows.map((row: Record<string, unknown>) => {
            const linked = data.linkedItems!.find((li: LinkedItem) => li.id === row.id);
            if (linked) {
              const currentBilled = (row.billedAmount as number) || 0;
              const newBilled = currentBilled + linked.amount;
              
              // Calculate total row amount safely
              let rowTotal = 0;
              if (typeof row.amount === 'number') {
                rowTotal = row.amount;
              } else {
                // Try to find a numeric value in a column labeled 'amount' or 'total'
                const totalKey = Object.keys(row).find(k => k.toLowerCase().includes('amount') || k.toLowerCase().includes('total'));
                if (totalKey && typeof row[totalKey] === 'number') {
                  rowTotal = row[totalKey];
                } else {
                  // Final fallback: highest number
                  Object.values(row).forEach(v => { if (typeof v === 'number' && v > rowTotal) rowTotal = v; });
                }
              }
              
              return { 
                ...row, 
                billedAmount: newBilled,
                isBilled: newBilled >= rowTotal 
              };
            }
            return row;
          });
        }
        
        if (quotation.phases) {
          payload.phases = quotation.phases.map((phase: QuotationPhase) => {
            const linked = data.linkedItems!.find((li: LinkedItem) => li.id === phase.id);
            if (linked) {
              const currentBilled = phase.billedAmount || 0;
              const newBilled = currentBilled + linked.amount;
              return { 
                ...phase, 
                billedAmount: newBilled,
                isBilled: newBilled >= phase.amount 
              };
            }
            return phase;
          });
        }

        await updateRecord("quotations", data.quotationId, payload as Record<string, unknown>);
      }
    } else if (data.quotationId && data.linkedPhases) {
      // Legacy fallback
      const quotation = await getRecordById("quotations", data.quotationId) as Quotation | null;
      if (quotation && quotation.phases) {
        const updatedPhases = quotation.phases.map((phase: QuotationPhase) => {
          if (data.linkedPhases!.includes(phase.id)) {
            return { ...phase, isBilled: true, billedAmount: phase.amount };
          }
          return phase;
        });
        await updateRecord("quotations", data.quotationId, { phases: updatedPhases });
      }
    }
    
    return invoiceId;
  },
  updateInvoice: (id: string, data: Partial<Invoice>) => updateRecord("invoices", id, data),
  getInvoices: (companyId: string) => getRecordsByCompany("invoices", companyId),
  getInvoice: (id: string) => getRecordById("invoices", id),
  deleteInvoice: async (id: string) => {
    // Fetch the invoice first to see if it's linked to a quotation
    const invoice = await getRecordById("invoices", id) as Invoice | null;
    
    if (invoice && invoice.quotationId) {
      const quotation = await getRecordById("quotations", invoice.quotationId) as Quotation | null;
      if (quotation) {
        const payload: Partial<Quotation> = {};

        if (invoice.linkedItems && invoice.linkedItems.length > 0) {
          if (quotation.dynamicRows) {
            payload.dynamicRows = quotation.dynamicRows.map((row: Record<string, unknown>) => {
              const linked = invoice.linkedItems!.find((li: LinkedItem) => li.id === row.id);
              if (linked) {
                const currentBilled = (row.billedAmount as number) || 0;
                const newBilled = Math.max(0, currentBilled - linked.amount);
                
                let rowTotal = 0;
                if (row.amount !== undefined) {
                  rowTotal = Number(row.amount);
                } else {
                  Object.values(row).forEach(v => { if (typeof v === 'number' && v > rowTotal) rowTotal = v; });
                }

                return {
                  ...row,
                  billedAmount: newBilled,
                  isBilled: newBilled > 0 && newBilled >= rowTotal
                };
              }
              return row;
            });
          }

          if (quotation.phases) {
            payload.phases = quotation.phases.map((phase: QuotationPhase) => {
              const linked = invoice.linkedItems!.find((li: LinkedItem) => li.id === phase.id);
              if (linked) {
                const currentBilled = phase.billedAmount || 0;
                const newBilled = Math.max(0, currentBilled - linked.amount);
                return {
                  ...phase,
                  billedAmount: newBilled,
                  isBilled: newBilled > 0 && newBilled >= phase.amount
                };
              }
              return phase;
            });
          }
        } else if (invoice.linkedPhases && invoice.linkedPhases.length > 0) {
          // Legacy fallback
          if (quotation.phases) {
            payload.phases = quotation.phases.map((phase: QuotationPhase) => {
              if (invoice.linkedPhases!.includes(phase.id)) {
                return { ...phase, isBilled: false, billedAmount: 0 };
              }
              return phase;
            });
          }
        }

        if (Object.keys(payload).length > 0) {
          await updateRecord("quotations", invoice.quotationId, payload);
        }
      }
    }

    await deleteRecord("invoices", id);
  },

  // Expenses
  createExpense: (data: Expense) => createRecord("expenses", data),
  updateExpense: (id: string, data: Partial<Expense>) => updateRecord("expenses", id, data),
  getExpenses: (companyId: string) => getRecordsByCompany("expenses", companyId),
  getExpense: (id: string) => getRecordById("expenses", id),
  deleteExpense: (id: string) => deleteRecord("expenses", id),

  // Sprints
  createSprint: (data: Sprint) => createRecord("sprints", data),
  updateSprint: (id: string, data: Partial<Sprint>) => updateRecord("sprints", id, data),
  getSprintsByProject: async (projectId: string) => {
    const q = query(collection(db, "sprints"), where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sprint[];
  },
  deleteSprint: (id: string) => deleteRecord("sprints", id),

  // Tasks
  createTask: (data: Task) => createRecord("tasks", data),
  updateTask: (id: string, data: Partial<Task>) => updateRecord("tasks", id, data),
  getTasksByProject: async (projectId: string) => {
    const q = query(collection(db, "tasks"), where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
  },
  deleteTask: (id: string) => deleteRecord("tasks", id),
};
