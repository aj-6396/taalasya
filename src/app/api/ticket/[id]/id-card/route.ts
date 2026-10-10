import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { normalizeTicketLookup } from "@/lib/ticketId";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params?.id;
    if (!id) {
      return new NextResponse("Missing ticket ID", { status: 400 });
    }

    const cleanId = decodeURIComponent(id).trim();

    // Demo / test ticket preview support
    if (cleanId.startsWith("demo_") || cleanId.toLowerCase().includes("test")) {
      const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
        <rect width="600" height="380" rx="20" fill="#0f172a"/>
        <rect x="15" y="15" width="570" height="350" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
        <text x="300" y="80" text-anchor="middle" fill="#60a5fa" font-family="sans-serif" font-size="22" font-weight="bold">BANARAS HINDU UNIVERSITY</text>
        <text x="300" y="115" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">Aadhaar Card Verification (Demo Pass)</text>
        <rect x="50" y="150" width="120" height="150" rx="10" fill="#334155" stroke="#64748b"/>
        <circle cx="110" cy="205" r="30" fill="#64748b"/>
        <path d="M 75 280 C 75 245, 145 245, 145 280 Z" fill="#64748b"/>
        <text x="200" y="180" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold">Name: Demo Attendee</text>
        <text x="200" y="215" fill="#cbd5e1" font-family="sans-serif" font-size="14">Roll No: 24BHUDEMO99</text>
        <text x="200" y="245" fill="#cbd5e1" font-family="sans-serif" font-size="14">Faculty: Institute of Science</text>
        <text x="200" y="275" fill="#34d399" font-family="sans-serif" font-size="13" font-weight="bold">Status: Verified BHU Student</text>
        <text x="300" y="340" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="11">Taalasya — JHOOM '26 Gate Verification System</text>
      </svg>`;
      return new Response(demoSvg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
          "Content-Disposition": `inline; filename="demo_id_${cleanId}.svg"`,
        },
      });
    }

    const candidateIds = normalizeTicketLookup(cleanId);
    const supabase = getAdminSupabase();

    // Query ticket across camelCase, snake_case, and lowercase columns
    let ticket: any = null;

    // 1. Try camelCase "ticketId"
    const res1 = await supabase
      .from("tickets")
      .select("*")
      .in("ticketId", candidateIds)
      .maybeSingle();

    if (res1.data) {
      ticket = res1.data;
    } else {
      // 2. Try snake_case "ticket_id"
      const res2 = await supabase
        .from("tickets")
        .select("*")
        .in("ticket_id", candidateIds)
        .maybeSingle();
      if (res2.data) {
        ticket = res2.data;
      } else {
        // 3. Try lowercase "ticketid"
        const res3 = await supabase
          .from("tickets")
          .select("*")
          .in("ticketid", candidateIds)
          .maybeSingle();
        if (res3.data) {
          ticket = res3.data;
        }
      }
    }

    if (!ticket) {
      return new NextResponse("Ticket not found in database", { status: 404 });
    }

    const rawData =
      ticket.idCardUrl ||
      ticket.id_card_url ||
      ticket.idcardurl ||
      null;

    if (!rawData || rawData === "null" || rawData === "undefined" || rawData === "") {
      return new NextResponse("No ID card attached for this ticket", { status: 404 });
    }

    let trimmed = String(rawData).trim();

    // If it's already an HTTP / HTTPS URL, redirect directly
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return NextResponse.redirect(trimmed, 302);
    }

    // 1. If URL-encoded (e.g. data%3A or %2B or %2F), decode safely
    if (trimmed.includes("%") || trimmed.startsWith("data%3A")) {
      try {
        trimmed = decodeURIComponent(trimmed);
      } catch {
        trimmed = trimmed
          .replace(/%2B/gi, "+")
          .replace(/%2F/gi, "/")
          .replace(/%3D/gi, "=")
          .replace(/%20/gi, "+");
      }
    }

    // 2. Parse data URI header vs raw base64
    let mimeType = "image/jpeg";
    let base64Content = trimmed;

    if (trimmed.startsWith("data:")) {
      const commaIdx = trimmed.indexOf(",");
      if (commaIdx !== -1) {
        const header = trimmed.slice(0, commaIdx);
        base64Content = trimmed.slice(commaIdx + 1);
        const match = header.match(/^data:([^;]+);base64/);
        if (match) {
          mimeType = match[1] || "image/jpeg";
        }
      }
    }

    // 3. Clean and sanitize base64:
    // Remove whitespace, fix spaces to +, and strip illegal characters that cause bit-shift image truncation
    let cleanBase64 = base64Content
      .replace(/\s+/g, "+")
      .replace(/[^A-Za-z0-9+/=]/g, "");

    // 4. Ensure correct 4-byte padding so decoder doesn't drop the bottom of the image
    while (cleanBase64.length % 4 !== 0) {
      cleanBase64 += "=";
    }

    const buffer = Buffer.from(cleanBase64, "base64");

    if (!buffer || buffer.length === 0) {
      return new NextResponse("Invalid image content", { status: 400 });
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Disposition": `inline; filename="aadhaar_card_${cleanId}.jpg"`,
      },
    });
  } catch (err: any) {
    console.error("[id-card-route] Error serving ID card:", err);
    return new NextResponse("Error serving image", { status: 500 });
  }
}
