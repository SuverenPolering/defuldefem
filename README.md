# De Fulde Fem — fælles webunivers

Webuniverset for den fynske ølklub **De Fulde Fem**. Bygget efter
[blueprintet](defuldefem-sitemap-blueprint.md) i den låste stil **B4 —
»Forsamlingshuset ved Øhavet«**.

**Live:** https://suverenpolering.github.io/defuldefem/

## Sider

| Side | Fil | Hvad |
|------|-----|------|
| Dørmanden | `login.html` | Login (mock): vælg minister + fælles klub-kodeord |
| Forsiden | `index.html` | Hub: næste møde, saldo, øl-top-3, seneste domme, regeringen |
| Bødekassen | `boder.html` | Saldo + skyld pr. mand, bødeprotokol, katalog, ønskeliste |
| Øl-protokollen | `protokol.html` | Æresvæg (top-3), mapper pr. mødedato, registrér øl + ratings |
| Kalenderen | `kalender.html` | Liste over møder/ture, tilmelding, arkiv |
| Ordbogsnævnet | `ordbogsnaevnet.html` | Domme (dømt/frikendt), indstil ord, regelsæt |

## Teknik

Vanilla HTML/CSS/JS — intet build-step, ingen frameworks. Mobil-først (max-bredde 480px).
Hostes på GitHub Pages fra `main`.

```
assets/css/app.css   B4-designsystem (delt af alle sider)
assets/js/config.js  klub-kodeord + Supabase-flag/-nøgler
assets/js/db.js       datalag (async API) — localStorage nu, Supabase senere
assets/js/seed.js     eksempeldata (sås i localStorage hvis tomt)
assets/js/auth.js     mock-login + session + roller
assets/js/app.js       topbar + bund-nav, route-guard, render-helpers
supabase/schema.sql    tabeller + RLS, klar til Supabase-fasen
Gamle tanker/          arkiv: designfasens varianter (A–C, B1–B4)
```

## Login (mock-fasen)

Vælg dit ministernavn og indtast det fælles klub-kodeord (sat i
`assets/js/config.js` → `CONFIG.KLUB_KODEORD`). Sessionen huskes pr. fane.
**Rettigheder:** kun Bødekasseministeren (Jakob) kan registrere bøder og redigere
bødekataloget samt afsige domme; alle indloggede kan svare i kalenderen, registrere
øl og indstille ord.

> Alle beløb og bøder er **eksempeldata** indtil det rigtige bødekatalog leveres.

## Skift til Supabase (delt datalag, senere)

Data ligger nu i `localStorage` pr. enhed. Når klubben vil dele data live:

1. Opret et Supabase-projekt og kør `supabase/schema.sql` i SQL-editoren.
2. I `assets/js/config.js`: sæt `BRUG_SUPABASE: true` og indsæt `SUPABASE_URL` + `SUPABASE_ANON`.
3. Inkludér `@supabase/supabase-js` fra CDN. `db.js` har TODO-grenene klar — signaturerne ændres ikke.

Repoet er klubbens fælles sandhed: alt arbejde committes og lægges live med det samme.
