import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../src/config';

// Dane do połączenia są teraz importowane z pliku config.ts
// Upewnij się, że plik config.ts istnieje i zawiera poprawne klucze.
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes("TWOJ_SUPABASE_URL") || !supabaseAnonKey || supabaseAnonKey.includes("TWOJ_KLUCZ_ANON_Z_SUPABASE")) {
    const errorMsg = "Błąd konfiguracji Supabase! Sprawdź, czy plik `config.ts` został utworzony i poprawnie wypełniony Twoimi kluczami.";
    console.error(errorMsg);
    alert(errorMsg); // Alert for user visibility
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);