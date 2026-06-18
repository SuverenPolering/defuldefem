/* De Fulde Fem — eksempeldata.
 *
 * window.seed() sår eksempeldata i localStorage KUN hvis "dff:*" er tomt
 * (idempotent — sikkert at kalde ved hvert load). Kaldes selv nederst,
 * efter db.js er klar. Data hentet fra variant-b4.html (LÅST design).
 *
 * Ratings er heltal 1–10 pr. medlem (jf. README). De viste top-scorer
 * (9,4 / 8,8 / 8,6) er GENNEMSNIT — vi sår individuelle stemmer hvis
 * gennemsnit rammer dem, så db'ens beregning matcher B4 ordret.
 *
 * Klassisk script: ingen import/export.
 */
(function () {
  'use strict';

  function _erTomt() {
    // Vi betragter universet som usået hvis 'members' mangler.
    var m = window.DB._read('members', null);
    return !m || !m.length;
  }

  /* ---------- BØDEKATALOG (officielt, kategoriseret) ----------
   * Bump KATALOG_VERSION når kataloget opdateres officielt — migrer() skriver
   * så det nye katalog ud til alle (også allerede-seedet localStorage). */
  var KATALOG_VERSION = 2;
  var KATALOG = [
    /* 1. Snak, telefon og bordopførsel */
    { id: 'cat_01', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Ikke-danske ord', takst: 2 },
    { id: 'cat_02', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Mobil på bordet', takst: 2 },
    { id: 'cat_03', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Min. 2 siger »den har vi hørt«', takst: 2 },
    { id: 'cat_04', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Starte seriøs politisk diskussion', takst: 2 },
    { id: 'cat_05', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Søge teknologihjælp for at understøtte en påstand', takst: 2 },
    { id: 'cat_06', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Forkert temperatur-brok', takst: 2 },
    { id: 'cat_07', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Dårlig joke der får stilhed', takst: 5 },
    { id: 'cat_08', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Far jokes', takst: 5 },
    { id: 'cat_09', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Erklære sig enig med HT', takst: 4 },
    { id: 'cat_10', kategori: 'Snak, telefon og bordopførsel', forseelse: 'Bøde til HT for at lokke til enighed', takst: 5 },
    /* 2. Øl – spild og uheld */
    { id: 'cat_11', kategori: 'Øl – spild og uheld', forseelse: 'Spilde lidt øl', takst: 2 },
    { id: 'cat_12', kategori: 'Øl – spild og uheld', forseelse: 'Spilde mere end lidt øl', takst: 5 },
    { id: 'cat_13', kategori: 'Øl – spild og uheld', forseelse: 'Vælte øl', takst: 10 },
    { id: 'cat_14', kategori: 'Øl – spild og uheld', forseelse: 'Drikke øl før alle er klar', takst: 5 },
    { id: 'cat_15', kategori: 'Øl – spild og uheld', forseelse: 'Medbringe den samme øl (bøde til begge)', takst: 5 },
    { id: 'cat_16', kategori: 'Øl – spild og uheld', forseelse: 'Hælde øl ud (medmindre flertallet gør det)', takst: 15 },
    /* 3. Øl – forkert eller dårlig øl */
    { id: 'cat_17', kategori: 'Øl – forkert eller dårlig øl', forseelse: 'Ikke overholde øltema (pr. øl)', takst: 5 },
    { id: 'cat_18', kategori: 'Øl – forkert eller dårlig øl', forseelse: 'Mødets dårligst karakterscorende øl', takst: 15 },
    { id: 'cat_19', kategori: 'Øl – forkert eller dårlig øl', forseelse: 'Mødets næst-dårligst karakterscorende øl', takst: 10 },
    { id: 'cat_20', kategori: 'Øl – forkert eller dårlig øl', forseelse: 'Mødets tredje-dårligst karakterscorende øl', takst: 5 },
    /* 4. Glemt udstyr */
    { id: 'cat_21', kategori: 'Glemt udstyr', forseelse: 'Glemme ølbræt', takst: 10 },
    { id: 'cat_22', kategori: 'Glemt udstyr', forseelse: 'Glemme ølglas (pr. glas)', takst: 5 },
    { id: 'cat_23', kategori: 'Glemt udstyr', forseelse: 'Glemme øl (pr. øl)', takst: 5 },
    /* 5. Fremmøde og mødedisciplin */
    { id: 'cat_24', kategori: 'Fremmøde og mødedisciplin', forseelse: 'Komme for sent (+ 2 kr pr. min efter 3 min)', takst: 5 },
    { id: 'cat_25', kategori: 'Fremmøde og mødedisciplin', forseelse: 'Melde sent afbud til aftalt møde', takst: 100 },
    { id: 'cat_26', kategori: 'Fremmøde og mødedisciplin', forseelse: 'Gå glip af øllets dag', takst: 50 },
    { id: 'cat_27', kategori: 'Fremmøde og mødedisciplin', forseelse: 'Kaste op til et møde', takst: 10 },
    /* 6. Ritualer: challenge og sang */
    { id: 'cat_28', kategori: 'Ritualer: challenge og sang', forseelse: 'Ikke bestå sin challenge', takst: 10 },
    { id: 'cat_29', kategori: 'Ritualer: challenge og sang', forseelse: 'Ikke hørt min. én af de tre tenorer (bøde til alle)', takst: 50 },
    /* 7. Tøj */
    { id: 'cat_30', kategori: 'Tøj', forseelse: 'Iført kjole / slips / hawaiiskjorte / sejlersko / tegnebog / hårbånd / turtleneck', takst: 5 },
    { id: 'cat_31', kategori: 'Tøj', forseelse: 'Iført dobbelt denim', takst: 10 },
    { id: 'cat_32', kategori: 'Tøj', forseelse: 'Ikke iført bælte / sokker', takst: 5 },
    /* 8. Skade, gæster og status */
    { id: 'cat_33', kategori: 'Skade, gæster og status', forseelse: 'Ødelægge glas', takst: 20 },
    { id: 'cat_34', kategori: 'Skade, gæster og status', forseelse: 'Entré for gæster', takst: 20 },
    { id: 'cat_35', kategori: 'Skade, gæster og status', forseelse: 'Mødets højeste skyldner', takst: 2 },
    { id: 'cat_36', kategori: 'Skade, gæster og status', forseelse: 'Mødets mindste skyldner', takst: 5 }
  ];

  window.seed = function seed() {
    if (_erTomt() === false) return false; // allerede sået — gør intet.

    var W = window.DB._write;

    /* ---------- MEDLEMMER (kanonisk liste) ---------- */
    var members = [
      { id: 'henning', navn: 'Henning Trab',     titel: 'Turistminister',         initial: 'H', rolle: 'turistminister' },
      { id: 'jakob',   navn: 'Jakob Jakobsen',   titel: 'Bødekasseminister',      initial: 'J', rolle: 'boedekasseminister' },
      { id: 'kim',     navn: 'Kim Hanen',        titel: 'Finansminister',         initial: 'K', rolle: 'finansminister' },
      { id: 'anders',  navn: 'Anders Trab',      titel: 'Foreningssekretær',      initial: 'A', rolle: 'foreningssekretaer' },
      { id: 'steffen', navn: 'Steffen Due Lund', titel: 'Joy — nyder bare turen', initial: 'S', rolle: 'joy' }
    ];
    W('members', members);

    /* ---------- BØDER (skyld pr. mand) ----------
     * Hver bøde har 'betalt' (bool). Ubetalte bøder udgør skyld pr. mand.
     * Pengene i kassen ligger separat i 'kasse_saldo' (se nedenfor). */
    var fines = [
      { id: 'fine_seed_1', memberId: 'henning', grund: 'Sagde »nice« under hovedretten',          beloeb: 10,  dato: '2026-03-13', betalt: false },
      { id: 'fine_seed_2', memberId: 'kim',     grund: 'Kom 23 minutter for sent',                 beloeb: 50,  dato: '2026-03-13', betalt: false },
      { id: 'fine_seed_3', memberId: 'steffen', grund: 'Sagde Den Gyldne Måges udenlandske navn',  beloeb: 10,  dato: '2026-03-13', betalt: false }
    ];
    W('fines', fines);

    /* ---------- KASSEN: penge i kassen (eksempeldata) ---------- */
    W('kasse_saldo', 1350);

    /* ---------- BØDEKATALOG (officielt, kategoriseret) ---------- */
    W('catalog', KATALOG);
    W('catalog_version', KATALOG_VERSION);

    /* ---------- ØNSKELISTE ---------- */
    W('wishlist', [
      { id: 'wish_seed_1', tekst: 'En ordentlig ølkøler til havemøblerne',          memberId: 'henning', oprettet: '2026-01-10T12:00:00.000Z' },
      { id: 'wish_seed_2', tekst: 'Ny knappenål til Joys seddel (den hænger i én)', memberId: 'steffen', oprettet: '2026-02-02T12:00:00.000Z' },
      { id: 'wish_seed_3', tekst: 'Fælles tur til et bryggeri — på Fyn, selvfølgelig', memberId: 'kim', oprettet: '2026-03-14T12:00:00.000Z' }
    ]);

    /* ---------- KALENDER: næste møde + arkiv ---------- */
    var moedeNaeste = {
      id: 'meet_seed_naeste',
      type: 'moede',
      dato: '2026-08-15',
      datoer: ['2026-08-15'],
      sted: 'Hos Finansministeren',
      tema: 'Belgien tur/retur — uden at rejse os fra havemøblerne',
      arkiveret: false
    };
    var moedeArkiv = {
      id: 'meet_seed_marts',
      type: 'moede',
      dato: '2026-03-13',
      datoer: ['2026-03-13'],
      sted: 'Hos Turistministeren',
      tema: 'Trappist-aften',
      arkiveret: true
    };
    var moedeArkiv2 = {
      id: 'meet_seed_nov',
      type: 'moede',
      dato: '2025-11-28',
      datoer: ['2025-11-28'],
      sted: 'Hos Finansministeren',
      tema: 'Vinterstærke sager',
      arkiveret: true
    };
    W('meetings', [moedeNaeste, moedeArkiv, moedeArkiv2]);

    /* RSVP til næste møde (jf. B4). svar: 'ja' | 'nej' | 'maaske' */
    W('rsvps', [
      { id: 'rsvp_1', meetingId: 'meet_seed_naeste', memberId: 'henning', svar: 'ja',  tekst: 'Tilsidesætter alt for DFF' },
      { id: 'rsvp_2', meetingId: 'meet_seed_naeste', memberId: 'jakob',   svar: 'ja',  tekst: 'Kommer selvfølgelig' },
      { id: 'rsvp_3', meetingId: 'meet_seed_naeste', memberId: 'kim',     svar: 'ja',  tekst: 'Har allerede pakket køletasken' },
      { id: 'rsvp_4', meetingId: 'meet_seed_naeste', memberId: 'anders',  svar: 'nej', tekst: 'Må ikke for konen' },
      { id: 'rsvp_5', meetingId: 'meet_seed_naeste', memberId: 'steffen', svar: 'nej', tekst: 'Har hundesnor på den aften' }
    ]);

    /* ---------- ØL-PROTOKOLLEN: sessioner, øl, ratings ----------
     * Top-3 fra B4 (gennemsnit): Westvleteren 12 = 9,4 · Dangerously Close
     * to Stupid = 8,8 · Beer Geek Breakfast = 8,6. Vi sår 5 heltalsstemmer
     * (én pr. medlem) hvis snit = den viste score. */
    W('sessions', [
      { id: 'sess_marts', dato: '2026-03-13', sted: 'Hos Turistministeren', deltagere: ['henning', 'jakob', 'kim', 'anders', 'steffen'], tema: 'Trappist-aften' },
      { id: 'sess_nov',   dato: '2025-11-28', sted: 'Hos Finansministeren',     deltagere: ['henning', 'jakob', 'kim', 'steffen'],            tema: 'Vinterstærke sager' }
    ]);

    W('beers', [
      // Westvleteren 12 — Steffen havde den med, 13. marts 2026
      { id: 'beer_west', sessionId: 'sess_marts', bryggeri: 'Westvleteren', navn: 'Westvleteren 12',
        type: 'Trappist', pct: 10.2, havdeMedId: 'steffen' },
      // Dangerously Close to Stupid — Kim havde den med, 28. november 2025
      { id: 'beer_dcts', sessionId: 'sess_nov', bryggeri: 'To Øl', navn: 'Dangerously Close to Stupid',
        type: 'Imperial IPA', pct: 9.3, havdeMedId: 'kim' },
      // Beer Geek Breakfast — Henning havde den med, 13. marts 2026
      { id: 'beer_bgb', sessionId: 'sess_marts', bryggeri: 'Mikkeller', navn: 'Beer Geek Breakfast',
        type: 'Oatmeal Stout', pct: 7.5, havdeMedId: 'henning' }
    ]);

    // Ratings (heltal). Snit pr. øl matcher de viste top-scorer.
    // Westvleteren: 9+9+10+9+10 = 47 / 5 = 9,4
    // DCTS:         9+8+9+9+9   = 44 / 5 = 8,8
    // BGB:          8+9+9+8+9   = 43 / 5 = 8,6
    W('ratings', [
      // Westvleteren 12 → 9,4
      { id: 'rate_w1', beerId: 'beer_west', memberId: 'henning', score: 9 },
      { id: 'rate_w2', beerId: 'beer_west', memberId: 'jakob',   score: 9 },
      { id: 'rate_w3', beerId: 'beer_west', memberId: 'kim',     score: 10 },
      { id: 'rate_w4', beerId: 'beer_west', memberId: 'anders',  score: 9 },
      { id: 'rate_w5', beerId: 'beer_west', memberId: 'steffen', score: 10 },
      // Dangerously Close to Stupid → 8,8
      { id: 'rate_d1', beerId: 'beer_dcts', memberId: 'henning', score: 9 },
      { id: 'rate_d2', beerId: 'beer_dcts', memberId: 'jakob',   score: 8 },
      { id: 'rate_d3', beerId: 'beer_dcts', memberId: 'kim',     score: 9 },
      { id: 'rate_d4', beerId: 'beer_dcts', memberId: 'anders',  score: 9 },
      { id: 'rate_d5', beerId: 'beer_dcts', memberId: 'steffen', score: 9 },
      // Beer Geek Breakfast → 8,6
      { id: 'rate_b1', beerId: 'beer_bgb', memberId: 'henning', score: 8 },
      { id: 'rate_b2', beerId: 'beer_bgb', memberId: 'jakob',   score: 9 },
      { id: 'rate_b3', beerId: 'beer_bgb', memberId: 'kim',     score: 9 },
      { id: 'rate_b4', beerId: 'beer_bgb', memberId: 'anders',  score: 8 },
      { id: 'rate_b5', beerId: 'beer_bgb', memberId: 'steffen', score: 9 }
    ]);

    /* ---------- VEDTÆGTER (læsbare for alle; redigeres pr. rolle) ---------- */
    W('vedtaegter', {
      forening: '§1 De Fulde Fem mødes, drikker specialøl og holder fast i fynsk stædighed.\n' +
                '§2 Nye medlemmer optages kun enstemmigt — og over mindst én øl.\n' +
                '§3 Møder går på skift. Datoer vedtages og flyttes ikke.\n' +
                '§4 Joy har ingen forpligtelser, men nyder turen.',
      boedekasse: '§1 Bøder fastsættes af Bødekasseministeren efter kataloget.\n' +
                  '§2 Engelske ord koster 10 kr. pr. stk. Ingen undtagelser.\n' +
                  '§3 Bøder betales til Finansministeren, som fører kassen.\n' +
                  '§4 Kassen bruges på øl. Naturligvis.'
    });

    return true;
  };

  /* ---------- MIGRERING ----------
   * seed() kører kun ved tomt univers. Allerede-seedet localStorage skal
   * stadig have afstemt rolle+titel mod den kanoniske liste (f.eks. Anders'
   * nye rolle 'foreningssekretaer'). migrer() kører ved HVERT load og
   * skriver KUN tilbage hvis noget faktisk ændredes. */
  var KANONISK = {
    henning: { titel: 'Turistminister',         rolle: 'turistminister' },
    jakob:   { titel: 'Bødekasseminister',      rolle: 'boedekasseminister' },
    kim:     { titel: 'Finansminister',         rolle: 'finansminister' },
    anders:  { titel: 'Foreningssekretær',      rolle: 'foreningssekretaer' },
    steffen: { titel: 'Joy — nyder bare turen', rolle: 'joy' }
  };

  function migrer() {
    var members = window.DB._read('members', []);
    if (!members || !members.length) return false; // intet at migrere.

    var aendret = false;
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var kan = KANONISK[m.id];
      if (!kan) continue; // ukendt id — rør ikke.
      if (m.rolle !== kan.rolle) { m.rolle = kan.rolle; aendret = true; }
      if (m.titel !== kan.titel) { m.titel = kan.titel; aendret = true; }
    }

    if (aendret) window.DB._write('members', members);

    // Opdatér bødekataloget hvis en ny officiel version er udgivet
    // (skriver det nye katalog ud til allerede-seedet localStorage).
    if (window.DB._read('catalog_version', 0) !== KATALOG_VERSION) {
      window.DB._write('catalog', KATALOG);
      window.DB._write('catalog_version', KATALOG_VERSION);
      aendret = true;
    }

    return aendret;
  }

  // Sår ved load (efter db.js er kørt). Idempotent.
  window.seed();
  // Afstem allerede-seedet data mod kanonisk liste. Idempotent.
  migrer();
})();
