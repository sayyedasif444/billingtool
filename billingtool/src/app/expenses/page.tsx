"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { dbApi, Expense, Client, Project } from "@/lib/firebase/db";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Wallet,
  TrendingDown,
  Calendar,
  Tag,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ExpensesPage() {
  const { activeCompany } = useCompany();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Expense>>({
    amount: 0,
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    clientId: "",
    projectId: ""
  });

  useEffect(() => {
    if (activeCompany) {
      loadData();
    }
  }, [activeCompany]);

  const loadData = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [expData, clientData, projectData] = await Promise.all([
        dbApi.getExpenses(activeCompany.id!),
        dbApi.getClients(activeCompany.id!),
        dbApi.getProjects(activeCompany.id!)
      ]);
      setExpenses(expData as Expense[]);
      setClients(clientData as Client[]);
      setProjects(projectData as Project[]);
    } catch (err) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    try {
      if (editingExpense) {
        await dbApi.updateExpense(editingExpense.id!, formData);
      } else {
        await dbApi.createExpense({
          ...formData,
          companyId: activeCompany.id!,
        } as Expense);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      setFormData({
        amount: 0,
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        clientId: "",
        projectId: ""
      });
      loadData();
    } catch (err) {
      
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await dbApi.deleteExpense(id);
      loadData();
    }
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Expense Management</h1>
          <p className="text-slate-400 text-sm md:text-base">Track and categorize your business costs</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setIsModalOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/5 bg-background/40">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Expenses</p>
                <h3 className="text-2xl font-bold text-white mt-1">₹{totalExpenses.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="glass border-white/5 bg-background/40 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold">Expense Ledger</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search expenses..." 
                  className="pl-10 w-64 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="border-white/10 hover:bg-white/5">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Date & Category</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Client / Project</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No expenses found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => {
                    const client = clients.find(c => c.id === expense.clientId);
                    const project = projects.find(p => p.id === expense.projectId);
                    return (
                      <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{new Date(expense.date).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {expense.category}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{expense.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{client?.name || 'General'}</span>
                            {project && <span className="text-xs text-slate-400">{project.name}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-red-400">- ₹{Number(expense.amount).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                              onClick={() => {
                                setEditingExpense(expense);
                                setFormData(expense);
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                              onClick={() => handleDelete(expense.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg glass border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                {editingExpense ? 'Edit Expense' : 'Log New Expense'}
              </CardTitle>
              <CardDescription>Enter the details of your business expenditure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Amount (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      required 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Date</label>
                    <Input 
                      type="date" 
                      required 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white outline-none focus:border-primary/50"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="" disabled className="bg-slate-900">Select Category</option>
                    <option value="Software" className="bg-slate-900">Software / Tools</option>
                    <option value="Outsourcing" className="bg-slate-900">Outsourcing / Freelancing</option>
                    <option value="Hardware" className="bg-slate-900">Hardware / Assets</option>
                    <option value="Travel" className="bg-slate-900">Travel / Meetings</option>
                    <option value="Marketing" className="bg-slate-900">Marketing / Ads</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <Input 
                    placeholder="E.g. Monthly Vercel Subscription" 
                    required 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Client (Optional)</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white outline-none focus:border-primary/50"
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    >
                      <option value="" className="bg-slate-900">General Expense</option>
                      {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Project (Optional)</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-white outline-none focus:border-primary/50"
                      value={formData.projectId}
                      onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                      disabled={!formData.clientId}
                    >
                      <option value="" className="bg-slate-900">No Project</option>
                      {projects.filter(p => p.clientId === formData.clientId).map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
