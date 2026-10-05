import React, { useEffect } from "react";
import { X, Clock, Leaf } from "lucide-react";

interface BreakfastMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: "Sandwich", price: "80" },
  { name: "Poha", price: "120" },
  { name: "Upma", price: "120" },
  { name: "Idly", price: "80" },
  { name: "Uttapam Butter", price: "120 / 150" },
  { name: "Tea", price: "30" },
  { name: "Toast Butter", price: "60" },
  { name: "Maggi Plain", price: "90" },
  { name: "Cold Coffee", price: "110" },
  { name: "Hot Coffee", price: "30" },
  { name: "Cheese Pasta", price: "150" },
  { name: "Aalu Paratha", price: "120" },
  { name: "Paneer Paratha", price: "160" },
  { name: "Kachori Sabji", price: "130" },
  { name: "Milk", price: "50" },
  { name: "Lassi", price: "80" },
];

export default function BreakfastMenuModal({ isOpen, onClose }: BreakfastMenuModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div 
        className="relative w-full max-w-md bg-[#f6f4ee] overflow-hidden shadow-2xl p-2 rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner Border */}
        <div className="border-[1.5px] border-[#4a5d23] w-full h-full p-6 relative flex flex-col rounded-sm">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-[#e8e4d9] text-[#2a4535] hover:bg-[#d5dac3] transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {/* Corner Leaves - Approximated with SVG */}
          <svg className="absolute top-0 left-0 w-28 h-28 text-[#6b7b4d] opacity-90" viewBox="0 0 100 100" fill="currentColor" style={{ transform: 'translate(-10px, -10px)' }}>
            <path d="M0,0 C30,10 40,40 20,60 C40,40 60,30 80,40 C60,20 40,0 0,0 Z" />
            <path d="M0,20 C20,30 30,50 10,70 C30,50 50,40 70,50 C50,30 30,10 0,20 Z" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-36 h-36 text-[#6b7b4d] opacity-90" viewBox="0 0 100 100" fill="currentColor" style={{ transform: 'translate(10px, 10px) rotate(180deg)' }}>
            <path d="M0,0 C30,10 40,40 20,60 C40,40 60,30 80,40 C60,20 40,0 0,0 Z" />
            <path d="M0,20 C20,30 30,50 10,70 C30,50 50,40 70,50 C50,30 30,10 0,20 Z" />
            <path d="M20,0 C40,10 50,40 30,60 C50,40 70,30 90,40 C70,20 50,0 20,0 Z" />
          </svg>

          {/* Header Section */}
          <div className="relative z-10 flex flex-col items-center mt-2 mb-4">
            <div className="flex flex-col items-center">
              {/* Logo Icon */}
              <div className="relative mb-0.5">
                <svg width="48" height="28" viewBox="0 0 40 24" fill="none" stroke="#2a4535" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 22 L20 4 L38 22" />
                  <rect x="16" y="12" width="8" height="8" fill="#2a4535" stroke="none" />
                  <rect x="18" y="14" width="4" height="4" fill="#f6f4ee" stroke="none" />
                  <path d="M20 14 L20 18 M18 16 L22 16" stroke="#2a4535" strokeWidth="1" />
                </svg>
              </div>
              
              {/* Logo Text */}
              <div className="flex items-end mb-3">
                <h1 className="text-[2.75rem] leading-none text-[#2a4535] font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>Casa Nest</h1>
                <Leaf className="text-[#556b2f] w-5 h-5 ml-1 mb-2 transform -rotate-12" />
              </div>

              {/* Subtitles */}
              <div className="flex items-center gap-3 mb-1.5 w-full max-w-[280px]">
                <div className="h-[1px] flex-1 bg-[#2a4535]/60"></div>
                <h2 className="text-[#2a4535] text-[11px] font-semibold tracking-[0.15em] whitespace-nowrap">BEVERAGE & SNACKS MENU</h2>
                <div className="h-[1px] flex-1 bg-[#2a4535]/60"></div>
              </div>
              <p className="text-[8px] tracking-[0.2em] text-[#2a4535] uppercase font-medium mt-1">Good Food <span className="mx-1">•</span> Better Stays</p>
            </div>
          </div>

          {/* Menu Table */}
          <div className="relative z-10 flex-1 overflow-hidden flex flex-col mt-2">
            <div className="flex justify-between items-center bg-[#e8e4d9] px-4 py-1.5 mb-2.5 rounded-sm">
              <span className="text-[#2a4535] font-semibold text-[10px] tracking-widest">ITEM</span>
              <span className="text-[#2a4535] font-semibold text-[10px] tracking-widest">PRICE (₹)</span>
            </div>
            
            <div className="overflow-y-auto px-2 pb-2 space-y-1 custom-scrollbar" style={{ maxHeight: '42vh' }}>
              {menuItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-[14px] font-serif text-[#2a4535]">{item.name}</span>
                  <span className="text-[14px] font-serif text-[#2a4535]">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section */}
          <div className="relative z-10 mt-3 flex flex-col items-center">
            {/* Prep Time Box */}
            <div className="border border-[#2a4535]/40 rounded-md px-6 py-2 mb-3 bg-[#eef0e5] flex items-center gap-4 shadow-sm">
              <Clock className="text-[#2a4535] w-5 h-5" />
              <div className="h-7 w-[1px] bg-[#2a4535]/40"></div>
              <div className="flex flex-col">
                <span className="text-[7px] text-[#2a4535] tracking-[0.1em] uppercase font-medium">Preparation Time</span>
                <span className="text-[#2a4535] text-base font-serif font-bold tracking-widest">30 MINUTES</span>
              </div>
            </div>

            {/* Bottom Text */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#2a4535] font-serif italic text-[13px]">Freshly Prepared</span>
              <span className="w-1 h-1 rounded-full bg-[#2a4535]"></span>
              <span className="text-[#2a4535] font-serif italic text-[13px]">Served with Love</span>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <div className="w-6 h-[1px] bg-[#2a4535]/50"></div>
              <Leaf className="text-[#556b2f] w-3 h-3 transform rotate-45" />
              <div className="w-6 h-[1px] bg-[#2a4535]/50"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}


