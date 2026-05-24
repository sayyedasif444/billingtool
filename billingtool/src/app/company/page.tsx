"use client";

import { useState, useEffect } from "react";
import { dbApi, Company } from "@/lib/firebase/db";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Building2, Save, Loader2, Upload, AlertCircle, FileText } from "lucide-react";
import { CompanyLetterhead } from "@/components/CompanyLetterhead";

export default function CompanyPage() {
  const { user } = useAuth();
  const { activeCompany, companies, setActiveCompany, refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [company, setCompany] = useState<Partial<Company>>({
    name: "", email: "", phone: "", address: "", taxId: "", bankDetails: "", logoUrl: ""
  });

  useEffect(() => {
    if (activeCompany && !isCreatingNew) {
      setCompany(activeCompany);
    }
    setLoading(false);
  }, [activeCompany, isCreatingNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setCompany({
      name: "", email: "", phone: "", address: "", taxId: "", bankDetails: "", logoUrl: ""
    });
  };

  const handleCancelNew = () => {
    setIsCreatingNew(false);
    if (activeCompany) {
      setCompany(activeCompany);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      alert("Logo file is too large. Please keep it under 500KB.");
      return;
    }

    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompany(prev => ({ ...prev, logoUrl: reader.result as string }));
      setUploadingLogo(false);
      alert("Logo added! Remember to save your changes.");
    };
    reader.onerror = () => {
      alert("Failed to read file.");
      setUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (company.id && !isCreatingNew) {
        await dbApi.updateCompany(company.id, company);
        await refreshCompanies();
        setCompany({ ...company }); // Sync local state
      } else {
        const newId = await dbApi.createCompany({ ...company, userId: user.uid } as Company);
        await refreshCompanies();
        
        // Find the new company in the updated list and set it as active
        const updatedCompanies = await dbApi.getCompaniesByUser(user.uid) as Company[];
        const newCompany = updatedCompanies.find(c => c.id === newId);
        if (newCompany) {
          setActiveCompany(newCompany as Company);
          setCompany(newCompany as Company); // Update local state to show upload
        }
        
        setIsCreatingNew(false);
      }
      alert("Company details saved successfully!");
    } catch (error) {
      alert("Failed to save company details");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeCompany?.id) return;
    
    setSaving(true);
    try {
      const [cData, pData, qData, iData, eData] = await Promise.all([
        dbApi.getClients(activeCompany.id),
        dbApi.getProjects(activeCompany.id),
        dbApi.getQuotations(activeCompany.id),
        dbApi.getInvoices(activeCompany.id),
        dbApi.getExpenses(activeCompany.id)
      ]);

      const hasData = 
        cData.length > 0 || 
        pData.length > 0 || 
        qData.length > 0 || 
        iData.length > 0 || 
        eData.length > 0;

      if (hasData) {
        alert("Cannot delete workspace because it contains data (Clients, Projects, or Financials). Delete all items within the workspace first.");
        return;
      }

      if (!confirm(`Are you sure you want to delete ${activeCompany.name}?`)) {
        return;
      }

      await dbApi.deleteCompany(activeCompany.id);
      await refreshCompanies();
      alert("Company deleted successfully.");
    } catch (error) {
      alert("Failed to delete company.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            {isCreatingNew ? "Create New Workspace" : "Company Profile"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isCreatingNew ? "Set up a new business workspace." : "Manage your business details and branding."}
          </p>
        </div>
        <div className="flex gap-3">
          {!isCreatingNew ? (
            <Button onClick={handleCreateNew} variant="outline" className="gap-2">
              Add New Workspace
            </Button>
          ) : (
            <Button onClick={handleCancelNew} variant="ghost">
              Cancel
            </Button>
          )}
          {activeCompany?.id && !isCreatingNew && (
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="shadow-lg shadow-red-500/20">
              Delete Workspace
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-xl">General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Company Name</label>
                <Input name="name" value={company.name || ""} onChange={handleChange} placeholder="Acme Corp" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input type="email" name="email" value={company.email || ""} onChange={handleChange} placeholder="billing@acme.com" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Phone Number</label>
                <Input name="phone" value={company.phone || ""} onChange={handleChange} placeholder="+1 234 567 890" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Business Address</label>
                <Input name="address" value={company.address || ""} onChange={handleChange} placeholder="123 Main St, City, Country" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tax ID / VAT Number</label>
                <Input name="taxId" value={company.taxId || ""} onChange={handleChange} placeholder="Optional" />
              </div>
              {company.id && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Company Logo</label>
                  <div className="flex gap-4 items-center">
                    {company.logoUrl && (
                      <div className="h-12 w-12 bg-white/5 rounded p-1 border border-white/10 flex-shrink-0">
                        <img src={company.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        disabled={uploadingLogo}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                      <Button type="button" variant="outline" className="w-full gap-2 pointer-events-none" disabled={uploadingLogo}>
                        {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingLogo ? "Uploading..." : "Upload Logo File"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {!company.id && (
                <div className="space-y-2 flex items-end">
                  <p className="text-sm text-slate-400 italic bg-white/5 p-3 rounded-lg border border-white/5 w-full">
                    <AlertCircle className="h-4 w-4 inline mr-2 text-primary" />
                    You can upload a logo after saving the company profile.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-xl">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bank Details</label>
              <textarea 
                name="bankDetails" 
                value={company.bankDetails || ""} 
                onChange={handleChange} 
                className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Bank Name: XYZ Bank&#10;Account Name: Acme Corp&#10;Account Number: 123456789&#10;SWIFT/BIC: XYZBXXX" 
              />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={saving} className="w-full md:w-auto shadow-lg shadow-primary/20 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isCreatingNew ? "Create Workspace" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {company.id && !isCreatingNew && (
        <div className="pt-6 border-t border-white/10 space-y-4 animate-in fade-in duration-500">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Company Letterhead
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Customize and download a premium corporate letterhead for {company.name}.
            </p>
          </div>
          <CompanyLetterhead company={company as Company} />
        </div>
      )}
    </div>
  );
}
