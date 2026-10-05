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
        className="relative w-full max-w-md bg-[#fdfaf5] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#e8dcc4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner leaves */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none">
           <Leaf size={120} className="text-[#4a6b53] rotate-45 transform translate-x-8 translate-y-8" />
        </div>
        <div className="absolute top-0 left-0 w-24 h-24 opacity-20 pointer-events-none">
           <Leaf size={80} className="text-[#4a6b53] -rotate-135 transform -translate-x-4 -translate-y-4" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#f5f0e8] text-[#20352b] hover:bg-[#e6ddcf] transition-colors"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8 pt-10 text-center relative z-0">
          {/* Header */}
          <div className="mb-6 border-b border-[#20352b]/10 pb-4">
            <h2 className="text-4xl font-serif text-[#2a4535] mb-1">Casa Nest</h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="h-px w-8 bg-[#20352b]/30"></span>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#20352b]">BEVERAGE & SNACKS MENU</span>
              <span className="h-px w-8 bg-[#20352b]/30"></span>
            </div>
            <p className="text-[10px] tracking-widest text-[#77766c] uppercase">Good Food • Better Stays</p>
          </div>

          {/* Menu Table */}
          <div className="w-full text-left mb-6">
            <div className="flex justify-between items-center bg-[#eae3d2] px-4 py-2 rounded-md mb-3 text-[#2a4535] font-semibold text-xs tracking-wider">
              <span>ITEM</span>
              <span>PRICE (₹)</span>
            </div>
            
            <div className="space-y-2.5 px-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {menuItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-baseline group">
                  <span className="text-sm font-serif text-[#20352b] group-hover:text-[#c8a36a] transition-colors">{item.name}</span>
                  <div className="flex-1 mx-3 border-b border-dashed border-[#20352b]/20 relative -top-1"></div>
                  <span className="text-sm font-semibold text-[#20352b]">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#eef1e6] rounded-xl p-3 border border-[#d5dac3] inline-flex items-center gap-3 mb-4 mx-auto w-auto">
            <div className="bg-[#2a4535] text-white p-1.5 rounded-full">
               <Clock size={18} />
            </div>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-[#4a6b53] font-bold">Preparation Time</div>
              <div className="text-base font-serif font-bold text-[#2a4535]">30 MINUTES</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-xs font-serif italic text-[#4a6b53]">Freshly Prepared</p>
            <span className="w-1 h-1 rounded-full bg-[#4a6b53]"></span>
            <p className="text-xs font-serif italic text-[#4a6b53]">Served with Love</p>
          </div>
        </div>
      </div>
    </div>
  );
}
