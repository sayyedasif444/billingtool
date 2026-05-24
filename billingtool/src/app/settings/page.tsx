"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Settings as SettingsIcon, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, deleteAccount } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      await deleteAccount();
      router.push("/login");
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        alert("This operation is sensitive and requires recent authentication. Please log out and log back in before deleting your account.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 w-full space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and security.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-400 leading-relaxed">
              Deleting your account is **permanent**. All your data, including companies, clients, quotations, and invoices, will be permanently removed and cannot be recovered.
            </div>

            {!confirmDelete ? (
              <Button 
                variant="destructive" 
                onClick={() => setConfirmDelete(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete My Account
              </Button>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-500">Are you absolutely sure?</h4>
                    <p className="text-xs text-red-400/80 mt-1">This action cannot be undone. Please confirm you want to permanently delete your account.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete Everything"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmDelete(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
