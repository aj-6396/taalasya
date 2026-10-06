import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_MARSHALS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cleanPin = String(body.pin || "").trim();

    if (!cleanPin) {
      return NextResponse.json(
        { success: false, message: "PIN is required." },
        { status: 400 }
      );
    }

    const adminPin = process.env.ADMIN_SCAN_PIN || process.env.NEXT_PUBLIC_ADMIN_SCAN_PIN || "6028";

    // 1. Check Lead Supervisor Admin PIN
    if (cleanPin === adminPin) {
      return NextResponse.json({
        success: true,
        marshal: {
          id: "admin",
          name: "Lead Supervisor",
          gate: "All Gates (Supervisor)",
        },
      });
    }

    // 2. Check Supabase gate_marshals table
    try {
      const supabase = getAdminSupabase();
      const { data: dbMarshal } = await supabase
        .from("gate_marshals")
        .select("id, name, gate")
        .eq("pin", cleanPin)
        .maybeSingle();

      if (dbMarshal) {
        return NextResponse.json({
          success: true,
          marshal: {
            id: dbMarshal.id,
            name: dbMarshal.name,
            gate: dbMarshal.gate || "Gate A",
          },
        });
      }
    } catch {
      // Database table may not be created yet, fallback to DEFAULT_MARSHALS
    }

    // 3. Fallback to DEFAULT_MARSHALS (server-side check)
    const matched = DEFAULT_MARSHALS.find((m) => m.pin === cleanPin);
    if (matched) {
      return NextResponse.json({
        success: true,
        marshal: {
          id: matched.id,
          name: matched.name,
          gate: matched.gate,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid PIN. Access denied." },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Authentication error" },
      { status: 500 }
    );
  }
}
