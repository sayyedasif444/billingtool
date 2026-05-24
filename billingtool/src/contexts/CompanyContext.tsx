"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { dbApi, Company } from "@/lib/firebase/db";

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  loading: boolean;
  setActiveCompany: (company: Company) => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  activeCompany: null,
  loading: true,
  setActiveCompany: () => {},
  refreshCompanies: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const isCreatingRef = useRef(false);

  const loadCompanies = async () => {
    if (!user) {
      setCompanies([]);
      setActiveCompanyState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data = await dbApi.getCompaniesByUser(user.uid);
      
      // If the user has no companies, auto-create a default one
      // We use isCreatingRef to prevent React StrictMode from creating it twice simultaneously
      if (data.length === 0 && !isCreatingRef.current) {
        isCreatingRef.current = true;
        const newCompany: Company = {
          userId: user.uid,
          name: "Personal Workspace",
          email: user.email || "",
          phone: "",
          address: "",
          taxId: "",
          bankDetails: ""
        };
        const newId = await dbApi.createCompany(newCompany);
        const createdCompany = await dbApi.getCompany(newId);
        if (createdCompany) {
          data = [createdCompany];
        }
        isCreatingRef.current = false;
      }

      setCompanies(data as Company[]);
      
      // Auto-select first company if none selected
      if (data.length > 0 && !activeCompany) {
        setActiveCompanyState(data[0] as Company);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [user]);

  const setActiveCompany = (company: Company) => {
    setActiveCompanyState(company);
  };

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, loading, setActiveCompany, refreshCompanies: loadCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
