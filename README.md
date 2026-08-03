# De Fulde Fem — fælles webunivers

Webuniverset for den fynske ølklub **De Fulde Fem**. Bygget efter
[blueprintet](defuldefem-sitemap-blueprint.md) i den låste stil **B4 —
»Forsamlingshuset ved Øhavet«**.

**Live:** https://suverenpolering.github.io/defuldefem/

## Sider

| Side | Fil | Hvad |
|------|-----|------|
| Dørmanden | `login.html` | Login (mock): vælg minister + fælles klub-kodeord |
| Velkomsten | `velkommen.html` | Splash efter login: personlig hilsen, går ind på forsiden |
| Forsiden | `index.html` | Hub: næste møde, bødekasse-saldo, æresvæggen (øl-top-3), regeringen |
| Bødekassen | `boder.html` | Saldo + skyld pr. mand, bødeprotokol, kategoriseret bødekatalog, ønskeliste |
| Øl-protokollen | `protokol.html` | Æresvæg (top-3), mapper pr. mødedato, registrér øl + ratings |
| Kalenderen | `kalender.html` | Liste over møder/ture, tilmelding, arkiv |
| Vedtægter | `vedtaegter.html` | Foreningens vedtægter + bødekassens vedtægter |

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
```

## Login (mock-fasen)

Vælg dit ministernavn og indtast det fælles klub-kodeord (sat i
`assets/js/config.js` → `CONFIG.KLUB_KODEORD`). Sessionen huskes pr. fane.

**Regeringen (roller):** Turistminister (Henning), Bødekasseminister (Jakob),
Finansminister (Kim), Foreningssekretær (Anders) og Joy (Steffen). Visningsnavnet
er ministerens titel.

**Rettigheder:** kun Bødekasseministeren (Jakob) kan registrere bøder og redigere
det kategoriserede bødekatalog samt redigere bødekassens vedtægter; Foreningssekretæren
redigerer foreningens vedtægter. Alle indloggede kan svare i kalenderen og registrere
øl med ratings.

> Alle beløb og bøder er **eksempeldata** indtil det rigtige bødekatalog leveres.

## Skift til Supabase (delt datalag, senere)

Data ligger nu i `localStorage` pr. enhed. Når klubben vil dele data live:

1. Opret et Supabase-projekt og kør `supabase/schema.sql` i SQL-editoren.
2. I `assets/js/config.js`: sæt `BRUG_SUPABASE: true` og indsæt `SUPABASE_URL` + `SUPABASE_ANON`.
3. Inkludér `@supabase/supabase-js` fra CDN. `db.js` har TODO-grenene klar — signaturerne ændres ikke.

Repoet er klubbens fælles sandhed: alt arbejde committes og lægges live med det samme.

## Keep-alive (Supabase)

Supabase pauser gratis-projekter efter 7 dages inaktivitet — og kun rigtige
API-/databasekald tæller, ikke sidevisninger af den statiske side. Workflowet
[`supabase-keepalive.yml`](.github/workflows/supabase-keepalive.yml) sender
derfor hver anden dag ét autentificeret GET-kald til tabellen `hjerteslag`
(oprettes med [`supabase/hjerteslag.sql`](supabase/hjerteslag.sql) i Supabase'
SQL Editor). Er svaret ikke HTTP 200, bliver jobbet rødt, og GitHub sender mail.

**Repo-secrets** (GitHub → Settings → Secrets and variables → Actions):

| Secret | Værdi |
|--------|-------|
| `SUPABASE_URL` | projektets URL — samme som `SUPABASE_URL` i `assets/js/config.js` |
| `SUPABASE_ANON_KEY` | anon-nøglen — samme som `SUPABASE_ANON` i `assets/js/config.js` (offentlig i forvejen; ligger som secret, så den kun vedligeholdes ét sted) |

**Manuel test:** Actions-fanen → »Supabase keep-alive« → »Run workflow«.
Grøn = Supabase svarede 200. Rød = læs loggen (statuskode + responstid står der).

> **OBS:** GitHub slår planlagte workflows fra efter 60 dages inaktivitet i
> repoet. Der kommer en mail, og workflowet kan genaktiveres med ét klik på
> Actions-fanen.
