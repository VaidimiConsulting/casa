import React, { useState, useEffect } from "react";
import BreakfastMenuModal from "./BreakfastMenuModal";
import {
  X,
  BedDouble,
  Users,
  Wifi,
  Wind,
  Bath,
  Coffee,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Phone,
  Maximize2,
} from "lucide-react";

export interface RoomDetail {
  id: number;
  name: string;
  subtitle: string;
  image: string;
  size: string;
  guests: string;
  price: string;
  badge: string;
  room_type?: string;
  description?: string;
  amenities?: string[];
}

interface RoomDetailModalProps {
  room: RoomDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onBookRoom: (roomId: number) => void;
}

// Map of high-definition authentic photos for each specific room
const ROOM_GALLERY_COLLECTIONS: Record<string | number, { url: string; title: string }[]> = {
  1: [ // Room 101 — Casa Luz
    { url: "/images/rooms/casa_luz_master.jpg", title: "Master Teak Bed & Study Lounge" },
    { url: "/images/gallery/casa_luz_bed_view.jpg", title: "Teakwood Bed & Handwoven Geometric Runner" },
    { url: "/images/gallery/casa_luz_headboard.jpg", title: "Boho Wall Art, Lloyd AC & Ambient Light" },
    { url: "/images/gallery/casa_luz_nightstand.jpg", title: "Bedside Pampas Grass & Olive Green Drapes" },
    { url: "/images/gallery/casa_luz_decor.jpg", title: "Handcrafted Ceramic Donut Vase & Dried Botanicals" },
    { url: "/images/gallery/casa_luz_suite.jpg", title: "Full Room Perspective with Wardrobe" },
    { url: "/images/gallery/casa_luz_ceiling.jpg", title: "Stepped Architectural Ceiling with Spotlights" },
  ],
  6: [ // Room 102 — Casa Sereno
    { url: "/images/rooms/casa_sereno_master.jpg", title: "Casa Sereno Bedroom & Artisanal Decor" },
    { url: "/images/gallery/casa_suite_front_bed.jpg", title: "Handcrafted Teak Bed & Twin Towel Decor" },
    { url: "/images/gallery/casa_suite_side_angle.jpg", title: "Room Perspective & Modern Wardrobe" },
    { url: "/images/gallery/casa_luz_decor.jpg", title: "Ceramic Donut Vase Detail" },
  ],
  4: [ // Room 104 — Casa Amore
    { url: "/images/rooms/casa_amore_master.jpg", title: "Room 104 Casa Amore – Elephant Towel Origami & Teak Wardrobe" },
    { url: "/images/gallery/casa_luna_elephant_origami.jpg", title: "Folded Elephant Towel Origami & Soft Duvet" },
    { url: "/images/gallery/casa_suite_side_angle.jpg", title: "Custom Wooden Wardrobe & Room Ambiance" },
    { url: "/images/gallery/casa_suite_bedroom_wide.jpg", title: "Full Suite View with Geometric Runner" },
  ],
  2: [ // Room 105 — Casa Sol
    { url: "/images/rooms/casa_sol_master.jpg", title: "Room 105 Casa Sol – Sunshine Room & Swan Decor" },
    { url: "/images/gallery/swan_origami_close_up.jpg", title: "Romantic Swan Towel Origami Detail" },
    { url: "/images/gallery/casa_suite_front_bed.jpg", title: "Teakwood Bed & Bohemian Wall Art" },
    { url: "/images/gallery/casa_suite_bedroom_wide.jpg", title: "Spacious Suite View & Natural Daylight" },
  ],
  3: [ // Room 103 — Casa Luna
    { url: "/images/rooms/casa_luna_master.jpg", title: "Room 103 Casa Luna – Moonlight Room & Hardwood Flooring" },
    { url: "/images/gallery/casa_luna_elephant_origami.jpg", title: "Elephant Towel Origami & Sage Accents" },
    { url: "/images/gallery/casa_suite_bedroom_wide.jpg", title: "Full Suite Perspective & Peaceful Vibe" },
    { url: "/images/gallery/casa_suite_front_bed.jpg", title: "Teak Bed & Twin Nightstands" },
  ],
};

const STANDARD_ROOM_AMENITIES = [
  { icon: BedDouble, name: "Solid Engineeringwood Bed", desc: "Plush pocket-spring mattress & crisp 300TC cotton linens" },
  { icon: Wind, name: "Whisper-Quiet Lloyd AC", desc: "Energy-efficient silent climate control" },
  { icon: Wifi, name: "High-Speed Wi-Fi", desc: "Seamless 100+ Mbps connectivity for work & streaming" },
  { icon: Bath, name: "Attached Modern Bath", desc: "24/7 instant hot water geyser, rain shower & organic toiletries" },
  { icon: Sparkles, name: "Artisanal Decor", desc: "Ceramic donut vase, dried pampas & framed boho art" },
  { icon: Coffee, name: "Complimentary Breakfast", desc: "Fresh hot homemade breakfast served daily" },
  { icon: ShieldCheck, name: "Daily Housekeeping", desc: "Thorough room sanitization & fresh towel replacements" },
  { icon: Users, name: "Room Service Support", desc: "Attentive homestay host assistance & local guidance" },
];

export default function RoomDetailModal({
  room,
  isOpen,
  onClose,
  onBookRoom,
}: RoomDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBreakfastMenuOpen, setIsBreakfastMenuOpen] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [room?.id]);

  if (!isOpen || !room) return null;

  // Build gallery images for this room
  const collection = ROOM_GALLERY_COLLECTIONS[room.id] || [];
  const roomImages = [
    { url: room.image, title: `${room.name} - Main Photo` },
    ...collection.filter((item) => item.url !== room.image),
  ];

  const currentImage = roomImages[activeImageIndex] || roomImages[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : roomImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev < roomImages.length - 1 ? prev + 1 : 0));
  };

  const handleBookClick = () => {
    onBookRoom(room.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-[#fbf8f1] rounded-3xl sm:rounded-4xl shadow-2xl border border-[#20352b]/15 overflow-hidden z-10 flex flex-col max-h-[92dvh] my-auto">
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 bg-[#20352b] text-[#fbf8f1] shrink-0 border-b border-[#fbf8f1]/10 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#c8a36a]/20 text-[#c8a36a] flex items-center justify-center shrink-0">
              <BedDouble size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white tracking-wide">
                  {room.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#c8a36a]/20 text-[#f6d79e] border border-[#c8a36a]/30 hidden sm:inline-block">
                  {room.badge || "Verified Homestay Room"}
                </span>
              </div>
              <span className="text-[11px] text-[#fbf8f1]/70 block font-sans">
                Casa Nest Luxury Homestay • Varanasi
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-7 space-y-6 flex-1 text-[#20352b]">
          {/* Main Photo Gallery & Carousel */}
          <div className="space-y-3">
            <div className="relative w-full aspect-16/9 sm:aspect-21/9 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#20352b] shadow-lg group">
              <img
                src={currentImage.url}
                alt={currentImage.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />

              {/* Gradient Overlay for Title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

              {/* Image Title & Counter */}
              <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-5 right-4 sm:right-5 flex items-end justify-between text-white pointer-events-none">
                <div>
                  <span className="text-[10px] sm:text-xs uppercase font-mono tracking-wider text-[#c8a36a] block">
                    Room Visuals & Decor
                  </span>
                  <h4 className="font-serif text-sm sm:text-base font-semibold text-white drop-shadow-sm">
                    {currentImage.title}
                  </h4>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-xs border border-white/20">
                  {activeImageIndex + 1} / {roomImages.length}
                </span>
              </div>

              {/* Prev / Next Carousel Controls */}
              {roomImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    aria-label="Previous Photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next Photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {roomImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {roomImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 sm:w-20 aspect-4/3 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-[#20352b] scale-102 shadow-sm ring-2 ring-[#c8a36a]"
                        : "border-transparent opacity-65 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Key Quick Facts Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
            <div className="sm:border-r border-[#20352b]/10 sm:pr-4">
              <span className="text-[10px] font-mono uppercase text-[#77766c] block">Nightly Tariff</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <strong className="text-2xl font-serif text-[#20352b]">{room.price}</strong>
                <span className="text-xs text-[#77766c]">/ night</span>
              </div>
              <span className="text-[10px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Breakfast & Wi-Fi Included
              </span>
            </div>

            <div className="sm:border-r border-[#20352b]/10 sm:px-4">
              <span className="text-[10px] font-mono uppercase text-[#77766c] block">Bed & Sleeping Setup</span>
              <strong className="text-sm text-[#20352b] font-semibold mt-0.5 block">{room.size}</strong>
              <span className="text-[11px] text-[#77766c] block">Custom teak frame & plush pillows</span>
            </div>

            <div className="sm:pl-4">
              <span className="text-[10px] font-mono uppercase text-[#77766c] block">Occupancy</span>
              <strong className="text-sm text-[#20352b] font-semibold mt-0.5 block">{room.guests}</strong>
              <span className="text-[11px] text-[#77766c] block">Ideal for couples, solo & small families</span>
            </div>
          </div>

          {/* Room Story & Description */}
          <div className="space-y-2">
            <h4 className="font-serif text-lg font-bold text-[#20352b]">Room Experience & Character</h4>
            <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
              {room.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
              Every detail in <strong>{room.name}</strong> is designed to offer deep relaxation after a vibrant day exploring Varanasi. From warm recessed spotlights and natural wooden furnishings to soft artisanal drapes, this room provides a tranquil haven where you can unwind in supreme comfort.
            </p>
          </div>

          {/* Key Amenities & In-Room Comforts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-lg font-bold text-[#20352b]">Amenities & In-Room Comforts</h4>
              <span className="text-[11px] text-[#77766c] font-mono">100% Verified Standards</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STANDARD_ROOM_AMENITIES.map((amenity, i) => {
                const Icon = amenity.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#20352b]/8 hover:border-[#20352b]/20 transition-all shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#f5f0e8] text-[#20352b] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={16} className="text-[#c8a36a]" />
                    </div>
                    <div>
                      <strong className="text-xs text-[#20352b] block">{amenity.name}</strong>
                      <span className="text-[11px] text-[#77766c] block leading-tight">{amenity.desc}</span>
                      {amenity.name === "Complimentary Breakfast" && (
                        <button onClick={() => setIsBreakfastMenuOpen(true)} className="mt-1.5 text-[10px] uppercase font-bold tracking-wider text-[#c8a36a] hover:text-[#20352b] transition-colors underline decoration-dotted underline-offset-2">
                          View Menu
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Homestay Direct Booking Advantage */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#20352b] text-[#fbf8f1] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#c8a36a] text-xs font-semibold">
                <Sparkles size={14} />
                <span>Direct Homestay Reservation Guarantee</span>
              </div>
              <p className="text-xs text-[#fbf8f1]/80 max-w-md leading-relaxed">
                Best guaranteed rates with zero hidden commission fees. Early check-in requests & temple assistance provided on request.
              </p>
              <div className="text-[11px] text-[#fbf8f1]/70 font-mono pt-1">
                Need host assistance? Call: <a href="tel:+918400095434" className="text-[#c8a36a] underline font-bold">+91 84000 95434</a> / <a href="tel:+919336941261" className="text-[#c8a36a] underline font-bold">+91 93369 41261</a>
              </div>
            </div>

            <button
              onClick={handleBookClick}
              className="button button-light bg-[#c8a36a] hover:bg-[#d8b57d] text-[#20352b] font-bold px-6 py-3 text-xs sm:text-sm flex items-center gap-2 shadow-md shrink-0 cursor-pointer transition-transform hover:scale-103"
            >
              <CalendarCheck size={16} />
              <span>Book {room.name.split("—")[0].trim()} Now</span>
            </button>
          </div>
        </div>
      </div>
      <BreakfastMenuModal isOpen={isBreakfastMenuOpen} onClose={() => setIsBreakfastMenuOpen(false)} />
    </div>
  );
}




