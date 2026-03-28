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
      console.log(`[Sync] Fetching details for placeId: ${placeId}`);
      const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${API_KEY}`);
      const data = await res.json();
      console.log(`[Sync] Google API Response Status: ${data.status}`);
      
      if (data.status !== "OK") {
        console.error(`[Sync] Error from Google API for ${placeId}: ${data.error_message || data.status}`);
        results.push({ placeId, synced: 0, error: data.status });
        continue;
      }

      const { result: r } = data;
      if (!r?.reviews) { 
        console.warn(`[Sync] No reviews found for ${placeId}`);
        results.push({ placeId, synced: 0, reason: "no_reviews" }); 
        continue; 
      }
      
      console.log(`[Sync] Found ${r.reviews.length} reviews for ${r.name}`);
      const rows = r.reviews.map((rv: any) => ({ 
        place_id: placeId, 
        author_name: rv.author_name, 
        author_photo_url: rv.profile_photo_url, 
        rating: rv.rating, 
        text: rv.text || "", 
        language: rv.language || "en", 
        relative_time: rv.relative_time_description, 
        review_time: rv.time ? new Date(rv.time * 1000).toISOString() : new Date().toISOString(),
        is_featured: rv.rating >= 4, 
        is_visible: true 
      }));
      
      const { error: upsertReviewsError } = await supabase.from("google_reviews").upsert(rows, { onConflict: "place_id,author_name,review_time" });
      if (upsertReviewsError) console.error(`[Sync] DB Upsert Error (reviews):`, upsertReviewsError);

      const { error: upsertError } = await supabase.from("google_review_summary").upsert({ 
        place_id: placeId, 
        place_name: r.name, 
        total_reviews: r.user_ratings_total, 
        average_rating: r.rating, 
        last_synced_at: new Date().toISOString() 
      }, { onConflict: "place_id" });
      if (upsertError) console.error(`[Sync] DB Upsert Error (summary):`, upsertError);

      results.push({ placeId, synced: rows.length, name: r.name, rating: r.rating });
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { "Content-Type": "application/json" } });
  } catch (e) { 
    console.error(`[Sync] Global Error:`, e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 }); 
  }
});
