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

  /* ---------- KASSEBOG (eksempel-log over manuelle reguleringer) ----------
   * Log over MANUELLE ind/ud af kassen (Regulér kassen). Summen af beloeb
   * matcher kasse_saldo = 1350. Markér-betalt logges IKKE. */
  var KASSE_LOG = [
    { id: 'kl_seed_1', dato: '2025-09-01T12:00:00.000Z', beloeb: 1500, note: 'Opstartsbeholdning' },
    { id: 'kl_seed_2', dato: '2026-01-15T12:00:00.000Z', beloeb: 245,  note: 'Indbetalinger fra bødekassen' },
    { id: 'kl_seed_3', dato: '2026-02-10T12:00:00.000Z', beloeb: -395, note: 'Ølbræt og glas til Fanø-turen' }
  ];

  /* ---------- FORENINGENS VEDTÆGTER (officielt dokument) ----------
   * Lagres som redigerbar tekst med let opmærkning, så Foreningssekretæren kan
   * rette den i en textarea og datalaget stadig kan swappes til Supabase:
   *   '# N. Titel' = kapitel-overskrift
   *   '§ N'        = paragraf (følgende tekstlinjer = Stk. 1)
   *   'Stk. N'     = stykke
   *   'a) …'       = litra
   * Bump VEDTAEGT_VERSION når dokumentet opdateres officielt — migrer() skriver
   * den nye tekst ud til allerede-seedet localStorage.
   * NB: § 4 gengives med titler i stedet for navne (privatliv; offentligt site). */
  var VEDTAEGT_VERSION = 2;
  var FORENING_VEDTAEGT = [
    '# 1. Navn og hjemsted',
    '',
    '§ 1',
    'Foreningens navn er De fulde Fem (i det følgende benævnt Foreningen).',
    'Stk. 2',
    'Foreningens navn forkortes DFF.',
    '',
    '§ 2',
    'Foreningen har hjemsted på Hunderupvej 58b 1., th.',
    '',
    '# 2. Foreningens formål',
    '',
    '§ 3',
    'Foreningens har til formål at etablere et forum, hvor foreningens medlemmer kan mødes, diskutere, smage og bedømme specialøl fra forskellige bryghuse. Foreningen kan derudover danne ramme om diverse arrangementer i form af bl.a. musikquiz, udfordringer, feltture mv.',
    '',
    '# 3. Foreningens medlemmer',
    '',
    '§ 4',
    'Foreningens stiftende medlemmer er: Bødekasseministeren, Joy, Finansministeren, Turistministeren og Foreningssekretæren.',
    '',
    '§ 5',
    'De i § 4 nævnte medlemmer har fast sæde på Foreningens møder.',
    'Stk. 2',
    'Hvert af de stiftende medlemmer har hver 1 stemme på foreningens møder.',
    '',
    '§ 6',
    'Der kan ikke optages nye faste medlemmer i Foreningen. Foreningens medlemmer kan dog bestemme, at der kan medvirke inviterede gæster på Foreningens møder.',
    '',
    '# 4. Foreningens møder og beslutninger',
    '',
    '§ 7',
    'Foreningen holder møde på de af de stiftende medlemmer valgte dage.',
    'Stk. 2',
    'Foreningens møder skal afholdes én gang i kvartalet, medmindre et af de stiftende medlemmer kan godtgøre lovligt forfald.',
    'Stk. 3',
    'Lovligt forfald i denne bestemmelses stk. 2 skal forstås som:',
    'a) akut sygdom,',
    'b) arbejdsrelaterede forhindringer, når disse er af maritim karakter,',
    'c) trælse ægtefæller/partnere, eller',
    'd) andre efter de stiftende medlemmers skøn kvalificerede forhold.',
    '',
    '§ 8',
    'Kan et medlem ikke godt, at denne har været i lovligt forfald, træffer de øvrige medlemmer beslutning om konsekvenserne heraf.',
    'Stk. 2',
    'De øvrige medlemmer er forpligtet til at vedtage en proportionel og retfærdig sanktion.',
    '',
    '§ 9',
    'Til brug for mødet udarbejder Foreningens sekretær en dagsorden, som skal indeholde de beslutningsforslag, som Foreningens medlemmer skal tage stilling til på mødet.',
    '',
    '§ 10',
    'Beslutninger på Foreningens møder træffes med simpelt flertal.',
    'Stk. 2',
    'Vedtægtsændringer skal dog vedtages med kvalificeret flertal, således at tre femtedele skal stemme for vedtægtsændringen.',
    '',
    '§ 11',
    'Foreningen er alene beslutningsdygtig, når alle 5 stiftende medlemmer er til stede på mødet.',
    'Stk. 2',
    'Såfremt et medlem er mødt, men er forfalden grundet beruselse eller lignende, vil Foreningen dog stadig være beslutningsdygtig.',
    'Stk. 3',
    'Stk. 2 gælder ikke for vedtægtsændringer.',
    '',
    '# 5. Bøder',
    '',
    '§ 12',
    'Bødeministeren kan træffe bestemmelse om indførelse af bøde og disses størrelse.',
    'Stk. 2',
    'Bødeministerens bøder er dog underlagt de øvrige medlemmers kontrol, således at en bøde som findes uholdbar af de øvrige medlemmer bortfalder, hvis de tilkendegiver utilfredsheden over for Bødeministeren på et af møderne.',
    '',
    '§ 13',
    'Bøderne indbetales til Finansministeren, som sikrer beløbene på behørig vis.',
    'Stk. 2',
    'Finansministeren sørger for, i samarbejde med bødeministeren, at holde regnskab med de bøder, som udstedes og sørger for at bøder betales rettidigt.',
    '',
    '§ 14',
    'Såfremt en bøde ikke betales rettidigt, træffer Finansministeren foranstaltninger til bødekravet inddrives.',
    'Stk. 2',
    'Kan kravet ikke inddrives hos det pågældende medlem fastsætter Finansministeren og Bødeministeren en passende straf.',
    '',
    '§ 15',
    'Bøde for forfald på øllets dag besluttes på øllets dag af de tilstedeværende medlemmer. Straffen kan ikke lyde på under 1 omgang øl til foreningen.',
    '',
    '# 6. Arrangementer i foreningen',
    '',
    '§ 16',
    'Ethvert medlem er berettiget til at foreslå idéer til arrangementer, som foreningen kan afholde og/eller deltage i.',
    '',
    '§ 17',
    'Turistministeren drager omsorg for forslag til arrangementer og sørger for eventuelle forslag forelægges Foreningssekretæren med henblik på optagelse i dagsordenen.',
    '',
    '§ 18',
    'Turistministeren forestår praktiske foranstaltninger forbundet med arrangementerne i det omfang det er hensigtsmæssigt.',
    '',
    '§ 19',
    'Turistministeren kan tage Joy med på råd omkring arrangement, men er ikke forpligtet hertil.'
  ].join('\n');

  window.seed = function seed() {
    // Supabase-tilstand: data ligger i databasen — så ikke localStorage.
    if (window.CONFIG && window.CONFIG.BRUG_SUPABASE) return false;
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
      { id: 'fine_seed_1', memberId: 'henning', grund: 'Sagde »nice« under hovedretten',          enhed: 10, antal: 1, dato: '2026-03-13', betalt: false },
      { id: 'fine_seed_2', memberId: 'kim',     grund: 'Kom 23 minutter for sent',                 enhed: 50, antal: 1, dato: '2026-03-13', betalt: false },
      { id: 'fine_seed_3', memberId: 'steffen', grund: 'Sagde Den Gyldne Måges udenlandske navn',  enhed: 10, antal: 1, dato: '2026-03-13', betalt: false }
    ];
    W('fines', fines);

    /* ---------- KASSEN: penge i kassen (eksempeldata) ---------- */
    W('kasse_saldo', 1350);
    W('kasse_log', KASSE_LOG);

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
      forening: FORENING_VEDTAEGT,
      boedekasse: '§1 Bøder fastsættes af Bødekasseministeren efter kataloget.\n' +
                  '§2 Engelske ord koster 10 kr. pr. stk. Ingen undtagelser.\n' +
                  '§3 Bøder betales til Finansministeren, som fører kassen.\n' +
                  '§4 Kassen bruges på øl. Naturligvis.'
    });
    W('vedtaegter_version', VEDTAEGT_VERSION);

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
    if (window.CONFIG && window.CONFIG.BRUG_SUPABASE) return false; // Supabase: ingen localStorage-migrering.
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

    // Udgiv foreningens officielle vedtægter til allerede-seedet localStorage
    // ved ny version (overskriver KUN 'forening'; bødekassens vedtægter røres ikke).
    if (window.DB._read('vedtaegter_version', 0) !== VEDTAEGT_VERSION) {
      var vt = window.DB._read('vedtaegter', {}) || {};
      vt.forening = FORENING_VEDTAEGT;
      window.DB._write('vedtaegter', vt);
      window.DB._write('vedtaegter_version', VEDTAEGT_VERSION);
      aendret = true;
    }

    // Migrer gamle boeder { grund, beloeb } til ny form { grund, enhed, antal }.
    // Koerer kun for boeder der mangler 'enhed'. Skriver kun ved faktisk aendring.
    var fines = window.DB._read('fines', []);
    if (fines && fines.length) {
      var finesAendret = false;
      for (var j = 0; j < fines.length; j++) {
        var f = fines[j];
        if (f && f.enhed === undefined) {
          var match = /\s×(\d+)\s*$/.exec(f.grund || '');
          var antal = match ? Number(match[1]) : 1;
          var enhed = Math.round((Number(f.beloeb) || 0) / antal);
          f.grund = (f.grund || '').replace(/\s*×\d+\s*$/, '').trim();
          f.enhed = enhed;
          f.antal = antal;
          delete f.beloeb;
          finesAendret = true;
        }
      }
      if (finesAendret) {
        window.DB._write('fines', fines);
        aendret = true;
      }
    }

    // Backfill kassebog: allerede-seedet localStorage mangler 'kasse_log'.
    // Skriv eksempel-loggen ud én gang (kun hvis nøglen aldrig er sat).
    if (window.DB._read('kasse_log', null) === null) {
      window.DB._write('kasse_log', KASSE_LOG);
      aendret = true;
    }

    return aendret;
  }

  // Sår ved load (efter db.js er kørt). Idempotent.
  window.seed();
  // Afstem allerede-seedet data mod kanonisk liste. Idempotent.
  migrer();
})();
