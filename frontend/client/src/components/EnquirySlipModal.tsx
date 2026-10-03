import React from "react";
import { X, Printer, ShieldCheck, MapPin, Phone, Mail, FileText } from "lucide-react";

interface EnquirySlipModalProps {
  enquiry: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EnquirySlipModal({ enquiry, isOpen, onClose }: EnquirySlipModalProps) {
  if (!isOpen || !enquiry) return null;

  const enquiryDate = new Date(enquiry.created_at || Date.now());
  const formattedTime = enquiryDate.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  }) + " • " + enquiryDate.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden my-6 print:m-0 print:border-none print:shadow-none print:w-full print:rounded-none">
        
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 bg-[#20352b] text-[#fbf8f1] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#c8a36a]" />
            <span className="font-serif font-bold text-sm tracking-wide text-white">
              Official Enquiry Slip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c8a36a] hover:bg-[#b8935a] text-[#20352b] font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Printer size={13} />
              <span>Download Slip (PDF) / Print</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full text-[#fbf8f1]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-8 md:p-9 space-y-5 text-[#20352b] font-sans printable-invoice bg-[#fbf8f1]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#20352b]/15">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Casa Nest" className="w-11 h-11 object-contain mix-blend-multiply" />
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-[#20352b] leading-tight">Casa Nest Homestay</h1>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c8a36a] font-bold">Kashi • Varanasi</span>
                </div>
              </div>
              <p className="text-[11px] text-[#555] mt-2 flex items-center gap-1.5">
                <MapPin size={11} className="text-[#c8a36a] shrink-0" />
                <span>B23/33 Plot 58, Gurudham Colony, Varanasi, UP - 221010</span>
              </p>
              <p className="text-[11px] text-[#555] flex items-center gap-1.5 mt-0.5">
                <Phone size={11} className="text-[#c8a36a] shrink-0" />
                <span>+91 84000 95434 • Email: Info@casanesthomestay.in</span>
              </p>
            </div>
            <div className="sm:text-right bg-[#f5f0e8] p-3.5 rounded-2xl border border-[#20352b]/10 text-xs shrink-0">
              <span className="text-[10px] uppercase font-mono font-bold text-[#77766c] block">Enquiry No.</span>
              <span className="font-mono font-bold text-sm text-[#20352b] block">ENQ-{String(enquiry.id).padStart(5, "0")}</span>
              <span className="text-[10px] text-[#77766c] block mt-1">
                <strong>Submitted:</strong> {formattedTime}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#f5f0e8]/90 border border-[#20352b]/10 space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#c8a36a] block">Enquiry Details</span>
            <p className="font-bold text-sm text-[#20352b]">{enquiry.name}</p>
            <p className="text-[#555] flex items-center gap-1.5"><Mail size={12} className="text-[#c8a36a]" /> {enquiry.email}</p>
            {enquiry.phone && <p className="text-[#555] flex items-center gap-1.5"><Phone size={12} className="text-[#c8a36a]" /> {enquiry.phone}</p>}
            <div className="pt-2 mt-1 border-t border-[#20352b]/10">
              <span className="text-[#77766c] font-medium block">Topic:</span>
              <span className="font-bold font-mono text-[#20352b] mt-1 block">{enquiry.subject}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#20352b] text-[#fbf8f1] shadow-xs">
             <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-bold block mb-1">Message / Request</span>
             <p className="text-sm italic opacity-90">"{enquiry.message}"</p>
          </div>

          <div className="pt-4 border-t border-[#20352b]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#77766c]">
            <div>
              <p className="font-semibold text-[#20352b]">We have received your enquiry.</p>
              <p>Our host will contact you shortly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
