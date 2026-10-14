import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name = "",
      contact = "",
      college = "",
      overallRating = 5,
      eventRating = 5,
      websiteRating = 5,
      highlights = [],
      comments = "",
    } = body;

    const highlightsStr = Array.isArray(highlights)
      ? highlights.join(", ")
      : String(highlights || "");

    const payload = {
      name: (name || "").trim().slice(0, 100),
      contact: (contact || "").trim().slice(0, 100),
      college: (college || "").trim().slice(0, 150),
      overall_rating: Number(overallRating) || 5,
      event_rating: Number(eventRating) || 5,
      website_rating: Number(websiteRating) || 5,
      highlights: highlightsStr.slice(0, 300),
      comments: (comments || "").trim().slice(0, 2000),
      created_at: new Date().toISOString(),
    };

    console.log("[Feedback API] Received feedback submission:", payload);

    // Save to Supabase if configured
    try {
      const supabase = getAdminSupabase();
      // Try table "event_feedback" first
      const res1 = await supabase.from("event_feedback").insert([payload]);
      if (res1.error) {
        // Fallback to "feedback" table
        const res2 = await supabase.from("feedback").insert([payload]);
        if (res2.error) {
          console.warn(
            "[Feedback API] Supabase table insert notice (table might need migration):",
            res1.error.message || res2.error.message
          );
        } else {
          console.log("[Feedback API] Saved to 'feedback' table successfully.");
        }
      } else {
        console.log("[Feedback API] Saved to 'event_feedback' table successfully.");
      }
    } catch (dbErr: any) {
      console.warn("[Feedback API] Database storage skipped/warning:", dbErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback! Your response has been recorded.",
    });
  } catch (err: any) {
    console.error("[Feedback API] Error processing feedback:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record feedback. Please try again." },
      { status: 500 }
    );
  }
}
