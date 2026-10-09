import React from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle2, Clock, ShieldCheck, MapPin, Phone, Mail, Sparkles, AlertTriangle, FileText, Ban, UserCheck } from "lucide-react";
import { Booking } from "@/api/bookings";

interface BookingInvoiceModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingInvoiceModal({ booking, isOpen, onClose }: BookingInvoiceModalProps) {
  if (!isOpen || !booking) return null;

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );

  const pricePerNight = booking.price_per_night ? Number(booking.price_per_night) : Math.round(Number(booking.total_amount) / nights);
  const baseTotal = pricePerNight * nights;
  const isPaid = booking.payment_status === "paid";
  const invoiceNumber = `INV-CN-${String(booking.id).padStart(5, "0")}`;

  const bookingDate = new Date(booking.created_at || Date.now());
  const formattedBookingDayTime = bookingDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " • " + bookingDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const checkInFormatted = checkIn.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const checkOutFormatted = checkOut.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto print:static print:inset-auto print:p-0 print:bg-white print:overflow-visible print:block">
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden my-6 print:m-0 print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 bg-[#20352b] text-[#fbf8f1] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#c8a36a]" />
            <span className="font-serif font-bold text-sm tracking-wide text-white">
              Official Booking Voucher & Tax Invoice
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
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-full text-[#fbf8f1]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-5 sm:p-8 md:p-9 space-y-5 text-[#20352b] font-sans printable-invoice bg-[#fbf8f1]">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#20352b]/15">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Casa Nest" className="w-11 h-11 object-contain mix-blend-multiply" />
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-[#20352b] leading-tight">
                    Casa Nest Homestay
                  </h1>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c8a36a] font-bold">
                    Kashi • Varanasi • Uttar Pradesh • India
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#555] mt-2 flex items-center gap-1.5">
                <MapPin size={11} className="text-[#c8a36a] shrink-0" />
                <span>B23/33 Plot 58, Gurudham Colony (Near PMO Office), Varanasi, UP - 221010</span>
              </p>
              <p className="text-[11px] text-[#555] flex items-center gap-1.5 mt-0.5">
                <Phone size={11} className="text-[#c8a36a] shrink-0" />
                <span>+91 84000 95434, +91 93369 41261 • Email: Info@casanesthomestay.in</span>
              </p>
            </div>

            <div className="sm:text-right bg-[#f5f0e8] p-3.5 rounded-2xl border border-[#20352b]/10 text-xs shrink-0">
              <span className="text-[10px] uppercase font-mono font-bold text-[#77766c] block">Voucher & Invoice No.</span>
              <span className="font-mono font-bold text-sm text-[#20352b] block">{invoiceNumber}</span>
              <span className="text-[10px] text-[#77766c] block mt-1">
                <strong>Booking ID:</strong> #{booking.id}
              </span>
              <span className="text-[10px] text-[#77766c] block">
                <strong>Issued:</strong> {formattedBookingDayTime}
              </span>
              <div className="mt-1.5">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-green-100 text-green-800 border border-green-200">
                    <CheckCircle2 size={11} /> Confirmed & Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <Clock size={11} /> Pay at Front Desk
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Guest and Stay Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Guest Details & Number of People */}
            <div className="p-4 rounded-2xl bg-[#f5f0e8]/90 border border-[#20352b]/10 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#c8a36a] block">
                Guest & Occupancy Details
              </span>
              <p className="font-bold text-sm text-[#20352b]">{booking.guest_name}</p>
              <p className="text-[#555] flex items-center gap-1.5">
                <Mail size={12} className="text-[#c8a36a]" /> {booking.guest_email}
              </p>
              {booking.guest_phone && (
                <p className="text-[#555] flex items-center gap-1.5">
                  <Phone size={12} className="text-[#c8a36a]" /> {booking.guest_phone}
                </p>
              )}
              <div className="pt-2 mt-1 border-t border-[#20352b]/10 flex items-center justify-between text-xs">
                <span className="text-[#77766c] font-medium">Number of People / Guests:</span>
                <span className="font-bold font-mono text-[#20352b] bg-white px-2.5 py-0.5 rounded-lg border border-[#20352b]/10">
                  {booking.guests} Guest{booking.guests > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Stay Schedule, Day & Timing */}
            <div className="p-4 rounded-2xl bg-[#f5f0e8]/90 border border-[#20352b]/10 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#c8a36a] block">
                Stay Schedule & Timings
              </span>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <span className="text-[10px] text-[#77766c] block uppercase font-mono">Check-In</span>
                  <span className="font-bold text-xs text-[#20352b] block">
                    {checkInFormatted}
                  </span>
                  <span className="text-[10px] text-[#9e6d27] font-semibold block mt-0.5">
                    Time: From 12:00 PM (Noon)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#77766c] block uppercase font-mono">Check-Out</span>
                  <span className="font-bold text-xs text-[#20352b] block">
                    {checkOutFormatted}
                  </span>
                  <span className="text-[10px] text-[#9e6d27] font-semibold block mt-0.5">
                    Time: Until 11:00 AM
                  </span>
                </div>
              </div>
              <div className="pt-2 mt-1 border-t border-[#20352b]/10 flex items-center justify-between text-[11px]">
                <span className="text-[#77766c]">Total Duration of Stay:</span>
                <span className="font-bold text-[#20352b]">{nights} Night{nights > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Reserved Accommodation Room */}
          <div className="p-4 rounded-2xl bg-[#20352b] text-[#fbf8f1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-bold block">
                Reserved Accommodation
              </span>
              <h2 className="font-serif text-lg font-bold text-white mt-0.5">
                {booking.room_name || "Casa Nest Room"}
              </h2>
              {booking.room_type && (
                <p className="text-[11px] text-[#fbf8f1]/80">{booking.room_type} • Attached Modern Bath & AC</p>
              )}
            </div>
            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
              <span className="text-[10px] uppercase font-mono text-[#fbf8f1]/70 block">Tariff / Night</span>
              <span className="font-mono text-base font-bold text-[#c8a36a]">
                ₹{pricePerNight.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Itemized Billing Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#77766c] block">
              Billing & Tariff Breakdown
            </span>
            <div className="rounded-2xl border border-[#20352b]/15 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#f5f0e8] text-[#77766c] font-mono text-[10px] uppercase border-b border-[#20352b]/10">
                  <tr>
                    <th className="p-3">Description / Item</th>
                    <th className="p-3 text-center">Rate / Night</th>
                    <th className="p-3 text-center">Nights</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20352b]/10">
                  <tr>
                    <td className="p-3">
                      <span className="font-semibold text-[#20352b] block">{booking.room_name || "Homestay Room Stay"}</span>
                      <span className="text-[10px] text-[#77766c]">
                        Accommodation tariff for {nights} night(s) ({booking.guests} guest{booking.guests > 1 ? "s" : ""})
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">₹{pricePerNight.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-center font-mono">{nights}</td>
                    <td className="p-3 text-right font-mono font-semibold">₹{baseTotal.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#f5f0e8]/40">
                    <td className="p-3" colSpan={3}>
                      <span className="text-[11px] text-[#77766c]">Complimentary Fresh Breakfast & High-Speed Wi-Fi</span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-emerald-700 font-semibold">
                      FREE / Included
                    </td>
                  </tr>
                  <tr className="bg-[#f5f0e8]/20">
                    <td className="p-3" colSpan={3}>
                      <span className="text-[11px] text-[#77766c]">Applicable Taxes & Homestay Service Charges</span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-[#77766c]">
                      Included
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#f5f0e8] font-bold border-t border-[#20352b]/15">
                  <tr>
                    <td className="p-3 text-sm text-[#20352b]" colSpan={3}>Grand Total Amount</td>
                    <td className="p-3 text-right font-mono text-base text-[#20352b]">
                      ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Status & Balance Summary */}
          <div className="p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[#77766c] block">Payment Summary</span>
              <div className="flex items-center gap-2 mt-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-bold font-mono uppercase">
                    <CheckCircle2 size={12} /> Settled & Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold font-mono uppercase">
                    <Clock size={12} /> Settle at Front Desk (Cash / UPI / QR)
                  </span>
                )}
                <span className="text-xs text-[#555]">
                  Mode: <strong>{booking.payment_method || "Cash / UPI at Check-in"}</strong>
                </span>
              </div>
              {booking.transaction_id && (
                <span className="text-[10px] font-mono text-[#77766c] block mt-1">
                  Transaction Ref: <strong>{booking.transaction_id}</strong>
                </span>
              )}
            </div>

            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#20352b]/10 sm:pl-6 pt-2 sm:pt-0">
              <span className="text-[10px] uppercase font-mono font-bold text-[#77766c] block">Balance Amount Due</span>
              <span className="font-mono text-lg font-bold text-[#20352b]">
                {isPaid ? "₹0.00 (Fully Settled)" : `₹${Number(booking.total_amount).toLocaleString("en-IN")}`}
              </span>
            </div>
          </div>

          {/* ACTION REQUIRED: WHATSAPP CONFIRMATION */}
          {booking.status === "pending" && !isPaid && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center gap-3">
              <AlertTriangle size={24} className="text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm mb-0.5 text-rose-800">Your Booking is NOT Confirmed Yet!</span>
                Your booking request is received but pending. Your booking will only be confirmed once you make the payment and receive a confirmation message from the Admin. Please call or WhatsApp the owner at <a href="https://wa.me/918400095434" target="_blank" rel="noreferrer" className="font-bold underline text-emerald-700">+91 84000 95434</a> to confirm your reservation.
              </div>
            </div>
          )}

          {/* IMPORTANT NOTICE & TERMS & CONDITIONS SECTION */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#fef6e7] border-2 border-[#e6b35a]/50 text-xs text-[#20352b] space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 pb-1.5 border-b border-[#e6b35a]/40">
              <AlertTriangle size={16} className="text-[#c87a1e] shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#91560f] font-mono">
                Important Notice & Homestay Policies / अति आवश्यक नियम व शर्तें
              </h4>
            </div>

            <div className="space-y-2 text-[11px] leading-relaxed text-[#4a3512]">
              {/* Point 1: Booking Confirmation Call */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">1.</span>
                <p>
                  <strong className="text-[#20352b]">Booking Confirmation (बुकिंग कन्फर्मेशन):</strong>{" "}
                  Please call or WhatsApp the owner at <strong className="text-emerald-700">+91 84000 95434</strong> once to verbally confirm your booking and arrangements. (बुकिंग कन्फर्म करने के लिए कृपया एक बार कॉल या व्हाट्सएप पर बात अवश्य करें।)
                </p>
              </div>

              {/* Point 2: Advance Money Non-Refundable */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">2.</span>
                <p>
                  <strong className="text-[#20352b]">Advance Payment Non-Refundable (एडवांस राशि वापसी नहीं होगी):</strong>{" "}
                  Advance booking deposit/amount once paid is <span className="underline font-bold text-rose-800">strictly NON-REFUNDABLE at any cost</span> under any circumstances or cancellations.
                </p>
              </div>

              {/* Point 3: Property Damage and Breakage */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">3.</span>
                <p>
                  <strong className="text-[#20352b]">Property Damage & Breakage Liability (सामान की टूट-फूट का भुगतान):</strong>{" "}
                  Any damage, breakage, loss, or heavy staining of hotel/homestay property, furniture, linen, electrical appliances, bath fittings, or room decor items <span className="underline font-bold text-rose-800">will be charged directly to the guest at 100% replacement/repair cost</span> before departure.
                </p>
              </div>

              {/* Point 4: Mandatory Government ID */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">4.</span>
                <p>
                  <strong className="text-[#20352b]">Mandatory ID Verification (पहचान पत्र अनिवार्य):</strong>{" "}
                  Original Government-approved Photo ID with valid address (Aadhaar Card, Passport, Voter ID, or Driving License) is mandatory for <strong>ALL staying guests</strong> at the time of check-in. PAN Card is not accepted as address proof.
                </p>
              </div>

              {/* Point 5: Check-in / Check-out Timings */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">5.</span>
                <p>
                  <strong className="text-[#20352b]">Timings Policy (समय सीमा):</strong>{" "}
                  Standard Check-in is <strong>12:00 PM (Noon)</strong> and Check-out is <strong>11:00 AM</strong>. Early check-in or late check-out is subject to prior confirmation and room availability.
                </p>
              </div>

              {/* Point 6: Peace, Safety & Cleanliness */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">6.</span>
                <p>
                  <strong className="text-[#20352b]">Homestay Decorum & Prohibitions (शांति व स्वच्छता):</strong>{" "}
                  Smoking inside rooms, illegal substances, and loud noise during night hours are strictly prohibited. Guests are requested to preserve the peaceful spiritual ambiance of the homestay.
                </p>
              </div>

              {/* Point 7: Valuables */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#c87a1e] shrink-0 mt-0.5">7.</span>
                <p>
                  <strong className="text-[#20352b]">Guest Belongings & Valuables (कीमती सामान):</strong>{" "}
                  Guests are advised to take personal care of their cash, jewellery, and electronic gadgets. Management holds no responsibility for any unattended loss.
                </p>
              </div>
            </div>
          </div>

          {/* Signatures & System Verification */}
          <div className="pt-4 border-t border-[#20352b]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#77766c]">
            <div>
              <p className="font-semibold text-[#20352b]">Generated via Casa Nest Reservations & Billing System</p>
              <p>Thank you for choosing Casa Nest Homestay — A peaceful stay away from home!</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="h-9 border-b border-dashed border-[#20352b]/30 w-36 mx-auto sm:ml-auto mb-1" />
              <p className="font-bold text-[#20352b] uppercase font-mono text-[10px]">Authorized Signature / Front Desk</p>
            </div>
          </div>

        </div>

        {/* Bottom Download & Print Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-[#efe7db] border-t border-[#20352b]/15 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <p className="text-[11px] text-[#77766c] text-center sm:text-left">
            Tip: Click <strong>"Download Slip (PDF) / Print"</strong> to save this official booking voucher & tax invoice on your phone or PC.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="button button-dark px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer size={13} />
              <span>Download Slip (PDF) / Print</span>
            </button>
            <button
              onClick={onClose}
              className="button button-light border border-[#20352b]/20 px-4 py-2 text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

