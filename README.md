# De Fulde Fem — fælles webunivers

Designfase for ølklubben **De Fulde Fems** webunivers. Ingen app-kode endnu — kun mockups.

**Live:** https://suverenpolering.github.io/defuldefem/

## Status: trin 1 — vælg stilretning

Tre forside-varianter ligger live. Klubben vælger én retning, hvorefter alle sider bygges i den stil.

| Variant | Stil |
|---------|------|
| [A — Kancelliet](variant-a.html) | Ministerium-parodi: dokumentpapir, segl, paragraffer, stempler |
| [B — Bodegaen](variant-b.html) | Værtshus: neonskilt, kridttavle, mørkt træ |
| [C — Etiketten](variant-c.html) | Klassisk dansk øletiket: fløde, mørkegrøn, guld, ornamenter |

## Låste beslutninger (fra afklaringsrunden)

**Medlemmer og titler**

| Navn | Titel |
|------|-------|
| Henning Trab | Turistminister |
| Jakob Jakobsen | Bødekasseminister (produktejer) |
| Kim Hanen | Finansminister |
| Anders Trab | Foreningssekretær |
| Steffen Due Lund | Joy — ingen forpligtelser |

**Moduler i universet**

- **Bødekassen** — bøder, saldo pr. medlem, redigerbart bødekatalog med faste takster. Kun Bødekasseministeren registrerer bøder (senere: kan tildele/fratage andre retten). Fælles ønskeliste: hvad kassen kan bruges til.
- **Forbudte ord** — regel: kun ord optaget i Den Danske Ordbog / Retskrivningsordbogen / Dansk Sprognævns ordbøger er tilladt. Ingen egennavne på udenlandsk (»McDonald's« er forbudt, »Den Gyldne Måge« er tilladt). Liste over kendelser: Dømt / Frikendt.
- **Øl-protokollen** — mapper pr. mødedato. »+« starter et møde med sted, deltagere og tema. Pr. øl registreres: bryggeri, navn, type, %, rating pr. medlem (1–10 uden decimal) og gennemsnit. Øverst: top 3 på tværs af alle møder (øl, hvem havde den med, dato).
- **Kalenderen** — simpel liste (intet månedsgitter): foreslåede datoer der kan bekræftes, plus tilmelding med svar i klubbens tone (»Har hundesnor på den aften«, »Må ikke for konen«). Arkiv: kun dato/titel.
- **Login (»dørmanden«)** — siden er offentlig, men med login som dørmand. Mock i denne fase, rigtig adgang senere via Supabase.

**Rammer**

- Dansk UI i klubbens tone — skævt, glimt i øjet, parodi-ministerium. UI-tekster overholder selv forbudte ord-reglen så vidt muligt.
- Mobil-først design.
- Teknik (senere faser): vanilla HTML/CSS/JS, ingen frameworks, intet build-step. Hosting på GitHub Pages. Delte data via Supabase med JS fra CDN.
- Bødekatalog eftersendes af Bødekasseministeren — alle beløb i mockups er eksempler.
- Repoet er den fælles sandhed: alt arbejde committes og pushes live med det samme.
