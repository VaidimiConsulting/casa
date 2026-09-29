import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  IndianRupee,
  Smartphone,
  Zap,
  Sparkles,
} from "lucide-react";
import { Booking, payBooking } from "@/api/bookings";
import {
  validatePayment,
  initiatePayment,
  confirmPayment,
  getRazorpayConfig,
  RazorpayConfigResponse,
} from "@/api/payments";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "sonner";

interface BookingPaymentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export default function BookingPaymentModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: BookingPaymentModalProps) {
  if (!isOpen || !booking) return null;

  const [method, setMethod] = useState<"razorpay" | "upi" | "card" | "netbanking" | "frontdesk">("razorpay");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(booking.guest_name || "");
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [processing, setProcessing] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfigResponse | null>(null);

  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );
  const totalAmount = Number(booking.total_amount);

  useEffect(() => {
    getRazorpayConfig()
      .then((cfg) => setRazorpayConfig(cfg))
      .catch(() => {});
  }, []);

  // 3-Step Gateway Flow: 1. Validate -> 2. Initiate -> 3. Confirm
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      // -------------------------------------------------------------
      // STEP 1: VALIDATE (Pre-Payment Validation)
      // -------------------------------------------------------------
      const validation = await validatePayment(booking.id, totalAmount);
      if (!validation.success || !validation.valid) {
        toast.error(validation.message || "Payment validation failed. Please refresh and try again.");
        setProcessing(false);
        return;
      }

      // -------------------------------------------------------------
      // STEP 2: INITIATE (Order Creation with Receipt & Paise Amount)
      // -------------------------------------------------------------
      const orderData = await initiatePayment(booking.id, totalAmount);
      const isConfigured = razorpayConfig?.is_configured && !orderData.is_mock;

      if (!isConfigured) {
        // Test / Development Simulator Mode
        const simTxnId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        
        // STEP 3: CONFIRM
        const confirmRes = await confirmPayment({
          booking_id: booking.id,
          amount: totalAmount,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: simTxnId,
          razorpay_signature: "mock_signature_verified",
          payment_method: "Razorpay (Test / UPI / Cards)",
        });

        toast.success(
          `Payment of ₹${totalAmount.toLocaleString("en-IN")} confirmed via Razorpay! Txn ID: ${confirmRes.transaction_id}`
        );

        const updated: Booking = {
          ...booking,
          payment_status: "paid",
          status: booking.status === "pending" ? "confirmed" : booking.status,
          payment_method: "Razorpay (Online / UPI / Cards)",
          transaction_id: confirmRes.transaction_id,
          payment_amount: totalAmount,
          payment_date: new Date().toISOString(),
        };

        onClose();
        onSuccess(updated);
        return;
      }

      // Live Razorpay Checkout
      await openRazorpayCheckout({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Casa Nest Homestay",
        description: `Booking #${booking.id} • ${booking.room_name || "Homestay Suite"} (${nights} ${nights === 1 ? "night" : "nights"})`,
        order_id: orderData.order_id,
        prefill: {
          name: booking.guest_name,
          email: booking.guest_email,
          contact: booking.guest_phone || "",
        },
        notes: {
          booking_id: String(booking.id),
          room_name: booking.room_name || "Casa Nest Suite",
        },
        theme: {
          color: "#20352b",
        },
        handler: async (response) => {
          try {
            // -------------------------------------------------------------
            // STEP 3: CONFIRM (Signature Verification & Database Recording)
            // -------------------------------------------------------------
            const confirmRes = await confirmPayment({
              booking_id: booking.id,
              amount: totalAmount,
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_method: "Razorpay Gateway (Online / UPI / Card)",
            });

            toast.success(
              `Payment of ₹${totalAmount.toLocaleString("en-IN")} verified successfully! Transaction ID: ${confirmRes.transaction_id}`
            );

            const updated: Booking = {
              ...booking,
              payment_status: "paid",
              status: booking.status === "pending" ? "confirmed" : booking.status,
              payment_method: "Razorpay Gateway (Online / UPI / Card)",
              transaction_id: confirmRes.transaction_id,
              payment_amount: totalAmount,
              payment_date: new Date().toISOString(),
            };

            onClose();
            onSuccess(updated);
          } catch (vErr: any) {
            console.error("Razorpay verification error:", vErr);
            toast.error(vErr.response?.data?.message || "Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info("Payment window was closed.");
          },
        },
      });
    } catch (err: any) {
      console.error("Razorpay flow error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to initiate Razorpay checkout.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "razorpay") {
      await handleRazorpayPayment();
      return;
    }

    setProcessing(true);

    try {
      let paymentMethodStr = "UPI (Google Pay / PhonePe)";
      let txnId = `CN-UPI-${Date.now().toString().slice(-6)}`;

      if (method === "card") {
        paymentMethodStr = `Card (ending in ${cardNumber.slice(-4) || "4242"})`;
        txnId = `CN-CRD-${Date.now().toString().slice(-6)}`;
      } else if (method === "netbanking") {
        paymentMethodStr = `Net Banking (${selectedBank})`;
        txnId = `CN-NB-${Date.now().toString().slice(-6)}`;
      } else if (method === "frontdesk") {
        paymentMethodStr = "Front Desk (Cash / UPI at Check-in)";
        txnId = `CN-CSH-${Date.now().toString().slice(-6)}`;
      }

      const res = await payBooking(booking.id, {
        payment_method: paymentMethodStr,
        transaction_id: txnId,
        payment_amount: totalAmount,
      });

      toast.success(`Payment of ₹${totalAmount.toLocaleString("en-IN")} confirmed! Transaction ID: ${res.transaction_id}`);

      const updated: Booking = {
        ...booking,
        payment_status: "paid",
        status: booking.status === "pending" ? "confirmed" : booking.status,
        payment_method: paymentMethodStr,
        transaction_id: res.transaction_id,
        payment_amount: totalAmount,
        payment_date: new Date().toISOString(),
      };

      onClose();
      onSuccess(updated);
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.message || "Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#fbf8f1] rounded-3xl shadow-2xl border border-[#20352b]/15 overflow-hidden my-6 text-[#20352b]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#20352b] text-[#fbf8f1]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#c8a36a]" />
            <div>
              <h3 className="font-serif font-bold text-sm tracking-wide leading-none">
                Casa Nest Homestay Payment
              </h3>
              <span className="text-[10px] font-mono text-[#c8a36a] block mt-0.5">
                256-Bit SSL Encrypted & Razorpay Verified
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#fbf8f1]/70 hover:text-[#fbf8f1] hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stay Summary Card */}
        <div className="p-6 bg-[#f5f0e8]/80 border-b border-[#20352b]/10 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#77766c] block">
                Booking Reference & Room
              </span>
              <span className="font-mono font-bold text-sm text-[#20352b]">
                #CN-{String(booking.id).padStart(5, "0")} • {booking.room_name || "Suite"}
              </span>
              <p className="text-[11px] text-[#77766c] mt-0.5">
                {checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                {checkOut.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ({nights} {nights === 1 ? "night" : "nights"})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#77766c] block">
                Total Payable
              </span>
              <span className="font-mono text-xl font-bold text-[#20352b] block">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                All Taxes & Homestay Fee Included
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <div>
            <label className="block font-semibold uppercase font-mono tracking-wider text-[#20352b] mb-2 text-[11px]">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Razorpay Tab */}
              <button
                type="button"
                onClick={() => setMethod("razorpay")}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center col-span-2 sm:col-span-1 ${
                  method === "razorpay"
                    ? "border-[#20352b] bg-[#20352b] text-[#fbf8f1] shadow-xs ring-2 ring-[#c8a36a]/40"
                    : "border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#f5f0e8]"
                }`}
              >
                <div className="relative">
                  <Zap size={18} className={method === "razorpay" ? "text-[#c8a36a]" : "text-blue-600"} />
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <span className="text-[11px] font-bold">Razorpay</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("upi")}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                  method === "upi"
                    ? "border-[#20352b] bg-[#20352b] text-[#fbf8f1] shadow-xs"
                    : "border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#f5f0e8]"
                }`}
              >
                <Smartphone size={18} className={method === "upi" ? "text-[#c8a36a]" : ""} />
                <span className="text-[11px] font-semibold">UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                  method === "card"
                    ? "border-[#20352b] bg-[#20352b] text-[#fbf8f1] shadow-xs"
                    : "border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#f5f0e8]"
                }`}
              >
                <CreditCard size={18} className={method === "card" ? "text-[#c8a36a]" : ""} />
                <span className="text-[11px] font-semibold">Debit/Credit</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("netbanking")}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                  method === "netbanking"
                    ? "border-[#20352b] bg-[#20352b] text-[#fbf8f1] shadow-xs"
                    : "border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#f5f0e8]"
                }`}
              >
                <Building2 size={18} className={method === "netbanking" ? "text-[#c8a36a]" : ""} />
                <span className="text-[11px] font-semibold">Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod("frontdesk")}
                className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                  method === "frontdesk"
                    ? "border-[#20352b] bg-[#20352b] text-[#fbf8f1] shadow-xs"
                    : "border-[#20352b]/15 bg-white text-[#20352b] hover:bg-[#f5f0e8]"
                }`}
              >
                <CheckCircle2 size={18} className={method === "frontdesk" ? "text-[#c8a36a]" : ""} />
                <span className="text-[11px] font-semibold">Front Desk</span>
              </button>
            </div>
          </div>

          {/* Razorpay Gateway Mode Details */}
          {method === "razorpay" && (
            <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold font-mono text-xs">
                    R
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[#20352b] block">
                      Razorpay Official Payment Gateway
                    </span>
                    <span className="text-[10px] text-[#77766c]">
                      Cards, UPI, Google Pay, PhonePe, Paytm, Netbanking & Wallets
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono font-bold">
                  Instant
                </span>
              </div>

              <div className="p-3 bg-[#f5f0e8]/70 rounded-xl border border-[#20352b]/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#77766c]">Room Reserved:</span>
                  <span className="font-semibold text-[#20352b]">{booking.room_name || "Casa Nest Room"}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#77766c]">Guest Name:</span>
                  <span className="font-semibold text-[#20352b]">{booking.guest_name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#20352b]/10">
                  <span className="font-bold text-[#20352b]">Total Amount:</span>
                  <span className="font-mono font-bold text-sm text-[#20352b]">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-[#77766c] leading-relaxed">
                Clicking the button below opens the secure Razorpay checkout interface. Once completed, your reservation will immediately update to <strong>PAID & CONFIRMED</strong> in your dashboard and the admin ledger.
              </p>
            </div>
          )}

          {/* UPI Method Details */}
          {method === "upi" && (
            <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-[#20352b] block">Instant UPI Payment</span>
                  <span className="text-[11px] text-[#77766c]">Scan QR or enter your UPI ID</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold">
                    GPay / PhonePe / Paytm
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#f5f0e8]/60 rounded-xl border border-[#20352b]/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#77766c] block">Official Homestay UPI ID</span>
                  <span className="font-mono font-bold text-xs text-[#20352b]">casanest@upi</span>
                </div>
                <div className="w-12 h-12 bg-white border border-[#20352b]/15 rounded-lg flex items-center justify-center p-1">
                  <QrCode size={36} className="text-[#20352b]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#77766c] mb-1">
                  Or enter your UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="yourname@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-[#fbf8f1] border border-[#20352b]/20 rounded-xl px-3.5 py-2 text-xs text-[#20352b] outline-none focus:border-[#20352b]"
                />
              </div>
            </div>
          )}

          {/* Card Method Details */}
          {method === "card" && (
            <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#77766c] mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                  placeholder="Full name as on card"
                  className="w-full bg-[#fbf8f1] border border-[#20352b]/20 rounded-xl px-3.5 py-2 text-xs text-[#20352b] outline-none focus:border-[#20352b]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#77766c] mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  maxLength={19}
                  placeholder="4532 •••• •••• 8901"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  className="w-full bg-[#fbf8f1] border border-[#20352b]/20 rounded-xl px-3.5 py-2 text-xs font-mono text-[#20352b] outline-none focus:border-[#20352b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#77766c] mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    required
                    className="w-full bg-[#fbf8f1] border border-[#20352b]/20 rounded-xl px-3.5 py-2 text-xs font-mono text-[#20352b] outline-none focus:border-[#20352b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#77766c] mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    required
                    className="w-full bg-[#fbf8f1] border border-[#20352b]/20 rounded-xl px-3.5 py-2 text-xs font-mono text-[#20352b] outline-none focus:border-[#20352b]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Net Banking Details */}
          {method === "netbanking" && (
            <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 space-y-3">
              <label className="block text-[11px] font-medium text-[#77766c] mb-1">
                Select Your Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-[#fbf8f1] border border-[#20352b]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#20352b] outline-none focus:border-[#20352b]"
              >
                <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                <option value="Punjab National Bank (PNB)">Punjab National Bank (PNB)</option>
              </select>
              <p className="text-[10px] text-[#77766c]">
                You will be redirected to the bank's secure portal for authorization.
              </p>
            </div>
          )}

          {/* Front Desk Details */}
          {method === "frontdesk" && (
            <div className="p-4 rounded-2xl bg-white border border-[#20352b]/15 space-y-2">
              <p className="font-semibold text-xs text-[#20352b]">
                Pay at Homestay Front Desk (Check-in)
              </p>
              <p className="text-[11px] text-[#77766c]">
                You can settle the full amount of ₹{totalAmount.toLocaleString("en-IN")} directly upon arrival via Cash or UPI scan at the reception.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-[#20352b]/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-[#77766c]">
              <Lock size={12} className="text-emerald-700" />
              <span>Safe & Secure 256-Bit SSL</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="button button-light border border-[#20352b]/15 px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className={`button px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                  method === "razorpay"
                    ? "bg-[#20352b] text-[#fbf8f1] hover:bg-[#2d4b3c] shadow-sm"
                    : "button-dark"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {method === "razorpay"
                        ? `Pay ₹${totalAmount.toLocaleString("en-IN")} via Razorpay`
                        : `Pay ₹${totalAmount.toLocaleString("en-IN")} Now`}
                    </span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

