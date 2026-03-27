import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") || "";
Deno.serve(async (req) => {
  try {
    const { placeIds } = await req.json().catch(() => ({ placeIds: [] }));
    const results = [];
    for (const placeId of (placeIds.length ? placeIds : ["ChIJ2UMpYvaZfDURgvuAFcEhLYA"])) {
      if (!API_KEY) { results.push({ placeId, synced: 0 }); continue; }
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${API_KEY}`);
      const { result: r } = await res.json();
      if (!r?.reviews) { results.push({ placeId, synced: 0 }); continue; }
      await supabase.from("google_reviews").delete().eq("place_id", placeId);
      const rows = r.reviews.map((rv: any) => ({ place_id: placeId, author_name: rv.author_name, author_photo_url: rv.profile_photo_url, rating: rv.rating, text: rv.text || "", language: rv.language || "en", relative_time: rv.relative_time_description, is_featured: rv.rating >= 4, is_visible: true }));
      await supabase.from("google_reviews").insert(rows);
      await supabase.from("google_review_summary").upsert({ place_id: placeId, place_name: r.name, total_reviews: r.user_ratings_total, average_rating: r.rating, last_synced_at: new Date().toISOString() }, { onConflict: "place_id" });
      results.push({ placeId, synced: rows.length, name: r.name, rating: r.rating });
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { "Content-Type": "application/json" } });
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500 }); }
});
