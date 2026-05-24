"use client";

import React, { useState, useRef } from "react";
import { Company } from "@/lib/firebase/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Download, Loader2, Sparkles, Palette, FileText, Check, Sliders, ToggleLeft } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import Script from "next/script";

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface CompanyLetterheadProps {
  company: Company;
}

const PRESET_COLORS = [
  { name: "Royal Navy", value: "#1e3a8a" },
  { name: "Deep Emerald", value: "#064e3b" },
  { name: "Teal Glow", value: "#0d9488" },
  { name: "Slate Grey", value: "#334155" },
  { name: "Crimson Red", value: "#991b1b" },
  { name: "Bronze Gold", value: "#b45309" }
];

export function CompanyLetterhead({ company }: CompanyLetterheadProps) {
  const [primaryColor, setPrimaryColor] = useState("#1e3a8a");
  const [customColor, setCustomColor] = useState("#1e3a8a");
  
  // Toggles
  const [showLogo, setShowLogo] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showTaxId, setShowTaxId] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);

  // Advanced styling configurations
  const [accentStyle, setAccentStyle] = useState<"double" | "single" | "gradient">("double");
  const [topAccentHeight, setTopAccentHeight] = useState<"thick" | "medium" | "none">("medium");

  // Content (Initialized with HTML since it uses the Rich Text Editor)
  const [letterBody, setLetterBody] = useState(
    `<p><strong>May 25, 2026</strong></p>
<p>To,<br>
<strong>[Recipient Name]</strong><br>
[Recipient Designation]<br>
[Recipient Company]<br>
[Recipient Address]</p>
<br>
<p><strong>Subject: Letter of Intent / Project Update</strong></p>
<br>
<p>Dear Client,</p>
<p>This is a live preview of your company letterhead. You can type your letter directly in this rich text editor. The layout is optimized to look premium, balanced, and highly professional.</p>
<p>Our corporate letterheads feature a top colored branding accent, structured contact layouts, a subtle watermark in the center of the page, and matching bottom footer bands. You can adjust all options in the control panel on the left.</p>
<p>Sincerely,</p>
<p><strong>[Your Name]</strong><br>
[Your Title]<br>
<strong>${company.name || "Company Name"}</strong></p>`
  );

  const [downloading, setDownloading] = useState(false);
  const [documentName, setDocumentName] = useState("letterhead");
  const documentRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (typeof html2pdf === "undefined") {
      alert("PDF library still loading. Please try again in a moment.");
      return;
    }

    const element = documentRef.current;
    if (!element) {
      alert("Letterhead content not found.");
      return;
    }

    setDownloading(true);
    
    // Scale container to normal scale for clean capture
    const originalStyle = element.getAttribute("style") || "";

    try {
      // Force 100% size and reset absolute positioning for accurate PDF print rendering
      element.style.position = "relative";
      element.style.transform = "none";
      element.style.top = "0";
      element.style.left = "0";
      element.style.margin = "0";
      element.style.boxShadow = "none";
      element.style.overflow = "hidden";
      element.style.border = "none";
      element.style.outline = "none";

      const cleanDocName = documentName.trim() 
        ? documentName.trim().replace(/[^a-z0-9_\-]/gi, "_").toLowerCase()
        : "letterhead";
      const filename = `${cleanDocName}.pdf`;
      
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          width: 794, // A4 width at 96 DPI
          height: 1122, // A4 height at 96 DPI
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      // Restore styles
      element.setAttribute("style", originalStyle);
      setDownloading(false);
    }
  };

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    setCustomColor(color);
  };

  return (
    <div className="space-y-6">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="afterInteractive" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Design Tuning Card */}
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Letterhead Fine-Tuning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              
              {/* Top Band Height */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Header Accent Band</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "thick", label: "Thick" },
                    { id: "medium", label: "Medium" },
                    { id: "none", label: "None" }
                  ].map(h => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setTopAccentHeight(h.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        topAccentHeight === h.id 
                          ? "bg-primary/20 text-white border-primary" 
                          : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Line Style */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Divider Accent Line</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "double", label: "Double" },
                    { id: "single", label: "Single" },
                    { id: "gradient", label: "Gradient" }
                  ].map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccentStyle(a.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        accentStyle === a.id 
                          ? "bg-primary/20 text-white border-primary" 
                          : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branding Color */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" /> Branding Color Scheme
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => handleColorChange(c.value)}
                      title={c.name}
                      className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                      style={{ backgroundColor: c.value }}
                    >
                      {primaryColor === c.value && <Check className="h-4 w-4 text-white drop-shadow" />}
                    </button>
                  ))}
                  
                  {/* Custom color picker */}
                  <div className="relative w-7 h-7 rounded-full border border-white/10 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-110 transition-transform">
                    <input 
                      type="color" 
                      value={customColor} 
                      onChange={(e) => handleColorChange(e.target.value)} 
                      className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ToggleLeft className="h-3.5 w-3.5" /> Content Field Visibility
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showLogo} 
                      onChange={e => setShowLogo(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Company Logo
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showWatermark} 
                      onChange={e => setShowWatermark(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Logo Watermark
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showPhone} 
                      onChange={e => setShowPhone(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Phone Number
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showEmail} 
                      onChange={e => setShowEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Email Address
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showAddress} 
                      onChange={e => setShowAddress(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Business Address
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showTaxId} 
                      onChange={e => setShowTaxId(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Tax ID
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showFooter} 
                      onChange={e => setShowFooter(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                    />
                    Letterhead Footer
                  </label>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Letter Editor Card */}
          <Card className="glass border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Letter Text Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Write the content of your letter below using the rich text tools. Clear this box to export a blank branding template.
                </p>
                <div className="rich-editor-wrapper">
                  <RichTextEditor value={letterBody} onChange={setLetterBody} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Document Name (PDF Filename)</label>
                <Input 
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g. release_planning_model"
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>

              <Button 
                onClick={handleDownload} 
                disabled={downloading}
                className="w-full shadow-lg shadow-primary/20 gap-2 h-11"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? "Generating PDF..." : "Download Letterhead PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex justify-center overflow-x-auto pb-4 scrollbar-hide">
            
            {/* Mathematically scaled A4 wrapper container */}
            <div 
              className="w-[126mm] h-[178.2mm] overflow-hidden relative shadow-2xl rounded border border-white/10 flex-shrink-0 bg-white"
            >
              {/* Target Letterhead Canvas */}
              <div 
                ref={documentRef}
                id="letterhead-document"
                className="absolute top-0 left-0 bg-white text-black print:shadow-none flex flex-col select-none"
                style={{ 
                  width: "210mm", 
                  height: "297mm", 
                  transform: "scale(0.6)",
                  transformOrigin: "top left",
                  boxSizing: "border-box",
                  overflow: "hidden"
                }}
              >
                
                {/* Advanced Header Accent Band */}
                {topAccentHeight !== "none" && (
                  <div 
                    className="w-full transition-all duration-300" 
                    style={{ 
                      height: topAccentHeight === "thick" ? "12px" : "6px",
                      backgroundColor: primaryColor 
                    }} 
                  />
                )}
                
                {/* Letterhead Header Grid */}
                <div className="px-[20mm] pt-[8mm] pb-3 flex justify-between items-start">
                  
                  {/* Left Side: Logo & Official Seal Tag */}
                  <div className="space-y-3 flex-1">
                    {showLogo && company.logoUrl ? (
                      <img src={company.logoUrl} alt="Logo" className="max-h-[60px] max-w-[150px] object-contain" />
                    ) : (
                      <h2 className="text-2xl font-black tracking-tight" style={{ color: primaryColor }}>
                        {company.name || "COMPANY NAME"}
                      </h2>
                    )}
                  </div>
                  
                  {/* Right Side: Branded Address details */}
                  <div className="text-right text-[10px] text-gray-500 space-y-1 max-w-[280px]">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: primaryColor }}>
                      {company.name}
                    </h3>
                    
                    <div className="space-y-0.5 leading-tight font-medium">
                      {showAddress && company.address && (
                        <p className="whitespace-pre-line leading-tight text-gray-600">{company.address}</p>
                      )}
                      {showPhone && company.phone && (
                        <p className="text-gray-600">Tel: <span className="font-semibold text-gray-800">{company.phone}</span></p>
                      )}
                      {showEmail && company.email && (
                        <p className="text-gray-600">Email: <span className="font-semibold text-gray-800">{company.email}</span></p>
                      )}
                      {showTaxId && company.taxId && (
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold mt-1">
                          TAX ID: {company.taxId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customizable Divider Accent Line */}
                <div className="px-[20mm]">
                  {accentStyle === "double" && (
                    <div className="space-y-0.5">
                      <div className="h-0.5 w-full" style={{ backgroundColor: primaryColor }} />
                      <div className="h-[1px] w-full bg-gray-200" />
                    </div>
                  )}
                  {accentStyle === "single" && (
                    <div className="h-0.5 w-full" style={{ backgroundColor: primaryColor }} />
                  )}
                  {accentStyle === "gradient" && (
                    <div 
                      className="h-[3px] w-full rounded" 
                      style={{ 
                        background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}40, transparent)` 
                      }} 
                    />
                  )}
                </div>

                {/* Central Faint Watermark (Highly advanced, desaturated logo background) */}
                {showWatermark && showLogo && company.logoUrl && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.035]"
                    style={{ top: "60px" }}
                  >
                    <img 
                      src={company.logoUrl} 
                      alt="Watermark" 
                      className="w-[300px] h-[300px] object-contain grayscale" 
                    />
                  </div>
                )}

                {/* Letter Content Area (Prose styled, parses HTML from Tiptap Editor) */}
                <div 
                  id="letterhead-content"
                  className="flex-1 px-[20mm] pt-[6mm] pb-[12mm] text-[14px] text-gray-800 leading-relaxed font-sans font-normal z-10"
                >
                  {letterBody ? (
                    <div dangerouslySetInnerHTML={{ __html: letterBody }} />
                  ) : (
                    <div className="h-full border border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-8 bg-gray-50/50">
                      <Sparkles className="h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-xs font-semibold text-gray-400">Blank Template Mode</p>
                      <p className="text-[10px] text-gray-400 text-center max-w-[220px] mt-1">
                        Your letterhead will be exported with a blank body area, perfect for custom typing or physical printing.
                      </p>
                    </div>
                  )}
                </div>

                {/* Corporate Footer */}
                {showFooter && (
                  <div className="mt-auto pb-[8mm] z-10">
                    {/* Top divider */}
                    <div className="px-[20mm] mb-4">
                      <div className="h-[1px] w-full bg-gray-100 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                      </div>
                    </div>
                    
                    {/* Footnote details */}
                    <div className="px-[20mm] flex justify-between items-center text-[9px] text-gray-400 font-medium">
                      <div>
                        <span className="font-bold text-gray-700">{company.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                        <span>Page 1 of 1</span>
                      </div>
                    </div>
                    
                    {/* Subtle bottom-edge accent bar to match top header banner */}
                    {topAccentHeight !== "none" && (
                      <div 
                        className="w-full h-1 mt-4" 
                        style={{ backgroundColor: primaryColor }} 
                      />
                    )}
                  </div>
                )}
                
              </div>
            </div>

          </div>
          
          {/* Label indicating preview is scaled */}
          <div className="text-center text-xs text-slate-400 w-full flex items-center justify-center gap-1.5 bg-white/5 py-2 rounded-lg border border-white/5 max-w-[420px] mt-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Live Render Preview (Scale: 60%)
          </div>

        </div>

      </div>

      {/* Local styles block for clean Tiptap HTML rendering */}
      <style dangerouslySetInnerHTML={{__html: `
        #letterhead-content p {
          margin-bottom: 0.8rem;
          line-height: 1.65;
        }
        #letterhead-content strong {
          font-weight: 700;
          color: #111827;
        }
        #letterhead-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0 !important;
          margin-bottom: 0.8rem;
        }
        #letterhead-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0 !important;
          margin-bottom: 0.8rem;
        }
        #letterhead-content li {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          line-height: 1.65;
        }
        #letterhead-content li p, #letterhead-content li div {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          display: inline;
        }
        #letterhead-content > *:first-child,
        #letterhead-content > div > *:first-child {
          margin-top: 0 !important;
        }
        #letterhead-content h2, #letterhead-content h3 {
          font-size: 1.35em;
          font-weight: 800;
          margin-top: 1.2rem;
          margin-bottom: 0.5rem;
          color: ${primaryColor};
          letter-spacing: -0.025em;
        }
        #letterhead-content blockquote {
          border-left: 3px solid ${primaryColor};
          padding-left: 1rem;
          color: #4b5563;
          font-style: italic;
          margin: 1rem 0;
          background-color: #f9fafb;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
      `}} />

    </div>
  );
}
