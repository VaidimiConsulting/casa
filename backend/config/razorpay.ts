import "dotenv/config";
import Razorpay from "razorpay";

// Razorpay Instance
// Credentials can be provided in .env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET)
// If not yet provided, placeholders are used so application will not crash.
const key_id = process.env.RAZORPAY_KEY_ID || "";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

export const isRazorpayConfigured = (): boolean => {
  return Boolean(
    key_id &&
    key_secret &&
    !key_id.includes("your_razorpay_key") &&
    !key_secret.includes("your_razorpay_secret")
  );
};

export const razorpayInstance = isRazorpayConfigured()
  ? new Razorpay({
      key_id,
      key_secret,
    })
  : null;

export const getRazorpayKeyId = (): string => {
  return key_id || "rzp_test_placeholder_key";
};

export const getRazorpayKeySecret = (): string => {
  return key_secret;
};
