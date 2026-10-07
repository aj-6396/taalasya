/**
 * Helper to identify simulated/test mode tickets so they are excluded
 * from official database views, live gate counts, and exported Excel sheets.
 */
export function isTestTicket(t: {
  paymentId?: string | null;
  payment_id?: string | null;
  orderId?: string | null;
  order_id?: string | null;
  ticketId?: string | null;
  ticket_id?: string | null;
  ticketid?: string | null;
  status?: string | null;
  name?: string | null;
}): boolean {
  if (!t) return false;

  const paymentId = String(t.paymentId || t.payment_id || "").toLowerCase().trim();
  const orderId = String(t.orderId || t.order_id || "").toLowerCase().trim();
  const ticketId = String(t.ticketId || t.ticket_id || t.ticketid || "").toUpperCase().trim();
  const status = String(t.status || "").toLowerCase().trim();
  const name = String(t.name || "").toLowerCase().trim();

  // Test / demo payment IDs
  if (
    paymentId.startsWith("pay_test") ||
    paymentId.startsWith("pay_demo") ||
    paymentId.startsWith("pay_sim") ||
    paymentId === "pay_verified" ||
    paymentId.includes("test_") ||
    paymentId.includes("simulated") ||
    paymentId.includes("demo")
  ) {
    return true;
  }

  // Test / demo order IDs
  if (
    orderId.startsWith("order_test") ||
    orderId.startsWith("order_demo") ||
    orderId.startsWith("order_sim") ||
    orderId.includes("test_") ||
    orderId.includes("simulated") ||
    orderId.includes("demo")
  ) {
    return true;
  }

  // Test ticket ID prefixes
  if (
    ticketId.startsWith("TEST-") ||
    ticketId.startsWith("TEST_") ||
    ticketId.startsWith("DEMO-") ||
    ticketId.startsWith("SIM-")
  ) {
    return true;
  }

  // Test status or test buyer names with demo credentials
  if (status === "test" || status === "demo" || status === "simulated") {
    return true;
  }

  if (name.includes("test pass") || name === "test user" || name === "demo user") {
    return true;
  }

  return false;
}
