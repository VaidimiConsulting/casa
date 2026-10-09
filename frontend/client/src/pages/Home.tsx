import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import api from "@/api/axios";
import { createBooking, fetchRoomBookedDates, BookedDateRange } from "@/api/bookings";
import { fetchActiveCoupons } from "@/api/coupons";
import { sendContactMessage } from "@/api/contact";
import { getCurrentUser, logout, AuthUser } from "@/api/auth";
import { fetchRooms, Room as ApiRoom } from "@/api/rooms";
import { fetchGallery, GalleryItem } from "@/api/gallery";

import { fetchReviews, Review as ApiReview } from "@/api/reviews";
import PatioBookingModal from "@/components/PatioBookingModal";
import WriteReviewModal from "@/components/WriteReviewModal";
import BookingInvoiceModal from "@/components/BookingInvoiceModal";
import EnquirySlipModal from "@/components/EnquirySlipModal";
import AllReviewsModal from "@/components/AllReviewsModal";
import RoomDetailModal, { RoomDetail } from "@/components/RoomDetailModal";
import BreakfastMenuModal from "@/components/BreakfastMenuModal";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Images,
  Maximize2,
  CirclePlay,
  Coffee,
  Facebook,
  Gem,
  MessageSquareQuote,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wifi,
  X,
  Youtube,
  AlertTriangle,
  UserCheck,
  Flame,
  Landmark,
  Compass,
  PartyPopper,
  Utensils,
  BookOpen,
} from "lucide-react";

const images = {
  hero: "/images/hero_casa_nest.jpg",
  about: "/images/about_casa_nest.jpg",
  roomEuropean: "/images/rooms/casa_luz_master.jpg",
  roomKerala: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=88",
  roomHeritage: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=88",
  coffee: "/images/varanasi/vt_cold_coffee.jpg",
  kashi: "/images/varanasi/vishwanath_temple.jpg",
  river: "/images/varanasi/ganga_ghat_aarti.jpg",
  vishwanath: "/images/varanasi/vishwanath_temple.jpg",
  gangaAarti: "/images/varanasi/ganga_ghat_aarti.jpg",
  vtCoffee: "/images/varanasi/vt_cold_coffee.jpg",
  banarasiPaan: "/images/varanasi/banarasi_paan.jpg",
  sarnath: "/images/varanasi/sarnath_stupa.jpg",
  sunriseBoat: "/images/varanasi/sunrise_boat.jpg",
  gallery1: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1100&q=88",
  gallery2: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1100&q=88",
  gallery3: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1100&q=88",
  gallery4: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=88",
  gallery5: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=88",
  gallery6: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1100&q=88",
  stay: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=88",
};

const logoPath = "/logo.png";

const rooms = [
  {
    id: 1,
    name: "Room 101 — Casa Luz",
    subtitle: "House of Light – Crafted teak king bed, warm ambient spotlights & serene olive drapes.",
    image: "/images/rooms/casa_luz_master.jpg",
    size: "King Bed",
    guests: "2 Guests (Double)",
    price: "₹3,500",
    badge: "Room 101 • House of Light",
  },
  {
    id: 6,
    name: "Room 102 — Casa Sereno",
    subtitle: "Calm and Peaceful – Serene sanctuary with handcrafted teak bed, artisanal donut vase & pampas accents.",
    image: "/images/rooms/casa_sereno_master.jpg",
    size: "King Bed",
    guests: "2 Guests (Double)",
    price: "₹4,000",
    badge: "Room 102 • Calm & Peaceful",
  },
  {
    id: 3,
    name: "Room 103 — Casa Luna",
    subtitle: "Moonlight Room – Calming sanctuary with rich wooden flooring, handcrafted teak bed, artisan donut vases & soothing sage accents.",
    image: "/images/rooms/casa_luna_master.jpg",
    size: "King Bed + Extra Bed",
    guests: "3 Guests (Triple)",
    price: "₹3,200",
    badge: "Room 103 • Moonlight Room",
  },
  {
    id: 4,
    name: "Room 104 — Casa Amore",
    subtitle: "Romantic and Cozy – Crafted for couples with folded elephant towel origami, plush teak king bed, custom wardrobe & warm ambient lighting.",
    image: "/images/rooms/casa_amore_master.jpg",
    size: "Plush King Bed",
    guests: "2 Guests (Double)",
    price: "₹3,800",
    badge: "Room 104 • Romantic & Cozy",
  },
  {
    id: 2,
    name: "Room 105 — Casa Sol",
    subtitle: "Sunshine Room – Bright morning sunlight, celebratory swan towel origami & warm tropical bohemian vibes.",
    image: "/images/rooms/casa_sol_master.jpg",
    size: "King Bed",
    guests: "2 Guests (Double)",
    price: "₹3,500",
    badge: "Room 105 • Sunshine Room",
  },
];

const experiences = [
  { title: "Kashi Vishwanath", label: "Temple Darshan", image: images.vishwanath, icon: Sparkles },
  { title: "Ganga Ghat Aarti", label: "Evening Aarti", image: images.gangaAarti, icon: Flame },
  { title: "Reading Lounge", label: "Novels & Classics", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=88", icon: BookOpen },
  { title: "VT Ki Cold Coffee", label: "BHU Campus Vibe", image: images.vtCoffee, icon: Coffee },
  { title: "Banarasi Paan", label: "Authentic Taste", image: images.banarasiPaan, icon: Leaf },
  { title: "Historic Sarnath", label: "Dhamek Stupa", image: images.sarnath, icon: Landmark },
  { title: "Subah-e-Banaras", label: "Sunrise Boat Ride", image: images.sunriseBoat, icon: Compass },
];

const gallery = [
  { image: "/images/gallery/casa_suite_bedroom_wide.jpg", alt: "Casa Nest Master Bedroom – Handcrafted Teak Bed, Geometric Rug & Wardrobe", wide: true, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_luna_elephant_origami.jpg", alt: "Casa Luna Moonlight Room – Folded Elephant Towel Origami & Teak Bed", wide: false, category: "Rooms & Suites" },
  { image: "/images/gallery/swan_origami_close_up.jpg", alt: "Romantic Folded Swan Towel Origami & Sage Green Accents", wide: false, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_suite_side_angle.jpg", alt: "Spacious Homestay Suite – Side Perspective & Teak Wardrobe", wide: true, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_suite_front_bed.jpg", alt: "Casa Suite Front View – Teak Bed, Twin Swan Origami & Botanical Wall Art", wide: false, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_amore_master.jpg", alt: "Room 104 Casa Amore – Romantic & Cozy Suite with Elephant Towel Origami & Teak Bed", wide: true, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_sol_master.jpg", alt: "Room 105 Casa Sol – Sunshine Room with Swan Decor & Tropical Garden View", wide: true, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_sereno_master.jpg", alt: "Room 102 Casa Sereno – Calm and Peaceful Bedroom with Pampas Decor", wide: true, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_luz_master.jpg", alt: "Room 101 Casa Luz Master Suite – King Bed & Study Lounge", wide: true, category: "Rooms & Suites" },
  { image: "/images/patio_terrace.jpg", alt: "Casa Nest Fairy-Lit Rooftop Bamboo Gazebo & Patio Dining Lounge", wide: true, category: "Terrace & Patio" },
  { image: "/images/gallery/casa_luz_bed_view.jpg", alt: "Casa Luz Teakwood Bed & Handwoven Geometric Runner", wide: false, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_luz_headboard.jpg", alt: "Casa Luz Boho Wall Art, Lloyd AC & Ambient Light", wide: false, category: "Rooms & Suites" },
  { image: "/images/gallery/casa_luz_nightstand.jpg", alt: "Casa Luz Bedside Pampas Grass & Olive Green Drapes", wide: false, category: "Lounge & Ambiance" },
  { image: "/images/gallery/casa_luz_decor.jpg", alt: "Ceramic Donut Vase & Dried Botanicals", wide: false, category: "Lounge & Ambiance" },
  { image: "/images/gallery/casa_luz_suite.jpg", alt: "Casa Luz Suite – Full Room Perspective & Wardrobe", wide: true, category: "Rooms & Suites" },



];

const testimonials = [
  { quote: "Felt like home from the very first moment. Beautiful ambience and amazing hospitality!", name: "Riya Sharma", city: "Delhi", initials: "RS", rating: 5 },
  { quote: "The Kerala vibe inside Kashi is just magical. Peaceful, safe and so well maintained.", name: "Amit Verma", city: "Mumbai", initials: "AV", rating: 5 },
  { quote: "Perfect blend of comfort, culture and calm. Highly recommended!", name: "Sneha Iyer", city: "Bengaluru", initials: "SI", rating: 5 },
];

const faqs = [
  { question: "Is Casa Nest safe for solo travellers?", answer: "Yes. Casa Nest is a thoughtfully hosted, secure homestay in a quiet neighbourhood, with attentive support whenever you need it." },
  { question: "Do you provide airport/railway pickup?", answer: "We can arrange a trusted pickup from Lal Bahadur Shastri Airport or Varanasi Junction with advance notice." },
  { question: "Are meals available at the property?", answer: "A fresh breakfast is included with every stay. We also serve light, home-style meals and can recommend wonderful local spots." },
  { question: "What is the check-in and check-out time?", answer: "Check-in begins at 2:00 PM and check-out is by 11:00 AM. Early arrival and late departure can be requested." },
  { question: "Is the property family-friendly?", answer: "Absolutely. Casa Nest has a warm, easy rhythm for families, couples, solo travellers and small groups." },
];

function playDoorSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const oscillator = ctx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(96, now);
    oscillator.frequency.exponentialRampToValueAtTime(68, now + 0.72);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.76);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.8);
    window.setTimeout(() => void ctx.close(), 1100);
  } catch {
    // Audio is intentionally best-effort because browsers may block autoplay.
  }
}

function EntranceOverlay({ active, opening, fading }: { active: boolean; opening: boolean; fading: boolean }) {
  if (!active) return null;
  return (
    <div className={`entrance-overlay ${opening ? "is-opening" : ""} ${fading ? "is-fading" : ""}`} aria-label="Entering Casa Nest" role="dialog">
      <div className="entrance-light" />
      <div className="entrance-copy">
        <img src={logoPath} alt="Casa Nest Homestay" className="mix-blend-multiply" />
        <small>A beautiful stay, away from home</small>
      </div>
      <div className="door door-left"><div className="door-panel"><span className="door-handle" /></div></div>
      <div className="door door-right"><div className="door-panel"><span className="door-handle" /></div></div>
      <div className="entrance-floor" />
    </div>
  );
}

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <a className={`brand-mark ${light ? "brand-mark-light" : ""}`} href="#home" aria-label="Casa Nest home">
      <img className="brand-logo mix-blend-multiply" src={logoPath} alt="Casa Nest Homestay" />
    </a>
  );
}

function SectionIntro({ eyebrow, title, copy, action, onAction }: { eyebrow: string; title: string; copy?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-intro reveal">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {(copy || action) && <div className="section-intro-side">{copy && <p>{copy}</p>}{action && <button className="text-link" onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div>}
    </div>
  );
}

export default function Home() {
  const [introActive, setIntroActive] = useState(true);
  const [opening, setOpening] = useState(false);
  const [fading, setFading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [liveReviews, setLiveReviews] = useState<ApiReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);

  const allTestimonials = useMemo(() => {
    if (liveReviews.length > 0) {
      return liveReviews.map((r) => ({
        quote: r.review,
        name: r.customer_name,
        city: r.room_name || "Guest Stay",
        initials: r.customer_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "CN",
        rating: r.rating || 5,
      }));
    }
    return [];
  }, [liveReviews]);

  const activeReview = allTestimonials[activeTestimonial];
  const [testimonialPaused, setTestimonialPaused] = useState(false);
  const [bookingSent, setBookingSent] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [confirmedBookingForInvoice, setConfirmedBookingForInvoice] = useState<any>(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [confirmedEnquiry, setConfirmedEnquiry] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [guestsVal, setGuestsVal] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_type: string; discount_value: number; discount_amount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [displayRooms, setDisplayRooms] = useState(rooms);
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([1]);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target as Node)) {
        setIsRoomDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [checkInVal, setCheckInVal] = useState<string>("");
  const [checkOutVal, setCheckOutVal] = useState<string>("");
  const [bookedDates, setBookedDates] = useState<BookedDateRange[]>([]);
  const [datesUnavailable, setDatesUnavailable] = useState<boolean>(false);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquirySubject, setEnquirySubject] = useState("Homestay Enquiry");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [customGallery, setCustomGallery] = useState<GalleryItem[]>([]);
  const [galleryFilter, setGalleryFilter] = useState("All");

  const [isPatioModalOpen, setIsPatioModalOpen] = useState(false);
  const [selectedDetailRoom, setSelectedDetailRoom] = useState<RoomDetail | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const guestNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRooms()
      .then((data: ApiRoom[]) => {
        if (data && data.length > 0) {
          const sortedData = [...data].sort((a, b) => {
            const numA = parseInt((a.name.match(/\d+/) || ["999"])[0], 10);
            const numB = parseInt((b.name.match(/\d+/) || ["999"])[0], 10);
            return numA - numB;
          });

          setDisplayRooms((prev) =>
            sortedData.map((r, idx) => {
              const fallback =
                prev.find((p) => p.name.toLowerCase() === r.name.toLowerCase()) ||
                prev[idx] ||
                prev[0];
              return {
                id: r.id,
                name: r.name,
                subtitle: r.description || fallback.subtitle,
                image: r.image || fallback.image,
                size:
                  (r.amenities &&
                    r.amenities.find((a: string) => a.toLowerCase().includes("bed"))) ||
                  fallback.size,
                guests:
                  Number(r.capacity) === 3
                    ? "3 Guests (Triple)"
                    : "2 Guests (Double)",
                price: `₹${Number(r.price_per_night).toLocaleString()}`,
                badge: r.room_type || fallback.badge,
              };
            })
          );
        }
      })
      .catch((err) => {
        console.log("Using cached room definitions", err);
      });
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      if (guestNameRef.current) guestNameRef.current.value = user.name;
      if (emailRef.current) emailRef.current.value = user.email;
    }
  }, []);

  useEffect(() => {
    fetchGallery(false)
      .then((items) => {
        if (items && items.length > 0) {
          setCustomGallery(items);
        }
      })
      .catch((err) => console.log("Gallery fetch error:", err));

    loadApprovedReviews();
  }, []);

  const loadApprovedReviews = () => {
    fetchReviews(true)
      .then((data) => {
        if (data && data.length > 0) {
          setLiveReviews(data);
        }
      })
      .catch((err) => console.log("Reviews fetch error:", err));
  };

  const allGalleryItems = useMemo(() => {
    if (customGallery && customGallery.length > 0) {
      const dbItems = customGallery.map((g, idx) => ({
        image: g.image_url,
        alt: g.title || g.alt_text || "Casa Nest moment",
        category: g.category || "Rooms & Suites",
        wide: idx % 4 === 0,
      }));
      const urls = new Set(dbItems.map((c) => c.image));
      const remaining = gallery.filter((g) => !urls.has(g.image));
      return [...dbItems, ...remaining];
    }
    return gallery;
  }, [customGallery]);

  const galleryCategories = useMemo(() => {
    const set = new Set<string>();
    allGalleryItems.forEach((item: any) => {
      if (item.category) set.add(item.category);
    });
    return ["All", ...Array.from(set)];
  }, [allGalleryItems]);

  const displayGallery = useMemo(() => {
    if (galleryFilter === "All") return allGalleryItems;
    return allGalleryItems.filter((item: any) => item.category === galleryFilter);
  }, [allGalleryItems, galleryFilter]);

  const visibleGallery = useMemo(() => {
    if (isGalleryExpanded || galleryFilter !== "All") {
      return displayGallery;
    }
    return displayGallery.slice(0, 4);
  }, [displayGallery, isGalleryExpanded, galleryFilter]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (selectedImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev > 0 ? prev - 1 : displayGallery.length - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev < displayGallery.length - 1 ? prev + 1 : 0) : null
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, displayGallery.length]);

  useEffect(() => {
    let isMounted = true;
    fetchRoomBookedDates(selectedRoomIds[0] || 1)
      .then((ranges) => {
        if (isMounted) setBookedDates(ranges);
      })
      .catch((err) => console.error("Error loading booked dates:", err));
      
    fetchActiveCoupons()
      .then((coupons) => {
        if (isMounted && coupons) setActiveCoupons(coupons);
      })
      .catch((err) => console.error("Error loading coupons:", err));
      
    return () => {
      isMounted = false;
    };
  }, [selectedRoomIds]);

  useEffect(() => {
    if (!checkInVal || !checkOutVal) {
      setDatesUnavailable(false);
      return;
    }
    const hasConflict = bookedDates.some((r) => {
      const bIn = r.check_in.split("T")[0];
      const bOut = r.check_out.split("T")[0];
      return !(checkOutVal <= bIn || checkInVal >= bOut);
    });
    setDatesUnavailable(hasConflict);
  }, [checkInVal, checkOutVal, bookedDates]);

  useEffect(() => {
    document.body.classList.add("intro-locked");
    const start = window.setTimeout(() => {
      setOpening(true);
      playDoorSound();
    }, 2100);
    const fade = window.setTimeout(() => setFading(true), 3650);
    const finish = window.setTimeout(() => {
      setIntroActive(false);
      document.body.classList.remove("intro-locked");
    }, 4350);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(fade);
      window.clearTimeout(finish);
      document.body.classList.remove("intro-locked");
    };
  }, []);

  useEffect(() => {
    let previousY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 56);
      setNavHidden(currentY > 180 && currentY > previousY + 4);
      if (currentY < 100 || currentY < previousY - 4) setNavHidden(false);
      previousY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("gsap-ready");
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => {
        gsap.fromTo(element, { autoAlpha: 0, y: 22 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.82,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
      gsap.fromTo(".hero-media img", { yPercent: -2, scale: 1.04 }, {
        yPercent: 4,
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: 0.7 },
      });
      gsap.fromTo(".hero-copy .button", { y: 12, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        delay: 0.18,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".hero-copy", start: "top 80%", once: true },
      });
      gsap.fromTo(".promise-item", { y: 16, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: ".promise-strip", start: "top 92%", once: true },
      });
      gsap.fromTo(".room-card, .experience-card, .gallery-item", { y: 22, autoAlpha: 0, scale: 0.985 }, {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 0.72,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: ".rooms-section, .experience-section, .gallery-section", start: "top 82%", once: true },
      });
      gsap.fromTo(".testimonial-card, .booking-form, .faq-list, .site-footer", { y: 20, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ".testimonials-section, .booking-section, .faq-section, .site-footer", start: "top 86%", once: true },
      });
    });
    return () => {
      context.revert();
      document.documentElement.classList.remove("gsap-ready");
    };
  }, []);

  useEffect(() => {
    if (testimonialPaused) return;
    const timer = window.setInterval(() => setActiveTestimonial((current) => (current + 1) % testimonials.length), 5200);
    return () => window.clearInterval(timer);
  }, [testimonialPaused]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    
    let totalOrderAmount = 0;
    const nights = Math.max(1, Math.ceil((new Date(checkOutVal || Date.now()).getTime() - new Date(checkInVal || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    for (const id of selectedRoomIds) {
      const r = displayRooms.find(r => r.id === id);
      if (r) {
        totalOrderAmount += parseInt(r.price.replace(/[^\d]/g, ""), 10) * nights;
      }
    }
    
    try {
      const response = await api.post("/coupons/validate", { code: couponCode, amount: totalOrderAmount });
      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        setCouponError("");
      }
    } catch (error: any) {
      setAppliedCoupon(null);
      setCouponError(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      setToast("Please login or register first to book a room.");
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    const nameVal = guestNameRef.current?.value?.trim() || currentUser?.name || "";
    const emailVal = emailRef.current?.value?.trim() || currentUser?.email || "";

    if (!nameVal || nameVal.length < 2) {
      setToast("Please enter a valid guest name (at least 2 characters).");
      return;
    }

    if (!emailVal || !EMAIL_REGEX.test(emailVal)) {
      setToast("Please enter a valid email address.");
      return;
    }

    if (!checkInVal || !checkOutVal) {
      setToast("Please select both check-in and check-out dates.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (checkInVal < todayStr) {
      setToast("Check-in date cannot be in the past.");
      return;
    }

    if (checkOutVal <= checkInVal) {
      setToast("Check-out date must be after check-in date.");
      return;
    }


    if (selectedRoomIds.length === 0) {
      setToast("Please select at least one room.");
      return;
    }


    if (datesUnavailable) {
      setToast("Selected dates are already booked for this room.");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await createBooking({
        guest_name: nameVal,
        guest_email: emailVal,
        check_in: checkInVal,
        check_out: checkOutVal,
        guests: guestsVal,
        room_id: selectedRoomIds, males: 0, females: 0, children: 0, payment_method: paymentMethod,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        notes: roomRef.current?.selectedOptions[0]?.text
          ? `Room preference: ${roomRef.current.selectedOptions[0].text}`
          : undefined,
      });
      setBookingSent(true);
      const selectedRoomObj = displayRooms.find((r) => selectedRoomIds.includes(r.id));
      const nights = Math.max(1, Math.ceil((new Date(checkOutVal).getTime() - new Date(checkInVal).getTime()) / (1000 * 60 * 60 * 24)));
      const rawPrice = selectedRoomObj ? parseInt(selectedRoomObj.price.replace(/[^\d]/g, ""), 10) : 3500;
      setConfirmedBookingForInvoice({
        id: res.bookingId,
        user_id: currentUser?.id || null,
        room_id: selectedRoomIds,
        room_name: displayRooms.filter(r => selectedRoomIds.includes(r.id)).map(r => r.name).join(", "),
        guest_name: nameVal,
        guest_email: emailVal,
        check_in: checkInVal,
        check_out: checkOutVal,
        guests: guestsVal,
        total_amount: rawPrice * nights,
        status: "pending",
        payment_status: "pending",
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      });
      setIsInvoiceModalOpen(true);
      setToast("Your stay enquiry is registered! Check your My Bookings portal.");
    } catch (err: any) {
      if (err.response?.status === 409) {
        setDatesUnavailable(true);
        setToast("These dates are already reserved. Please pick another date or room.");
      } else {
        setToast(err.response?.data?.message || "Failed to submit booking. Please check details.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const submitEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nameVal = enquiryName.trim() || currentUser?.name || "";
    const emailVal = enquiryEmail.trim() || currentUser?.email || "";
    const phoneVal = enquiryPhone.trim();
    const messageVal = enquiryMessage.trim();

    if (!nameVal || nameVal.length < 2) {
      setToast("Please enter your name (at least 2 characters).");
      return;
    }

    if (!emailVal || !EMAIL_REGEX.test(emailVal)) {
      setToast("Please enter a valid email address.");
      return;
    }

    if (phoneVal && !PHONE_REGEX.test(phoneVal)) {
      setToast("Please enter a valid 10-15 digit phone number.");
      return;
    }

    if (!messageVal || messageVal.length < 5) {
      setToast("Please enter a message with at least 5 characters.");
      return;
    }

    setEnquiryLoading(true);
    try {
      await sendContactMessage({
        name: nameVal,
        email: emailVal,
        phone: phoneVal || undefined,
        subject: enquirySubject.trim() || "Website Homestay Enquiry",
        message: messageVal,
      });
      setEnquirySent(true);
      setConfirmedEnquiry({
        id: Math.floor(Math.random() * 10000),
        name: enquiryName,
        email: enquiryEmail,
        phone: enquiryPhone,
        subject: enquirySubject,
        message: enquiryMessage,
        created_at: new Date().toISOString()
      });
      setIsEnquiryModalOpen(true);
      setToast("Enquiry sent! Admin panel has received your message.");
      setEnquiryMessage("");
    } catch (err: any) {
      setToast(err.response?.data?.message || "Failed to send enquiry. Please try again.");
    } finally {
      setEnquiryLoading(false);
    }
  };

  return (
    <div className="site-shell">
      <EntranceOverlay active={introActive} opening={opening} fading={fading} />
      <header className={`site-nav ${scrolled ? "is-scrolled" : ""} ${navHidden ? "nav-hidden" : ""}`}>
        <div className="container nav-inner">
          <BrandMark />
          <nav className={`desktop-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            <button onClick={() => scrollTo("home")}>Home</button>
            <button onClick={() => scrollTo("about")}>About</button>
            <button onClick={() => scrollTo("rooms")}>Rooms</button>
            <button onClick={() => scrollTo("facilities")}>Facilities</button>
            <button onClick={() => scrollTo("experiences")}>Experiences</button>
            <button onClick={() => scrollTo("attractions")}>Attractions</button>
            <button onClick={() => scrollTo("reviews")}>Reviews</button>
            <button onClick={() => scrollTo("patio")}>Open Patio</button>
            <button onClick={() => scrollTo("gallery")}>Gallery</button>
            <button onClick={() => scrollTo("contact")}>Contact</button>
            {/* Mobile dropdown drawer only */}
            {menuOpen && (
              <>
                <button onClick={() => { scrollTo("facilities"); setMenuOpen(false); }}>Facilities & Amenities</button>
                <button onClick={() => { scrollTo("attractions"); setMenuOpen(false); }}>Nearby Attractions & Map</button>
                <button onClick={() => { scrollTo("reviews"); setMenuOpen(false); }}>Guest Reviews</button>
                <button onClick={() => { scrollTo("booking"); setMenuOpen(false); }} style={{ color: '#c8a36a', fontWeight: 700 }}>Book Your Stay</button>
                {currentUser ? (
                  <a href="/my-bookings" style={{ display: 'block', padding: '14px 2px', borderBottom: '1px solid rgba(32,53,43,.09)', fontSize: '11px', fontWeight: 600, color: '#20352b' }} onClick={() => setMenuOpen(false)}>
                    My Bookings ({currentUser.name.split(" ")[0]})
                  </a>
                ) : (
                  <a href="/login" style={{ display: 'block', padding: '14px 2px', borderBottom: '1px solid rgba(32,53,43,.09)', fontSize: '11px', fontWeight: 600, color: '#20352b' }} onClick={() => setMenuOpen(false)}>
                    Sign In
                  </a>
                )}
              </>
            )}
          </nav>
          <div className="nav-actions">
            {currentUser ? (
              <a
                href="/my-bookings"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#20352b]/15 bg-[#fbf8f1] text-[11px] font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
              >
                <UserCheck size={13} className="text-[#c8a36a]" />
                <span>My Bookings ({currentUser.name.split(" ")[0]})</span>
              </a>
            ) : (
              <a
                href="/login"
                className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#20352b]/15 bg-[#fbf8f1] text-[11px] font-semibold text-[#20352b] hover:bg-[#efe7db] transition-colors"
              >
                <span>Sign In</span>
              </a>
            )}
            <button className="nav-book" onClick={() => scrollTo("booking")}>Book Your Stay<ArrowUpRight size={13} /></button>
            <button className="menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="hero-section" ref={heroRef}>
          <div className="hero-glow" />
          <div className="container hero-grid">
            <div className="hero-copy reveal">
              <span className="eyebrow">A boutique stay in the heart of Kashi</span>
              <h1>Feel at home,<br /><em>where cultures meet.</em></h1>
              <p>Experience the calm of Kerala, the charm of Europe and the soul of Kashi — all at Casa Nest.</p>
              <div className="hero-actions">
                <button className="button button-dark" onClick={() => scrollTo("booking")}>Book Your Stay<ArrowRight size={16} /></button>
                <button className="button button-quiet" onClick={() => scrollTo("about")}>Explore More<CirclePlay size={17} /></button>
              </div>
              <div className="hero-note"><span className="note-line" /> <span>Stay different.<br />Feel at home.</span></div>
            </div>
            <div className="hero-media reveal reveal-delay-2">
              <img src={images.hero} alt="Sunlit Casa Nest lounge with warm interiors and plants" fetchPriority="high" />
              <div className="hero-caption"><span>01</span><span>Warm light · quiet mornings</span></div>
              <div className="hero-stamp"><span>Designed for</span><strong>slow<br />stays</strong><span>since 2024</span></div>
            </div>
          </div>
          <div className="hero-scroll"><span>Scroll to explore</span><span className="scroll-line" /></div>
        </section>

        <section className="promise-strip">
          <div className="container promise-grid">
            <div className="promise-item"><ShieldCheck size={21} strokeWidth={1.4} /><div><strong>Warm Hospitality</strong><span>Like family</span></div></div>
            <div className="promise-item"><Heart size={21} strokeWidth={1.4} /><div><strong>Peaceful & Safe</strong><span>For every traveller</span></div></div>
            <div className="promise-item"><Sparkles size={21} strokeWidth={1.4} /><div><strong>Beautiful Rooms</strong><span>With unique charm</span></div></div>
            <div className="promise-item"><Leaf size={21} strokeWidth={1.4} /><div><strong>A Memorable Stay</strong><span>In the heart of Kashi</span></div></div>
          </div>
        </section>

        <section id="about" className="about-section section-pad">
          <div className="container about-grid">
            <div className="about-copy reveal"><span className="eyebrow">About Casa Nest</span><h2>A home away<br />from home.</h2><p>Casa Nest is more than just a place to stay — it’s a feeling. A beautiful blend of Kerala’s easy warmth, European elegance and the timeless culture of Kashi.</p><p>Thoughtfully designed spaces, warm hospitality, and a peaceful environment make every stay truly special.</p></div>
            <div className="about-media reveal reveal-delay-2"><img src={images.about} alt="Casa Nest indoor lounge with plants and arched doorway" loading="lazy" /><div className="scribble scribble-about">Same city.<br /><em>Different</em><br />vibe.</div></div>
          </div>
        </section>

        <section id="rooms" className="rooms-section section-pad section-soft">
          <div className="container">
            <SectionIntro
              eyebrow="Our rooms"
              title="Spaces designed for your comfort"
              copy="Elegant, cosy and inspired by nature — each room tells a different story. Click any room or arrow to explore authentic photos & details."


            />
            <div className="rooms-grid">
              {displayRooms.map((room, index) => (
                <article
                  className="room-card reveal group cursor-pointer"
                  style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}
                  key={room.name}
                >
                  <div
                    className="room-image"
                    onClick={() => setSelectedDetailRoom(room as any)}
                    title={`Click to view ${room.name} photos & amenities`}
                  >
                    <img src={room.image} alt={room.name} loading="lazy" />
                    <span className="room-badge">
                      <CheckCircle2 size={12} /> {room.badge}
                    </span>
                    <button
                      className="image-arrow"
                      aria-label={`View ${room.name} photos & details`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailRoom(room as any);
                      }}
                      title={`View ${room.name} full photos & details`}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div
                    className="room-info"
                    onClick={() => setSelectedDetailRoom(room as any)}
                  >
                    <div>
                      <h3 className="group-hover:text-[#c8a36a] transition-colors">{room.name}</h3>
                      <p>{room.subtitle}</p>
                    </div>
                    <strong className="room-price">
                      {room.price}
                      <small>/night</small>
                    </strong>
                  </div>
                  <div
                    className="room-meta"
                    onClick={() => setSelectedDetailRoom(room as any)}
                  >
                    <span><BedDouble size={14} /> {room.size}</span>
                    <span><Users size={14} /> {room.guests}</span>
                    <span><Wifi size={14} /> Wi-Fi</span>
                    <span><Bath size={14} /> AC</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      className="room-link flex-1"
                      onClick={() => {
                        setSelectedRoomIds([room.id]);
                        scrollTo("booking");
                      }}
                    >
                      Book this room
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-[#f5f0e8] hover:bg-[#20352b] text-[#20352b] hover:text-white text-xs font-semibold transition-all border border-[#20352b]/15 flex items-center gap-1 cursor-pointer shrink-0"
                      onClick={() => setSelectedDetailRoom(room as any)}
                      title={`View ${room.name} details & gallery`}
                    >
                      <span>Details</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ✨ Facilities at Casa Nest */}
        <section id="facilities" className="facilities-section section-pad bg-[#fbf8f1] border-y border-[#20352b]/10">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 reveal">
              <span className="eyebrow flex items-center justify-center gap-1.5 text-[#c8a36a]">
                <Sparkles size={14} /> Thoughtfully Provided Amenities
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#20352b] mt-2 mb-3">
                Facilities at <em>Casa Nest</em>
              </h2>
              <p className="text-xs sm:text-sm text-[#77766c] leading-relaxed">
                Enjoy a comfortable and hassle-free stay with our thoughtfully provided facilities. At Casa Nest, we focus on providing a comfortable, convenient, and homely experience for every guest.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 reveal">
              {/* 1. Free High-Speed Wi-Fi */}
              <div className="p-6 rounded-3xl bg-white border border-[#20352b]/10 shadow-xs hover:shadow-md hover:border-[#c8a36a]/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-[#c8a36a]/15 text-[#c8a36a] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  📶
                </div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#20352b] mb-1.5 group-hover:text-[#c8a36a] transition-colors">
                  Free High-Speed Wi-Fi
                </h3>
                <p className="text-xs text-[#77766c] leading-relaxed">
                  Seamless, high-speed fiber internet coverage across all rooms, open patio, and reading lounge.
                </p>
                <span className="mt-4 inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-semibold">
                  24/7 Unlimited
                </span>
              </div>

              {/* 2. Dedicated Car Parking */}
              <div className="p-6 rounded-3xl bg-white border border-[#20352b]/10 shadow-xs hover:shadow-md hover:border-[#c8a36a]/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-[#20352b]/10 text-[#20352b] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🚗
                </div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#20352b] mb-1.5 group-hover:text-[#c8a36a] transition-colors">
                  Dedicated Car Parking
                </h3>
                <p className="text-xs text-[#77766c] leading-relaxed">
                  Dedicated, safe on-premise vehicle parking for all personal and rented cars & two-wheelers.
                </p>
                <span className="mt-4 inline-block px-2.5 py-0.5 rounded-full bg-[#f5f0e8] text-[#20352b] border border-[#20352b]/15 text-[10px] font-semibold">
                  Secure On-Premise
                </span>
              </div>

              {/* 3. Lift / Elevator Access */}
              <div className="p-6 rounded-3xl bg-white border border-[#20352b]/10 shadow-xs hover:shadow-md hover:border-[#c8a36a]/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-[#c8a36a]/15 text-[#c8a36a] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🛗
                </div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#20352b] mb-1.5 group-hover:text-[#c8a36a] transition-colors">
                  Lift / Elevator Access
                </h3>
                <p className="text-xs text-[#77766c] leading-relaxed">
                  Effortless, modern elevator access to all floors, making stays completely accessible for families & elders.
                </p>
                <span className="mt-4 inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-semibold">
                  All Floors Connected
                </span>
              </div>

              {/* 4. Airport Pick-up & Drop-off */}
              <div className="p-6 rounded-3xl bg-white border border-[#20352b]/10 shadow-xs hover:shadow-md hover:border-[#c8a36a]/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-[#20352b]/10 text-[#20352b] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  ✈️
                </div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#20352b] mb-1.5 group-hover:text-[#c8a36a] transition-colors">
                  Airport Pick-up & Drop-off
                </h3>
                <p className="text-xs text-[#77766c] leading-relaxed">
                  Direct, trusted chauffeur cab transfers to/from Varanasi Airport (VNS) & Junction railway station.
                </p>
                <span className="mt-4 inline-block px-2.5 py-0.5 rounded-full bg-[#f5f0e8] text-[#20352b] border border-[#20352b]/15 text-[10px] font-semibold">
                  On-Demand Cab
                </span>
              </div>

              {/* 5. Air Conditioning in Rooms */}
              <div className="p-6 rounded-3xl bg-white border border-[#20352b]/10 shadow-xs hover:shadow-md hover:border-[#c8a36a]/40 transition-all flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-[#c8a36a]/15 text-[#c8a36a] flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  ❄️
                </div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#20352b] mb-1.5 group-hover:text-[#c8a36a] transition-colors">
                  Air Conditioning in Rooms
                </h3>
                <p className="text-xs text-[#77766c] leading-relaxed">
                  High-efficiency whisper-quiet AC units installed in every private room and luxury suite.
                </p>
                <span className="mt-4 inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-semibold">
                  Climate Controlled
                </span>
              </div>
            </div>

            {/* Banner Promise */}
            <div className="mt-10 p-6 rounded-3xl bg-[#20352b] text-[#fbf8f1] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 reveal">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#c8a36a]/20 text-[#c8a36a] flex items-center justify-center text-2xl shrink-0">
                  🏡
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-bold">
                    Homely Comfort Guarantee
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold">
                    Casa Nest — Your Beautiful Home Away From Home
                  </h4>
                  <p className="text-xs text-[#fbf8f1]/80 max-w-xl mt-0.5">
                    At Casa Nest, we focus on providing a comfortable, convenient, and homely experience for every guest.
                  </p>
                </div>
              </div>

              <button
                onClick={() => scrollTo("booking")}
                className="button button-gold px-6 py-3 text-xs shrink-0 whitespace-nowrap shadow-md hover:scale-[1.02] transition-transform"
              >
                <span>Book Your Stay Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        <section id="experiences" className="experience-section section-pad">
          <div className="container experience-grid"><div className="experience-copy reveal"><span className="eyebrow">Experience</span><h2>More than<br /><em>a stay.</em></h2><p>From soulful corners to local explorations, Casa Nest offers experiences that stay with you long after you leave.</p><div className="botanical-mark" aria-hidden="true">✳</div></div><div className="experience-cards">{experiences.map((experience, index) => { const Icon = experience.icon; return <div className="experience-card reveal" style={{ "--delay": `${index * 90}ms` } as React.CSSProperties} key={experience.title}><div className="experience-image"><img src={experience.image} alt={experience.title} loading="lazy" /></div><div className="experience-card-copy"><span><Icon size={14} /> {experience.label}</span><strong>{experience.title}</strong></div></div> })}</div></div>
        </section>

        {/* 📍 Nearby Attractions from Casa Nest, Varanasi */}
        <section id="attractions" className="attractions-section section-pad bg-[#f5f0e8] border-t border-[#20352b]/10">
          <div className="container">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 reveal">
              <div>
                <span className="eyebrow flex items-center gap-1.5 text-[#c8a36a]">
                  <MapPin size={14} /> Prime Kashi Location
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#20352b] mt-1">
                  Nearby Attractions <em>from Casa Nest</em>
                </h2>
                <p className="text-xs sm:text-sm text-[#77766c] max-w-2xl mt-2 leading-relaxed">
                  Centrally located at <strong>B23/33 Plot 58, Gurudham Colony (Near PMO Office), Varanasi</strong>. Enjoy effortless accessibility to all sacred ghats, temples, and spiritual landmarks of Banaras.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="https://maps.google.com/?q=B23/33+Plot+58,+Gurudham+Colony,+Near+PMO+Office,+Varanasi"
                  target="_blank"
                  rel="noreferrer"
                  className="button button-dark text-xs inline-flex items-center gap-2 shadow-sm"
                >
                  <MapPin size={14} className="text-[#c8a36a]" />
                  <span>Open Google Maps</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>

            {/* Attractions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 reveal">
              {[
                {
                  icon: "🌅",
                  name: "Assi Ghat",
                  distance: "Approx. 1 km",
                  desc: "Sunrise boat rides, peaceful morning Ganga Aarti & famous Subah-e-Banaras cultural performances.",
                  category: "Ghat & Riverfront",
                },
                {
                  icon: "🙏",
                  name: "Sankat Mochan Hanuman Temple",
                  distance: "Approx. 1 km",
                  desc: "Revered spiritual temple established by Goswami Tulsidas with divine atmosphere & special besan ladoo prasadam.",
                  category: "Sacred Temple",
                },
                {
                  icon: "🛕",
                  name: "BHU Vishwanath Temple (VT)",
                  distance: "Approx. 1.5 km",
                  desc: "Majestic marble temple inside the lush BHU campus, renowned for peaceful vibes and famous cold coffee.",
                  category: "Temple & Campus",
                },
                {
                  icon: "🛕",
                  name: "Shri Kashi Vishwanath Temple",
                  distance: "Approx. 2–3 km",
                  desc: "The eternal golden Jyotirlinga shrine of Lord Shiva and newly built grand Vishwanath Corridor.",
                  category: "Jyotirlinga Shrine",
                },
                {
                  icon: "🌊",
                  name: "Dashashwamedh Ghat",
                  distance: "Approx. 2–3 km",
                  desc: "The most prominent ghat of Varanasi, world-famous for its spectacular evening Maha Ganga Aarti.",
                  category: "Historic Ghat",
                },
                {
                  icon: "🌺",
                  name: "Durga Kund Temple",
                  distance: "Approx. 1 km",
                  desc: "Historic 18th-century Nagara-style red temple dedicated to Goddess Durga, featuring a sacred water tank.",
                  category: "Ancient Temple",
                },
                {
                  icon: "🕉️",
                  name: "Tulsi Manas Mandir",
                  distance: "Approx. 1.5 km",
                  desc: "Magnificent white marble temple where Ramcharitmanas was originally written, engraved with sacred verses.",
                  category: "Heritage Temple",
                },
                {
                  icon: "🎓",
                  name: "BHU Main Gate",
                  distance: "Approx. 1.2 km",
                  desc: "Grand gateway to Banaras Hindu University campus, lush sprawling greenery, and artisan cafes.",
                  category: "Landmark & Hub",
                },
                {
                  icon: "🔱",
                  name: "Kaal Bhairav Temple",
                  distance: "Approx. 5–6 km",
                  desc: "The ancient shrine of Kaal Bhairav, venerated as the fierce guardian protector (Kotwal) of Kashi.",
                  category: "Guardian Deity",
                },
              ].map((place) => (
                <div
                  key={place.name}
                  className="p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs hover:shadow-md hover:border-[#c8a36a]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{place.icon}</span>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#20352b] group-hover:text-[#c8a36a] transition-colors leading-tight">
                            {place.name}
                          </h4>
                          <span className="text-[10px] text-[#77766c] block">{place.category}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#f5f0e8] text-[#20352b] text-[11px] font-mono font-bold border border-[#20352b]/10 shrink-0">
                        {place.distance}
                      </span>
                    </div>
                    <p className="text-xs text-[#77766c] leading-relaxed">
                      {place.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Easy Cab / Auto Access
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " Varanasi")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-[#c8a36a] hover:underline flex items-center gap-1"
                    >
                      <span>View Map</span>
                      <ArrowUpRight size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Map & Address Card */}
            <div className="rounded-3xl bg-white border border-[#20352b]/10 shadow-md overflow-hidden reveal grid grid-cols-1 lg:grid-cols-12">
              {/* Left: Location & Contact Info */}
              <div className="p-6 sm:p-8 lg:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-bold block mb-1">
                    Hotel Address & Navigation
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#20352b]">
                    Find Casa Nest in Varanasi
                  </h3>
                  <p className="text-xs text-[#77766c] mt-2 leading-relaxed">
                    Situated in a serene and secure neighborhood right near the PMO Office, Gurudham Colony, offering quick and peaceful access across the holy city.
                  </p>

                  <div className="mt-6 space-y-3.5 text-xs text-[#20352b]">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f5f0e8]/80 border border-[#20352b]/10">
                      <MapPin size={18} className="text-[#c8a36a] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[#20352b]">Official Address:</strong>
                        <span className="text-[#77766c]">B23/33 Plot 58, Gurudham Colony, Near PMO Office, Varanasi, Uttar Pradesh, India</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f5f0e8]/80 border border-[#20352b]/10">
                      <Phone size={16} className="text-[#c8a36a] shrink-0" />
                      <div>
                        <strong className="block text-[#20352b]">Direct Host Call:</strong>
                        <span className="text-[#77766c]">+91 84000 95434 • +91 93369 41261</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href="https://maps.google.com/?q=B23/33+Plot+58,+Gurudham+Colony,+Near+PMO+Office,+Varanasi"
                    target="_blank"
                    rel="noreferrer"
                    className="button button-dark w-full sm:w-auto py-2.5 px-5 text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MapPin size={14} className="text-[#c8a36a]" />
                    <span>Get Directions on Google Maps</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

              {/* Right: Embedded Google Map */}
              <div className="lg:col-span-7 h-[340px] sm:h-[400px] lg:h-auto min-h-[300px] relative bg-[#f5f0e8]">
                <iframe
                  title="Casa Nest Hotel Location Map"
                  src="https://maps.google.com/maps?q=B23/33+Plot+58+Gurudham+Colony+near+PMO+Office+Varanasi&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "320px" }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Open Patio & Terrace Events Section */}
        <section id="patio" className="patio-section section-pad bg-[#fbf8f1] border-y border-[#20352b]/10">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Details */}
              <div className="lg:col-span-6 reveal space-y-5">
                <div>
                  <span className="eyebrow flex items-center gap-1.5 text-[#c8a36a]">
                    <Sparkles size={14} />
                    <span>Open Patio & Terrace Garden</span>
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#20352b] mt-2 leading-tight">
                    Intimate celebrations,<br />
                    <em>under the starlit sky.</em>
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#77766c] leading-relaxed">
                  Casa Nest&apos;s rooftop open patio is thoughtfully curated for small celebrations of <strong>12 to 18 guests</strong>. Whether you&apos;re planning a cozy dinner party, small family gathering, birthday celebration, corporate team mixer, or an intimate get-together, our fairy-lit ambiance, music setup, and bespoke culinary feasts make every moment unforgettable.
                </p>

                {/* Key Capacity & Event Highlights */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
                    <div className="flex items-center gap-2 text-[#20352b] font-semibold text-xs mb-1">
                      <Users size={14} className="text-[#c8a36a]" />
                      <span>12 – 18 Guests</span>
                    </div>
                    <span className="text-[11px] text-[#77766c] block leading-tight">
                      Capacity: 12 to 18 guests
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
                    <div className="flex items-center gap-2 text-[#20352b] font-semibold text-xs mb-1">
                      <Sparkles size={14} className="text-[#c8a36a]" />
                      <span>Fairy-Lit Ambiance</span>
                    </div>
                    <span className="text-[11px] text-[#77766c] block leading-tight">
                      Lanterns, pergolas & sound system
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
                    <div className="flex items-center gap-2 text-[#20352b] font-semibold text-xs mb-1">
                      <Utensils size={14} className="text-[#c8a36a]" />
                      <span>Breakfast & Snacks Available</span>
                    </div>
                    <span className="text-[11px] text-[#77766c] block leading-tight">
                      Only breakfast and snacks are provided (no main meals)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs">
                    <div className="flex items-center gap-2 text-[#20352b] font-semibold text-xs mb-1">
                      <PartyPopper size={14} className="text-[#c8a36a]" />
                      <span>Exclusive Patio Slots</span>
                    </div>
                    <span className="text-[11px] text-[#77766c] block leading-tight">
                      Lunch, Evening & Full Day slots
                    </span>
                  </div>
                </div>

                {/* Event Types Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["🎂 Birthday Parties", "🍽️ Dinner Parties", "👨‍👩‍👧‍👦 Family Gatherings", "💼 Corporate Mixers", "🥂 Casual Get-Togethers"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-[#f5f0e8] text-[#20352b] text-[11px] font-medium border border-[#20352b]/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="pt-3">
                  <button
                    onClick={() => setIsPatioModalOpen(true)}
                    className="button button-dark px-6 py-3 text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <PartyPopper size={15} className="text-[#c8a36a]" />
                    <span>Enquire & Book Open Patio</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Right Media Card */}
              <div className="lg:col-span-6 reveal reveal-delay-2">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#20352b]/15 group">
                  <img
                    src="/images/patio_terrace.jpg"
                    alt="Casa Nest Open Patio & Terrace Garden"
                    className="w-full h-[380px] sm:h-[460px] object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Floating Highlight Badge */}
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-[#fbf8f1]/95 backdrop-blur-xs text-[#20352b] text-xs font-semibold shadow-md flex items-center gap-1.5 border border-[#20352b]/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Capacity: 12 to 18 Members</span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-bold">
                      Open-Air Boutique Terrace
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold">
                      Rooftop Open Patio & Terrace Garden
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-2">
                      Open sky terrace with dining setups, fresh garden greens & cushioned lounge seating for relaxed stays & celebrations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="gallery-section section-pad section-soft">
          <div className="container">
            <SectionIntro
              eyebrow="Gallery"
              title="Moments at Casa Nest"
              copy="A few little glimpses of the rooms, rituals and soft light that make us feel at home."
              action={isGalleryExpanded ? "Show preview" : `View all ${displayGallery.length} photos`}
              onAction={() => setIsGalleryExpanded((prev) => !prev)}
            />

            {galleryCategories.length > 2 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {galleryCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setGalleryFilter(cat);
                      if (cat !== "All") setIsGalleryExpanded(true);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${galleryFilter === cat
                        ? "bg-[#20352b] text-[#fbf8f1] shadow-xs"
                        : "bg-[#fbf8f1] text-[#20352b] border border-[#20352b]/15 hover:bg-[#efe8dc]"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="gallery-grid">
              {visibleGallery.map((item, index) => {
                const fullIndex = displayGallery.findIndex((g) => g.image === item.image);
                const activeIdx = fullIndex >= 0 ? fullIndex : index;
                return (
                  <button
                    className={`gallery-item ${item.wide ? "gallery-wide" : ""}`}
                    key={`${item.image}-${index}`}
                    onClick={() => setSelectedImageIndex(activeIdx)}
                    aria-label={`Open ${item.alt}`}
                  >
                    {item.image.match(/\.(mp4|webm|mov)$/i) ? (
                      <video
                        src={item.image}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        muted
                        loop
                        playsInline
                        onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseOut={(e) => {
                          const v = e.target as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                    ) : (
                      <img src={item.image} alt={item.alt} loading="lazy" />
                    )}
                    <span className="gallery-overlay">
                      <span>{item.alt || "View moment"}</span>
                      <ArrowUpRight size={17} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Full Gallery / Toggle Bar */}
            {displayGallery.length > 4 && (
              <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#c8a36a]/15 text-[#c8a36a] flex items-center justify-center font-bold text-xs shrink-0">
                    <Images size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#20352b]">
                      {isGalleryExpanded ? "Showing All Gallery Photos" : `Explore All ${displayGallery.length} Photos`}
                    </h4>
                    <p className="text-xs text-[#77766c]">
                      {isGalleryExpanded
                        ? `Viewing complete collection across Suites, Open Patio, Dining & Lounges`
                        : `Showing top preview moments. Click below to reveal all room angles & patio views`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsGalleryExpanded((prev) => !prev)}
                    className="button button-dark px-5 py-2.5 text-xs flex items-center gap-2 shadow-sm"
                  >
                    <Images size={14} />
                    <span>{isGalleryExpanded ? "Show Less Photos" : `View Full Gallery (${displayGallery.length})`}</span>
                    {isGalleryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="reviews" className="testimonials-section section-pad bg-[#fbf8f1] border-y border-[#20352b]/10">
          <div className="container">
            {/* Header & Rating Summary */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 reveal">
              <div>
                <span className="eyebrow flex items-center gap-1.5 text-[#c8a36a]">
                  <Sparkles size={14} /> Verified Guest Reviews
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#20352b] mt-1">
                  Stories that <em>inspire us</em>
                </h2>
                <p className="text-xs sm:text-sm text-[#77766c] max-w-2xl mt-2 leading-relaxed">
                  Real experiences shared by guests from around the world who made Casa Nest their home away from home in Kashi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Score badge */}
                <div className="px-4 py-2 rounded-2xl bg-white border border-[#20352b]/10 shadow-xs flex items-center gap-2.5">
                  <div className="flex items-center text-[#c8a36a]">
                    <Star size={16} fill="currentColor" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#20352b]">
                      {liveReviews.length > 0
                        ? (liveReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / liveReviews.length).toFixed(1)
                        : "5.0"} / 5.0
                    </span>
                    <span className="text-[10px] text-[#77766c] block">
                      {liveReviews.length > 0 ? `${liveReviews.length} Reviews` : "3 Verified Reviews"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="button button-dark px-4 py-2.5 text-xs flex items-center gap-2 shadow-sm"
                >
                  <Star size={14} className="text-[#c8a36a]" fill="currentColor" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>

            {/* Featured Testimonial Spotlight */}`n            {allTestimonials.length > 0 ? (
              <div className="testimonials-wrap mb-12">
                <div className="testimonial-stage" onMouseEnter={() => setTestimonialPaused(true)} onMouseLeave={() => setTestimonialPaused(false)}>
                  <button className="carousel-arrow left" aria-label="Previous testimonial" onClick={() => setActiveTestimonial((activeTestimonial - 1 + allTestimonials.length) % allTestimonials.length)}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="testimonial-card">
                    <Quote className="quote-icon" size={26} />
                    <div className="stars" aria-label={`${activeReview?.rating || 5} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={16}
                          className={index < (activeReview?.rating || 5) ? "fill-[#c8a36a] text-[#c8a36a]" : "text-[#77766c]/30"}
                        />
                      ))}
                    </div>
                    <blockquote>“{activeReview?.quote}”</blockquote>
                    <div className="guest">
                      <span className="guest-avatar">{activeReview?.initials}</span>
                      <span><strong>{activeReview?.name}</strong><small>{activeReview?.city}</small></span>
                    </div>
                  </div>
                  <button className="carousel-arrow right" aria-label="Next testimonial" onClick={() => setActiveTestimonial((activeTestimonial + 1) % allTestimonials.length)}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="testimonial-dots">
                  {allTestimonials.map((review, index) => (
                    <button
                      key={`${review.name}-${index}`}
                      className={index === activeTestimonial ? "active" : ""}
                      aria-label={`Show testimonial ${index + 1}`}
                      onClick={() => setActiveTestimonial(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-12 bg-white rounded-3xl border border-[#20352b]/10 shadow-sm mb-12">
                <p className="text-[#77766c]">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}

            {/* Top Reviews Cards Grid (Shows top 3-4 reviews, opens full modal for all) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#20352b] flex items-center gap-2">
                    <MessageSquareQuote size={18} className="text-[#c8a36a]" />
                    <span>Featured Guest Reviews</span>
                  </h3>
                  <span className="text-[11px] text-[#77766c]">
                    Showing top guest highlights • {(liveReviews.length > 0 ? liveReviews.length : 3)} total verified reviews
                  </span>
                </div>
                <button
                  onClick={() => setIsAllReviewsModalOpen(true)}
                  className="text-xs font-semibold text-[#c8a36a] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>See All Reviews ({liveReviews.length}) →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveReviews.slice(0, 3).map((rev: any) => {
                  const initials = rev.customer_name
                    ? rev.customer_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                    : "CN";

                  return (
                    <div
                      key={rev.id}
                      className="bg-white rounded-2xl border border-[#20352b]/10 p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#c8a36a]/40 transition-all"
                    >
                      <div className="space-y-3">
                        {/* Stars */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[#c8a36a]">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < (rev.rating || 5) ? "fill-[#c8a36a] text-[#c8a36a]" : "text-gray-200"}
                              />
                            ))}
                            <span className="text-[11px] font-bold text-[#20352b] ml-1">
                              {rev.rating || 5}.0
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <CheckCircle2 size={10} /> Verified Guest
                          </span>
                        </div>

                        {/* Review text */}
                        <p className="text-xs text-[#20352b]/90 leading-relaxed italic line-clamp-4">
                          “{rev.review}”
                        </p>
                      </div>

                      {/* Guest info & Date */}
                      <div className="mt-4 pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#20352b]/10 text-[#20352b] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <strong className="block text-xs font-serif text-[#20352b]">
                              {rev.customer_name}
                            </strong>
                            <small className="text-[10px] text-[#77766c] block truncate max-w-[150px]">
                              {rev.room_name || "Casa Nest Guest Stay"}
                            </small>
                          </div>
                        </div>
                        {rev.created_at && (
                          <span className="text-[10px] text-[#77766c] font-mono">
                            {new Date(rev.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions: See All Reviews Button & Write Review */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsAllReviewsModalOpen(true)}
                  className="button button-dark px-6 py-3 text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] transition-transform cursor-pointer w-full sm:w-auto justify-center"
                >
                  <MessageSquareQuote size={15} className="text-[#c8a36a]" />
                  <span>See All Reviews ({liveReviews.length})</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-5 py-3 rounded-full border border-[#20352b]/20 bg-white hover:bg-[#f5f0e8] text-[#20352b] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto justify-center shadow-2xs"
                >
                  <Star size={13} className="text-[#c8a36a]" fill="currentColor" />
                  <span>Write a Review</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="stay-banner"><img src={images.stay} alt="Quiet sitting room overlooking greenery" loading="lazy" /><div className="stay-overlay" /><div className="container stay-content"><div><span className="eyebrow">A little more time for yourself</span><h2>Your peaceful stay<br /><em>awaits.</em></h2></div><button className="button button-light" onClick={() => scrollTo("booking")}>Book your stay<ArrowRight size={15} /></button></div></section>

        <section id="booking" className="booking-section section-pad">
          
          {activeCoupons.length > 0 && (
            <div className="container mb-8">
              <div className="bg-[#f5f0e8] border border-[#c8a36a] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 justify-between shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-[#c8a36a]/20 p-2 rounded-full text-[#c8a36a] shrink-0 mt-0.5">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-[#20352b] text-lg font-bold">Special Offers For You!</h3>
                    <ul className="text-sm text-[#4a3512] space-y-1 mt-1">
                      {activeCoupons.map((c, idx) => (
                        <li key={idx}>
                          Use code <strong className="bg-[#20352b] text-white px-1.5 py-0.5 rounded text-xs mx-1 tracking-wider">{c.code}</strong> 
                          for {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`} 
                          {c.min_order_amount > 0 ? ` on bookings above ₹${c.min_order_amount}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setCouponCode(activeCoupons[0].code);
                    handleApplyCoupon();
                  }}
                  className="button button-dark whitespace-nowrap text-xs px-4 py-2"
                >
                  Apply Code
                </button>
              </div>
            </div>
          )}

          <div className="container booking-grid"><div className="booking-copy reveal"><span className="eyebrow">Plan your stay</span><h2>Come as you are.<br /><em>Leave feeling lighter.</em></h2><p>Tell us a little about your visit and we’ll help make your time at Casa Nest beautifully easy.</p><div className="contact-actions"><a href="https://wa.me/918400095434" target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp us</a><a href="tel:+918400095434"><Phone size={15} /> +91 84000 95434</a><a href="tel:+919336941261"><Phone size={15} /> +91 93369 41261</a></div></div><form className="booking-form reveal reveal-delay-2" onSubmit={submitBooking}>{bookingSent ? <div className="booking-success"><CheckCircle2 size={42} /><h3>Booking Request Placed!</h3><p className="font-bold text-rose-800">Your booking is NOT confirmed yet!</p><p>Your booking will only be confirmed once you make the payment and receive a confirmation message from the Admin. Please call or WhatsApp the owner at <a href="https://wa.me/918400095434" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">+91 84000 95434</a> to confirm your reservation.</p><div className="flex gap-2 justify-center mt-3"><a href="/my-bookings" className="button button-dark" style={{ padding: "8px 16px", fontSize: "12px" }}>View My Bookings</a><button type="button" className="text-link" onClick={() => setBookingSent(false)}>Send another enquiry<ArrowRight size={14} /></button></div></div> : <><div className="form-heading"><span>Check availability</span><small>Live room calendar check</small></div><div className="form-row"><label>Your name<input type="text" placeholder="Enter your name" defaultValue={currentUser?.name || ""} ref={guestNameRef} required /></label></div><div className="form-row"><label>Check-in<input type="date" ref={checkInRef} value={checkInVal} min={new Date().toISOString().split("T")[0]} onChange={(e) => setCheckInVal(e.target.value)} required /></label><label>Check-out<input type="date" ref={checkOutRef} value={checkOutVal} min={checkInVal || new Date().toISOString().split("T")[0]} onChange={(e) => setCheckOutVal(e.target.value)} required /></label></div>{datesUnavailable && <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" /><div><strong>Selected dates are unavailable!</strong><p className="mt-0.5 text-[11px] text-red-600/90">This room has an active booking during these dates. Please choose different dates or select another room.</p></div></div>}<div className="form-row" style={{ alignItems: 'flex-start' }}>
          <label>
            Room(s)
            <div className="relative w-full" ref={roomDropdownRef}>
              <div
                onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
                style={{
                  padding: '0 12px',
                  minHeight: '44px',
                  backgroundColor: '#f5f0e8',
                  border: '1px solid rgba(32, 53, 43, 0.13)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  letterSpacing: '0',
                  textTransform: 'none',
                  color: '#20352b'
                }}
              >
                <span>
                  {selectedRoomIds.length === 0
                    ? "Select Rooms"
                    : selectedRoomIds.length === 1
                      ? displayRooms.find(r => r.id === selectedRoomIds[0])?.name || "1 Room Selected"
                      : `${selectedRoomIds.length} Rooms Selected`
                  }
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRoomDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="m6 9 6 6 6-6" /></svg>
              </div>

              {isRoomDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#fff',
                  border: '1px solid rgba(32, 53, 43, 0.15)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '8px'
                }}>
                  {displayRooms.map((r) => {
                    const cap = r.guests.includes("3") ? 3 : 2;
                    return (
                      <label key={r.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'background 0.2s'
                      }} className="hover:bg-[#f5f0e8]">
                        <input
                          type="checkbox"
                          value={r.id}
                          checked={selectedRoomIds.includes(r.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoomIds([...selectedRoomIds, r.id]);
                            } else {
                              setSelectedRoomIds(selectedRoomIds.filter(id => id !== r.id));
                            }
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            margin: 0,
                            cursor: 'pointer',
                            accentColor: '#20352b'
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#20352b' }}>{r.name}</span>
                          <span style={{ fontSize: '11px', color: '#77766c' }}>{r.badge} ({cap} Guests) — ₹{r.price.replace(/[^0-9,]/g, "")}/night</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <label style={{ margin: 0 }}>
              Number of Guests
              <div className="guest-control">
                <button type="button" onClick={() => setGuestsVal((v) => Math.max(1, v - 1))}><Minus size={14} /></button>
                <span>{guestsVal} {guestsVal === 1 ? "Guest" : "Guests"}</span>
                <button type="button" onClick={() => setGuestsVal((v) => Math.min(10, v + 1))}><Plus size={14} /></button>
              </div>
            </label>

          </div>
        </div>
        
        <div className="form-row" style={{ display: 'block' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Got a Promo Code?</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Enter code" 
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon.code) {
                  setAppliedCoupon(null);
                }
              }}
              style={{ textTransform: 'uppercase' }}
            />
            <button 
              type="button" 
              className="button button-outline" 
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !couponCode.trim() || !checkInVal || !checkOutVal}
              style={{ padding: '0 16px', height: '44px', whiteSpace: 'nowrap' }}
            >
              {applyingCoupon ? "Applying..." : "Apply"}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
          {appliedCoupon && (
            <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> Coupon applied! ₹{appliedCoupon.discount_amount.toLocaleString()} will be deducted.
            </p>
          )}
          {(!checkInVal || !checkOutVal) && couponCode.trim() && !appliedCoupon && !couponError && (
             <p className="text-[#c87a1e] text-xs mt-1">Please select check-in and check-out dates first to validate coupon.</p>
          )}
        </div>
        
        <label>Your email<input type="email" placeholder="Enter email" defaultValue={currentUser?.email || ""} ref={emailRef} required /></label><button type="submit" className="button button-dark form-submit" disabled={bookingLoading || datesUnavailable}>{bookingLoading ? "Sending…" : datesUnavailable ? "Dates Unavailable — Pick Other Dates" : <>Check availability<ArrowRight size={16} /></>}</button><small className="form-footnote"><Check size={13} /> No advance online payment required • Pay directly at homestay front desk</small></>}</form></div></section>

        <section id="contact" className="section-pad section-soft">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column: Direct Enquiry Form */}
              <div className="lg:col-span-6 reveal">
                <span className="eyebrow">Homestay Enquiry</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#20352b] mt-2 mb-3">
                  Have a question?<br /><em>Send us an enquiry.</em>
                </h2>
                <p className="text-xs sm:text-sm text-[#77766c] leading-relaxed mb-6">
                  Have a special request, question about room amenities, local sightseeing, or planning a group stay? Submit your details below. All enquiries directly arrive at our homestay admin desk.
                </p>

                <form onSubmit={submitEnquiry} className="p-6 sm:p-7 rounded-3xl bg-[#fbf8f1] border border-[#20352b]/15 shadow-sm space-y-4">
                  {enquirySent ? (
                    <div className="text-center py-8 space-y-3">
                      <CheckCircle2 size={42} className="mx-auto text-emerald-700" />
                      <h4 className="font-serif text-lg text-[#20352b]">Enquiry Received!</h4>
                      <p className="text-xs text-[#77766c] max-w-sm mx-auto">
                        Thank you for reaching out to Casa Nest. Our hosts have received your enquiry in the admin portal and will contact you via email or phone shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => setEnquirySent(false)}
                        className="button button-dark px-4 py-2 text-xs mt-2"
                      >
                        Send Another Enquiry
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter your name"
                            defaultValue={currentUser?.name || ""}
                            value={enquiryName}
                            onChange={(e) => setEnquiryName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={enquiryPhone}
                            onChange={(e) => setEnquiryPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="Enter email"
                            defaultValue={currentUser?.email || ""}
                            value={enquiryEmail}
                            onChange={(e) => setEnquiryEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                            Enquiry Topic
                          </label>
                          <select
                            value={enquirySubject}
                            onChange={(e) => setEnquirySubject(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b]"
                          >
                            <option value="General Homestay Enquiry">General Homestay Enquiry</option>
                            <option value="Room Availability & Rates">Room Availability & Rates</option>
                            <option value="Group or Whole-Villa Booking">Group or Whole-Villa Booking</option>
                            <option value="Early Check-In / Late Check-Out">Early Check-In / Late Check-Out</option>
                            <option value="Station / Airport Cab Pickup">Station / Airport Cab Pickup</option>
                            <option value="Local Kashi Ghat & Temple Guide">Local Kashi Ghat & Temple Guide</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-[#20352b] mb-1">
                          Your Message / Special Requests *
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Tell us what you would like to know or how we can assist your stay..."
                          value={enquiryMessage}
                          onChange={(e) => setEnquiryMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#20352b]/15 bg-white text-xs text-[#20352b] focus:outline-none focus:border-[#20352b] resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={enquiryLoading}
                        className="button button-dark w-full py-2.5 text-xs flex items-center justify-center gap-2"
                      >
                        <Send size={13} />
                        <span>{enquiryLoading ? "Submitting Enquiry..." : "Send Enquiry to Host"}</span>
                      </button>
                    </>
                  )}
                </form>
              </div>

              {/* Right Column: FAQs */}
              <div className="lg:col-span-6 reveal reveal-delay-2">
                <span className="eyebrow">FAQ</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#20352b] mt-2 mb-3">
                  Quick answers
                </h2>
                <p className="text-xs sm:text-sm text-[#77766c] leading-relaxed mb-6">
                  Everything you need to know for a smooth and comfortable stay at Casa Nest.
                </p>

                <div className="faq-list">
                  {faqs.map((faq, index) => (
                    <div className={`faq-item ${activeFaq === index ? "is-active" : ""}`} key={faq.question}>
                      <button onClick={() => setActiveFaq(activeFaq === index ? -1 : index)} aria-expanded={activeFaq === index}>
                        <span>{faq.question}</span>
                        {activeFaq === index ? <Minus size={16} /> : <Plus size={16} />}
                      </button>
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BookingInvoiceModal booking={confirmedBookingForInvoice} isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} />
      <EnquirySlipModal enquiry={confirmedEnquiry} isOpen={isEnquiryModalOpen} onClose={() => setIsEnquiryModalOpen(false)} />

      <footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><BrandMark light /><p>Stay different.<br />Feel at home.</p><span className="footer-leaf" aria-hidden="true">⌁</span></div><div className="footer-links"><strong>Quick Links</strong><button onClick={() => scrollTo("home")}>Home</button><button onClick={() => scrollTo("about")}>About</button><button onClick={() => scrollTo("rooms")}>Rooms</button><button onClick={() => scrollTo("facilities")}>Facilities</button><button onClick={() => scrollTo("experiences")}>Experiences</button><button onClick={() => scrollTo("attractions")}>Attractions</button><button onClick={() => scrollTo("reviews")}>Guest Reviews</button><button onClick={() => scrollTo("patio")}>Open Patio</button><button onClick={() => scrollTo("gallery")}>Gallery</button><button onClick={() => scrollTo("contact")}>Contact</button>
        <button onClick={() => window.location.href = "/admin/login"}>Staff & Admin Portal</button></div><div className="footer-contact"><strong>Contact Us</strong><a href="tel:+918400095434"><Phone size={13} /> +91 84000 95434</a><a href="tel:+919336941261"><Phone size={13} /> +91 93369 41261</a><a href="mailto:Info@casanesthomestay.in"><Send size={13} /> Info@casanesthomestay.in</a><a href="https://maps.google.com/?q=B23/33+Plot+58,+Gurudham+Colony,+Near+PMO+Office,+Varanasi" target="_blank" rel="noreferrer"><MapPin size={13} /> B23/33 Plot 58, Gurudham Colony (Near PMO Office), Varanasi</a><div className="socials"><a href="https://www.instagram.com/casa_nest__?stkn=eWU0M3Ryb3lvZjkx&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16} /></a><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={16} /></a><a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={16} /></a></div></div><div className="footer-newsletter"><strong>Newsletter</strong><p>Get updates, offers and travel stories.</p><form onSubmit={(event) => { event.preventDefault(); setToast("You’re on the Casa Nest list. Welcome in."); }}><input type="email" aria-label="Email address" placeholder="Enter your email" required /><button type="submit" aria-label="Subscribe"><ArrowRight size={15} /></button></form></div></div><div className="container footer-bottom"><span>© 2025 Casa Nest. All rights reserved.</span><div><button onClick={() => setToast("Privacy is part of feeling at home.")}>Privacy Policy</button><button onClick={() => setToast("Terms coming soon.")}>Terms & Conditions</button><button onClick={() => window.location.href = "/admin/login"}>Admin Login</button></div></div></footer>
      {/* Lightbox / Full Photo Viewer */}
      {selectedImageIndex !== null && displayGallery[selectedImageIndex] && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            className="lightbox-close"
            aria-label="Close gallery"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X size={21} />
          </button>

          {/* Previous Image Arrow */}
          <button
            className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-20 cursor-pointer border border-white/20 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) =>
                prev !== null ? (prev > 0 ? prev - 1 : displayGallery.length - 1) : 0
              );
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Next Image Arrow */}
          <button
            className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all z-20 cursor-pointer border border-white/20 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) =>
                prev !== null ? (prev < displayGallery.length - 1 ? prev + 1 : 0) : 0
              );
            }}
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>

          <div
            className="relative max-w-4xl max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {displayGallery[selectedImageIndex].image.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={displayGallery[selectedImageIndex].image}
                className="max-w-full max-h-[74vh] object-contain rounded-xl shadow-2xl border border-white/10"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={displayGallery[selectedImageIndex].image}
                alt={displayGallery[selectedImageIndex].alt}
                className="max-w-full max-h-[74vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
            )}
            <div className="mt-3 text-center px-5 py-2.5 rounded-xl bg-black/75 backdrop-blur-md text-white max-w-xl shadow-lg border border-white/10">
              <div className="flex items-center justify-center gap-2 text-xs text-[#c8a36a] font-semibold mb-1">
                <span className="uppercase tracking-wider font-mono text-[10px]">
                  {displayGallery[selectedImageIndex].category || "Casa Nest Gallery"}
                </span>
                <span>•</span>
                <span>
                  Photo {selectedImageIndex + 1} of {displayGallery.length}
                </span>
              </div>
              <p className="text-xs text-white/95 font-medium leading-snug">
                {displayGallery[selectedImageIndex].alt}
              </p>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} /> {toast}</div>}
      <PatioBookingModal
        isOpen={isPatioModalOpen}
        onClose={() => setIsPatioModalOpen(false)}
        defaultHostName={currentUser?.name}
        defaultHostEmail={currentUser?.email}
      />
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        defaultName={currentUser?.name}
        defaultEmail={currentUser?.email}
        userId={currentUser?.id}
        onReviewSubmitted={loadApprovedReviews}
      />
      <AllReviewsModal
        isOpen={isAllReviewsModalOpen}
        onClose={() => setIsAllReviewsModalOpen(false)}
        reviews={liveReviews}
        onOpenWriteReview={() => setIsReviewModalOpen(true)}
      />
      <RoomDetailModal
        room={selectedDetailRoom}
        isOpen={!!selectedDetailRoom}
        onClose={() => setSelectedDetailRoom(null)}
        onBookRoom={(roomId) => {
          setSelectedRoomIds([roomId]);
          scrollTo("booking");
        }}
      />
    </div>
  );
}









