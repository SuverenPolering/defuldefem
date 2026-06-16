# De Fulde Fem — fælles webunivers

Designfase for ølklubben **De Fulde Fems** webunivers. Ingen app-kode endnu — kun mockups.

**Live:** https://suverenpolering.github.io/defuldefem/

## Status: runde 3 — B1 + B2 kombineret

Nyeste bud: [B4 — Forsamlingshuset ved Øhavet](variant-b4.html) — B1's layout, skørhed og stædighed (træskilt, vimpler, knappenål, rosetter, »100 % fynsk«) i B2's lyse maritime palet (havblå og sand).

### Runde 2 — videre på variant B

Klubben valgte B's typografi som udgangspunkt med tilretninger: lysere, ingen bodega-humor, mere fynsk og mere stædighed. Tre bud:

| Variant | Stil |
|---------|------|
| [B1 — Forsamlingshuset](variant-b1.html) | Varmt papir, træskilt, opslagstavle, vimpler, foreningsliv — **layoutet valgt til B4** |
| [B2 — Øhavet](variant-b2.html) | Lys maritim, havblå og sand, søfartssegl med Fyn-silhuet — **paletten valgt til B4** |
| [B3 — Humlemarken](variant-b3.html) | Strågul almanak, humlegrøn, høstkrans, bondestædighed |

### Arkiv: runde 1

| Variant | Stil |
|---------|------|
| [A — Kancelliet](variant-a.html) | Ministerium-parodi: dokumentpapir, segl, paragraffer, stempler |
| [B — Bodegaen](variant-b.html) | Værtshus: neonskilt, kridttavle, mørkt træ — **valgt som udgangspunkt for runde 2 (typografien)** |
| [C — Etiketten](variant-c.html) | Klassisk dansk øletiket: fløde, mørkegrøn, guld, ornamenter |

### Designbeslutninger fra runde 1 → 2

- B's skrift og typografi beholdes (håndskrift-logotype + kondenseret grotesk)
- Lysere flader — ikke sort/mørkt
- Ingen bodega-/værtshushumor
- Fynsk identitet (à la »FYN · DANMARK« fra variant C) og tydelig tone af fynsk stædighed

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
