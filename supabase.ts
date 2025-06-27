import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;

try {
    // Safely access environment variables, which might not be defined if not using a build tool like Vite.
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Konfiguracja Supabase jest niekompletna. Upewnij się, że zmienne środowiskowe VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY są ustawione.");
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (e: any) {
    supabaseError = e.message;
    console.error("Błąd inicjalizacji Supabase:", supabaseError);
}

export { supabase, supabaseError };
