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
      { id: 'henning', navn: 'Henning Trab',     titel: 'Turistminister',         initial: 'H', rolle: 'minister' },
      { id: 'jakob',   navn: 'Jakob Jakobsen',   titel: 'Bødekasseminister',      initial: 'J', rolle: 'boedekasseminister' },
      { id: 'kim',     navn: 'Kim Hanen',        titel: 'Finansminister',         initial: 'K', rolle: 'minister' },
      { id: 'anders',  navn: 'Anders Trab',      titel: 'Foreningssekretær',      initial: 'A', rolle: 'foreningssekretaer' },
      { id: 'steffen', navn: 'Steffen Due Lund', titel: 'Joy — nyder bare turen', initial: 'S', rolle: 'joy' }
    ];
    W('members', members);

    /* ---------- BØDER (saldo ~1.420 kr) ----------
     * 10 (nice/Henning) + 50 (for sent/Kim) + 10 (Måge/Steffen) = 70 fra de
     * synlige poster. B4 viser saldo 1.420 kr (historik). Vi sår de tre
     * synlige + en samlepost "tidligere bøder" så totalen rammer 1.420. */
    var fines = [
      { id: 'fine_seed_1', memberId: 'henning', grund: 'Sagde »nice« under hovedretten',          beloeb: 10,  dato: '2026-03-13' },
      { id: 'fine_seed_2', memberId: 'kim',     grund: 'Kom 23 minutter for sent',                 beloeb: 50,  dato: '2026-03-13' },
      { id: 'fine_seed_3', memberId: 'steffen', grund: 'Sagde Den Gyldne Måges udenlandske navn',  beloeb: 10,  dato: '2026-03-13' },
      { id: 'fine_seed_0', memberId: 'jakob',   grund: 'Tidligere bøder (ført af Foreningssekretæren)', beloeb: 1350, dato: '2025-09-01' }
    ];
    W('fines', fines); // 10+50+10+1350 = 1.420 kr

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
      sted: 'Hos Kim',
      tema: 'Belgien tur/retur — uden at rejse os fra havemøblerne',
      arkiveret: false
    };
    var moedeArkiv = {
      id: 'meet_seed_marts',
      type: 'moede',
      dato: '2026-03-13',
      datoer: ['2026-03-13'],
      sted: 'Hos Henning',
      tema: 'Trappist-aften',
      arkiveret: true
    };
    var moedeArkiv2 = {
      id: 'meet_seed_nov',
      type: 'moede',
      dato: '2025-11-28',
      datoer: ['2025-11-28'],
      sted: 'Hos Kim',
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
      { id: 'sess_marts', dato: '2026-03-13', sted: 'Hos Henning', deltagere: ['henning', 'jakob', 'kim', 'anders', 'steffen'], tema: 'Trappist-aften' },
      { id: 'sess_nov',   dato: '2025-11-28', sted: 'Hos Kim',     deltagere: ['henning', 'jakob', 'kim', 'steffen'],            tema: 'Vinterstærke sager' }
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

    /* ---------- ORDBOGSNÆVNET: domme (jf. B4) ---------- */
    W('words', [
      { id: 'word_weekend', ord: 'weekend',          status: 'frikendt', begrundelse: 'Står i Retskrivningsordbogen. Nævnet beklager.',      oprettet: '2026-03-13T18:00:00.000Z' },
      { id: 'word_nice',    ord: 'nice',             status: 'doemt',    begrundelse: 'Ikke dansk. Aldrig dansk. 10 kr.',                     oprettet: '2026-03-13T18:05:00.000Z' },
      { id: 'word_maage',   ord: 'Den Gyldne Måge',  status: 'frikendt', begrundelse: 'Forbilledlig fordanskning. Til efterlevelse.',         oprettet: '2026-03-13T18:10:00.000Z' },
      { id: 'word_sorry',   ord: 'sorry',            status: 'doemt',    begrundelse: 'Undskyld findes. Brug det.',                           oprettet: '2026-03-13T18:15:00.000Z' }
    ]);

    return true;
  };

  /* ---------- MIGRERING ----------
   * seed() kører kun ved tomt univers. Allerede-seedet localStorage skal
   * stadig have afstemt rolle+titel mod den kanoniske liste (f.eks. Anders'
   * nye rolle 'foreningssekretaer'). migrer() kører ved HVERT load og
   * skriver KUN tilbage hvis noget faktisk ændredes. */
  var KANONISK = {
    henning: { titel: 'Turistminister',         rolle: 'minister' },
    jakob:   { titel: 'Bødekasseminister',      rolle: 'boedekasseminister' },
    kim:     { titel: 'Finansminister',         rolle: 'minister' },
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
