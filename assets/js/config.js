/* De Fulde Fem — konfiguration.
 *
 * Klassisk script: hænger CONFIG på window. Ingen import/export.
 * Inkluderes ALLERFØRST (før db.js, seed.js, auth.js, app.js).
 *
 * Supabase-tilstand (BRUG_SUPABASE: true):
 *   - Datalaget (db.js) læser/skriver mod Supabase i stedet for localStorage.
 *   - Dørmanden logger ind med ÉT fælles klub-login (SUPABASE_KLUB_EMAIL +
 *     det kodeord medlemmet taster) via Supabase Auth. RLS låser anon ude.
 *   - Kræver <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">
 *     i hver sides <head> FØR db.js.
 *   SUPABASE_ANON er en offentlig nøgle (sikker i klienten); al beskyttelse
 *   ligger i Row Level Security (kun authenticated har adgang).
 * BRUG_SUPABASE: false → alt kører mod localStorage ("dff:*"), offline + file://.
 */
window.CONFIG = {
  // Fælles klub-kodeord i localStorage-tilstand (Dørmanden tjekker mod dette).
  // I Supabase-tilstand bruges Supabase Auth i stedet — se SUPABASE_KLUB_EMAIL.
  KLUB_KODEORD: 'fynbofyrtaarn',

  // Datalag-kontakt. false = localStorage. true = Supabase (delt backend).
  BRUG_SUPABASE: true,

  // Supabase-projekt (anon-nøglen ER offentlig — beskyttelsen ligger i RLS).
  SUPABASE_URL: 'https://aifhykccklvnlryxmjgn.supabase.co',
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmh5a2Nja2x2bmxyeXhtamduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTcwMjksImV4cCI6MjA5NzUzMzAyOX0.RX6zaRCh9b0cxjpgc6ORMWXLaAIOjYaI5hbHsqTxPHo',

  // Fast identitet for det fælles klub-login. Kodeordet (det medlemmerne taster
  // på Dørmanden) kan roteres i Supabase-dashboardet uden kodeændring.
  SUPABASE_KLUB_EMAIL: 'defuldefem@mail.dk',

  // Kanonisk picker-liste til Dørmanden (de fem brikker). Bruges FØR login,
  // hvor RLS ellers blokerer DB-adgang. Stiftende medlemmer er faste (vedtægt
  // § 6), så listen er stabil. Kun til profilvalg — rigtige data hentes efter
  // login fra databasen.
  MEDLEMMER: [
    { id: 'henning', rolle: 'turistminister',     titel: 'Turistminister',         initial: 'H', fornavn: 'Henning' },
    { id: 'jakob',   rolle: 'boedekasseminister', titel: 'Bødekasseminister',      initial: 'J', fornavn: 'Jakob' },
    { id: 'kim',     rolle: 'finansminister',     titel: 'Finansminister',         initial: 'K', fornavn: 'Kim' },
    { id: 'anders',  rolle: 'foreningssekretaer', titel: 'Foreningssekretær',      initial: 'A', fornavn: 'Anders' },
    { id: 'steffen', rolle: 'joy',                titel: 'Joy — nyder bare turen', initial: 'S', fornavn: 'Steffen' },
    { id: 'gaest',   rolle: 'gaest',              titel: 'Gæst',                   initial: 'G', fornavn: 'Gæst' }
  ]
};
