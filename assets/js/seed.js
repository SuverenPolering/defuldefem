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

    /* ---------- BØDEKATALOG (faste takster, eksempler) ---------- */
    W('catalog', [
      { id: 'cat_seed_1', forseelse: 'Et engelsk ord (pr. stk.)',                  takst: 10 },
      { id: 'cat_seed_2', forseelse: 'For sent (pr. påbegyndt 15 min.)',           takst: 25 },
      { id: 'cat_seed_3', forseelse: 'Glemte selv at stille stolen op',            takst: 20 },
      { id: 'cat_seed_4', forseelse: 'Foreslog at flytte datoen',                  takst: 100 },
      { id: 'cat_seed_5', forseelse: 'Tællede efter Bødekasseministeren',          takst: 50 },
      { id: 'cat_seed_6', forseelse: 'Antydede at noget jysk var bedre',           takst: 75 }
    ]);

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
    return aendret;
  }

  // Sår ved load (efter db.js er kørt). Idempotent.
  window.seed();
  // Afstem allerede-seedet data mod kanonisk liste. Idempotent.
  migrer();
})();
