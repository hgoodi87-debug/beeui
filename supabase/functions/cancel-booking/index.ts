import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async (req) => {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return new Response(JSON.stringify({ error: 'bookingId required' }), { status: 400 });
    await supabase.from('booking_details').update({ settlement_status: 'cancelled' }).eq('id', bookingId);
    await supabase.from('operation_status_logs').insert({ reservation_id: bookingId, from_status: 'active', to_status: 'cancelled', changed_by: 'customer', reason: 'Customer cancellation' });
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) { return new Response(JSON.stringify({ error: String(e) }), { status: 500 }); }
});
