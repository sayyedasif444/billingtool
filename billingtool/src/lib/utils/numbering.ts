
export const getInitials = (name: string) => {
  if (!name) return "";
  return name.split(/[\s-]+/).map(word => word[0]?.toUpperCase()).join('');
};

export const generateRefNumber = (companyName: string, clientName: string, type: "QT" | "INV", count: number = 0) => {
  const comp = getInitials(companyName);
  const client = getInitials(clientName);
  
  const date = new Date();
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString().slice(-2);
  const ddmmyy = `${d}${m}${y}`;
  
  const seq = (count + 1).toString().padStart(4, '0');
  
  const prefix = comp && client ? `${comp}-${client}` : (comp || client || "DOC");
  return `${prefix}-${type}-${ddmmyy}${seq}`;
};
