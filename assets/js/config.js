/* De Fulde Fem — konfiguration.
 *
 * Klassisk script: hænger CONFIG på window. Ingen import/export.
 * Inkluderes ALLERFØRST (før db.js, seed.js, auth.js, app.js).
 *
 * Sådan skifter du til Supabase senere (uden at røre db.js-signaturer):
 *   1. Opret projekt på supabase.com, kør supabase/schema.sql.
 *   2. Sæt BRUG_SUPABASE: true.
 *   3. Indsæt SUPABASE_URL og SUPABASE_ANON (Project Settings → API).
 *   4. Tilføj <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *      i hver sides <head> (før db.js). db.js' supabase-gren tager over.
 * Indtil da kører alt mod localStorage ("dff:*") og virker offline + via file://.
 */
window.CONFIG = {
  // Fælles klub-kodeord — Dørmanden tjekker mod dette (mockfase).
  KLUB_KODEORD: 'fynbofyrtaarn',

  // Datalag-kontakt. false = localStorage (nu). true = Supabase (senere).
  BRUG_SUPABASE: false,

  // Udfyldes når BRUG_SUPABASE sættes true. Lad stå tomme i mockfasen.
  SUPABASE_URL: '',
  SUPABASE_ANON: ''
};
