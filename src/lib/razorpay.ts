import Razorpay from "razorpay";

export function getRazorpayClient() {
  const key_id =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "rzp_live_TkCGITMdi4Rh3N";
  const key_secret =
    process.env.RAZORPAY_KEY_SECRET || "24pPC2vfDzo51cOZhW0RUmA0";

  return new Razorpay({
    key_id,
    key_secret,
  });
}
