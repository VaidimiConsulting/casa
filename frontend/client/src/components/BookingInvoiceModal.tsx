import React from "react";
import { X, Printer, CheckCircle2, Clock, ShieldCheck, MapPin, Phone, Mail, Sparkles, Building2 } from "lucide-react";
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-2xl bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:w-full">
        
        {/* Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#20352b] text-[#fbf8f1] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#c8a36a]" />
            <span className="font-serif font-bold text-sm tracking-wide">
              Official Booking Voucher & Tax Invoice
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c8a36a] text-[#20352b] font-semibold text-xs hover:bg-[#b8935a] transition-colors cursor-pointer"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#fbf8f1]/70 hover:text-[#fbf8f1] hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-[#20352b] font-sans printable-invoice">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#20352b]/15">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Casa Nest" className="w-10 h-10 object-contain mix-blend-multiply scale-125" />
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-tight text-[#20352b] leading-none">
                    Casa Nest Homestay
                  </h1>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c8a36a] font-semibold">
                    Kashi • Varanasi • India
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#77766c] mt-2 flex items-center gap-1">
                <MapPin size={11} className="text-[#c8a36a]" /> B23/33 Plot 58, Gurudham Colony (Near PMO Office), Varanasi, Uttar Pradesh
              </p>
              <p className="text-[11px] text-[#77766c] flex items-center gap-1">
                <Phone size={11} className="text-[#c8a36a]" /> +91 84000 95434, +91 93369 41261 • Info@casanesthomestay.in
              </p>
            </div>

            <div className="sm:text-right bg-[#f5f0e8] p-3 rounded-2xl border border-[#20352b]/10 text-xs">
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Voucher & Invoice No.</span>
              <span className="font-mono font-bold text-sm text-[#20352b] block">{invoiceNumber}</span>
              <span className="text-[10px] text-[#77766c] block mt-1">
                Date: {new Date(booking.created_at || Date.now()).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#20352b]/10 text-[#20352b]">
                Booking #{booking.id}
              </span>
            </div>
          </div>

          {/* Guest and Stay Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Guest Details */}
            <div className="p-4 rounded-2xl bg-[#f5f0e8]/80 border border-[#20352b]/10 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-[#c8a36a] block">
                Guest Information
              </span>
              <p className="font-bold text-sm text-[#20352b]">{booking.guest_name}</p>
              <p className="text-[#77766c] flex items-center gap-1.5">
                <Mail size={12} /> {booking.guest_email}
              </p>
              {booking.guest_phone && (
                <p className="text-[#77766c] flex items-center gap-1.5">
                  <Phone size={12} /> {booking.guest_phone}
                </p>
              )}
              <p className="text-[#77766c] text-[11px] pt-1">
                Number of Guests: <strong>{booking.guests} Guest(s)</strong>
              </p>
            </div>

            {/* Stay Schedule & Timing */}
            <div className="p-4 rounded-2xl bg-[#f5f0e8]/80 border border-[#20352b]/10 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-[#c8a36a] block">
                Stay Schedule & Timing
              </span>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <span className="text-[10px] text-[#77766c] block">Check-In Date</span>
                  <span className="font-bold text-xs text-[#20352b]">
                    {checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-[10px] text-[#c8a36a] font-semibold block mt-0.5">
                    From 12:00 PM
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#77766c] block">Check-Out Date</span>
                  <span className="font-bold text-xs text-[#20352b]">
                    {checkOut.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-[10px] text-[#c8a36a] font-semibold block mt-0.5">
                    Until 11:00 AM
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#20352b]/10 flex items-center justify-between text-[11px]">
                <span className="text-[#77766c]">Stay Duration:</span>
                <span className="font-bold text-[#20352b]">{nights} Night(s)</span>
              </div>
            </div>
          </div>

          {/* Reserved Room */}
          <div className="p-4 rounded-2xl bg-[#20352b] text-[#fbf8f1] flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#c8a36a] font-semibold block">
                Reserved Accommodation
              </span>
              <h2 className="font-serif text-lg font-bold text-[#fbf8f1] mt-0.5">
                {booking.room_name || "Casa Nest Room"}
              </h2>
              {booking.room_type && (
                <p className="text-[11px] text-[#fbf8f1]/80">{booking.room_type}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-[#fbf8f1]/70 block">Tariff / Night</span>
              <span className="font-mono text-base font-bold text-[#c8a36a]">
                ₹{pricePerNight.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Itemized Billing Breakdown */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-[#77766c] block">
              Billing & Tariff Breakdown
            </span>
            <div className="rounded-2xl border border-[#20352b]/15 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#f5f0e8] text-[#77766c] font-mono text-[10px] uppercase border-b border-[#20352b]/10">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Rate</th>
                    <th className="p-3 text-center">Qty / Nights</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20352b]/10">
                  <tr>
                    <td className="p-3">
                      <span className="font-semibold block">{booking.room_name || "Homestay Room Stay"}</span>
                      <span className="text-[10px] text-[#77766c]">
                        Accommodation tariff for {nights} night(s)
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">₹{pricePerNight.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-center font-mono">{nights}</td>
                    <td className="p-3 text-right font-mono font-semibold">₹{baseTotal.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-[#f5f0e8]/30">
                    <td className="p-3" colSpan={3}>
                      <span className="text-[11px] text-[#77766c]">Taxes & Homestay Service Charges</span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-[#77766c]">
                      Included
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#f5f0e8] font-bold border-t border-[#20352b]/15">
                  <tr>
                    <td className="p-3 text-sm" colSpan={3}>Grand Total Amount Payable</td>
                    <td className="p-3 text-right font-mono text-base text-[#20352b]">
                      ₹{Number(booking.total_amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Status & Details */}
          <div className="p-4 rounded-2xl bg-[#f5f0e8] border border-[#20352b]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Payment Summary</span>
              <div className="flex items-center gap-2 mt-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-bold font-mono uppercase">
                    <CheckCircle2 size={12} /> Settled & Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold font-mono uppercase">
                    <Clock size={12} /> Settle at Front Desk (Cash / UPI)
                  </span>
                )}
                <span className="text-xs text-[#77766c]">
                  Mode: <strong>{booking.payment_method || "Cash / UPI at Check-in"}</strong>
                </span>
              </div>
              {booking.transaction_id && (
                <span className="text-[10px] font-mono text-[#77766c] block mt-1">
                  Transaction Ref: {booking.transaction_id}
                </span>
              )}
            </div>

            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#20352b]/10 sm:pl-6 pt-2 sm:pt-0">
              <span className="text-[10px] uppercase font-mono text-[#77766c] block">Amount Due</span>
              <span className="font-mono text-lg font-bold text-[#20352b]">
                {isPaid ? "₹0.00" : `₹${Number(booking.total_amount).toLocaleString("en-IN")}`}
              </span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-3.5 rounded-xl bg-[#f5f0e8]/50 border border-[#20352b]/10 text-[10px] text-[#77766c] space-y-1">
            <p className="font-semibold text-[#20352b]">Check-in Guidelines:</p>
            <p>• Government photo identification (Aadhaar, Passport, or Voter ID) is mandatory for all staying guests.</p>
            <p>• Standard Check-in is 12:00 PM and Check-out is 11:00 AM. Early check-in is subject to availability.</p>
            <p>• Zero advance payment needed. You can pay conveniently via UPI, QR code, or Cash upon arrival.</p>
          </div>

          {/* Signatures */}
          <div className="pt-4 border-t border-[#20352b]/10 flex items-center justify-between text-[10px] text-[#77766c]">
            <div>
              <p>Generated by Casa Nest Reservations System</p>
              <p>Thank you for choosing Casa Nest Homestay!</p>
            </div>
            <div className="text-right">
              <div className="h-8 border-b border-[#20352b]/30 w-32 ml-auto mb-1" />
              <p className="font-semibold text-[#20352b]">Authorized Front Desk</p>
            </div>
          </div>

        </div>

        {/* Bottom Download & Print Bar (Hidden in Print) */}
        <div className="px-6 py-4 bg-[#efe7db]/80 border-t border-[#20352b]/10 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <p className="text-[11px] text-[#77766c]">
            Tip: Click <strong>"Download Slip (PDF)"</strong> to save or print your official hotel tax voucher.
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
              className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
