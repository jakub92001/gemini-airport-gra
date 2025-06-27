// Supabase Edge Functions run in a Deno environment.
// We declare the Deno global here to make the code pass type-checking in
// a non-Deno environment (e.g. a standard Node.js/Vite setup).
declare global {
  namespace Deno {
    const env: {
      get(key: string): string | undefined;
    };
  }
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { runGameTick } from "../_shared/game-logic.ts";
import { SaveData } from "../../../types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function logic
async function handleRequest(supabase: SupabaseClient) {
    // 1. Fetch all game saves
    const { data: saves, error } = await supabase
        .from('game_saves')
        .select('user_id, save_data');

    if (error) {
        console.error("Error fetching game saves:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    if (!saves || saves.length === 0) {
        return new Response(JSON.stringify({ message: "No active games to update." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // 2. Process each save
    const now = new Date();
    const updatePromises = saves.map(async (save) => {
        try {
            const updatedSaveData = await runGameTick(save.save_data as SaveData, now);
            return supabase
                .from('game_saves')
                .update({ save_data: updatedSaveData, updated_at: now.toISOString() })
                .eq('user_id', save.user_id);
        } catch (e) {
            console.error(`Error processing tick for user ${save.user_id}:`, e);
            // Don't fail the whole batch, just log the error for the specific user
            return Promise.resolve({ error: e });
        }
    });

    const results = await Promise.all(updatePromises);
    const failedUpdates = results.filter(r => r.error);

    if (failedUpdates.length > 0) {
        console.error(`${failedUpdates.length} updates failed.`);
    }

    return new Response(JSON.stringify({ 
        message: `Processed ${saves.length} games. ${failedUpdates.length} failed.` 
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
}


serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
      // For a scheduled function that needs to operate on all users' data (like this game tick),
      // we must use the service_role key to create an admin client that can bypass RLS.
      const supabase = createClient(
          // Supabase API URL - env var exported by default.
          Deno.env.get('SUPABASE_URL') ?? '',
          // Supabase Service Role Key - env var exported by default for functions.
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      return await handleRequest(supabase);
  } catch (error) {
      console.error(error)
      return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
      })
  }
})