/* De Fulde Fem — datalag.
 *
 * window.DB.* — ALLE funktioner er async (returnerer Promise), så krop'en
 * trivielt kan skiftes til @supabase/supabase-js senere uden at signaturer
 * ændres. I mockfasen backes alt af localStorage under nøgler "dff:*".
 *
 * Beregninger (saldo, gennemsnit, top-3) sker HER i db'en — ikke i sider.
 *
 * Supabase-gren: hvis CONFIG.BRUG_SUPABASE er true, lader vi en TODO-gren
 * stå (kald til en supabase-klient). localStorage-grenen er komplet og virker.
 *
 * Klassisk script: ingen import/export. Hænger DB på window.
 */
(function () {
  'use strict';

  var PRA = 'dff:'; // nøgle-præfiks i localStorage

  /* ---------- intern helper: læs/skriv JSON pr. nøgle ---------- */

  function _read(tabel, fallback) {
    try {
      var raw = localStorage.getItem(PRA + tabel);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function _write(tabel, vaerdi) {
    localStorage.setItem(PRA + tabel, JSON.stringify(vaerdi));
    return vaerdi;
  }

  // Generér et nogenlunde unikt id (tid + tilfældigt). Stabilt nok til mock.
  function _id(praefiks) {
    return (praefiks || 'id') + '_' +
      Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 7);
  }

  // Indpak en synkron localStorage-operation som et løfte.
  function _async(fn) {
    return new Promise(function (resolve, reject) {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    });
  }

  // Er Supabase-grenen aktiv? (TODO-grenene nedenfor).
  function _supabase() {
    return !!(window.CONFIG && window.CONFIG.BRUG_SUPABASE);
  }

  /* ---------- beregnings-hjælpere (intern) ---------- */

  function _avg(tal) {
    if (!tal || !tal.length) return 0;
    var sum = 0;
    for (var i = 0; i < tal.length; i++) sum += Number(tal[i]) || 0;
    return sum / tal.length;
  }

  /* =========================================================
   * MEDLEMMER
   * ======================================================= */

  function getMembers() {
    if (_supabase()) {
      // TODO(supabase): return _sb().from('members').select('*').order('navn');
    }
    return _async(function () {
      return _read('members', []);
    });
  }

  /* =========================================================
   * BØDER + KATALOG + ØNSKELISTE
   * ======================================================= */

  function getFines() {
    if (_supabase()) {
      // TODO(supabase): from('fines').select('*').order('dato', {ascending:false})
    }
    return _async(function () {
      return _read('fines', []);
    });
  }

  function addFine(b) {
    if (_supabase()) {
      // TODO(supabase): from('fines').insert(...).select().single()
    }
    return _async(function () {
      var fines = _read('fines', []);
      var ny = {
        id: _id('fine'),
        memberId: b.memberId,
        grund: b.grund,
        beloeb: Number(b.beloeb) || 0,
        dato: b.dato || new Date().toISOString().slice(0, 10)
      };
      fines.push(ny);
      _write('fines', fines);
      return ny;
    });
  }

  function removeFine(id) {
    if (_supabase()) {
      // TODO(supabase): from('fines').delete().eq('id', id)
    }
    return _async(function () {
      var fines = _read('fines', []);
      var ud = fines.filter(function (f) { return f.id !== id; });
      _write('fines', ud);
      return true;
    });
  }

  // Samlet saldo i kassen = sum af alle bøder.
  function getBalance() {
    if (_supabase()) {
      // TODO(supabase): hent fines og summér (eller en view/rpc)
    }
    return _async(function () {
      var fines = _read('fines', []);
      var sum = 0;
      for (var i = 0; i < fines.length; i++) sum += Number(fines[i].beloeb) || 0;
      return sum;
    });
  }

  // Saldo pr. medlem: [{memberId, navn, beloeb}], sorteret efter mest skyldige.
  function getBalanceByMember() {
    if (_supabase()) {
      // TODO(supabase): group by member_id (view/rpc)
    }
    return _async(function () {
      var members = _read('members', []);
      var fines = _read('fines', []);
      var pr = {};
      members.forEach(function (m) { pr[m.id] = 0; });
      fines.forEach(function (f) {
        if (!(f.memberId in pr)) pr[f.memberId] = 0;
        pr[f.memberId] += Number(f.beloeb) || 0;
      });
      var liste = members.map(function (m) {
        return { memberId: m.id, navn: m.navn, beloeb: pr[m.id] || 0 };
      });
      liste.sort(function (a, b) { return b.beloeb - a.beloeb; });
      return liste;
    });
  }

  function getCatalog() {
    if (_supabase()) {
      // TODO(supabase): from('fine_catalog').select('*').order('forseelse')
    }
    return _async(function () {
      return _read('catalog', []);
    });
  }

  // Opretter (intet id) eller opdaterer (med id) en katalogpost.
  function upsertCatalogItem(post) {
    if (_supabase()) {
      // TODO(supabase): from('fine_catalog').upsert(...)
    }
    return _async(function () {
      var katalog = _read('catalog', []);
      if (post.id) {
        var fundet = false;
        katalog = katalog.map(function (k) {
          if (k.id === post.id) {
            fundet = true;
            return {
              id: k.id,
              forseelse: post.forseelse != null ? post.forseelse : k.forseelse,
              takst: post.takst != null ? (Number(post.takst) || 0) : k.takst
            };
          }
          return k;
        });
        if (!fundet) {
          katalog.push({ id: post.id, forseelse: post.forseelse, takst: Number(post.takst) || 0 });
        }
        _write('catalog', katalog);
        return katalog.filter(function (k) { return k.id === post.id; })[0];
      }
      var ny = { id: _id('cat'), forseelse: post.forseelse, takst: Number(post.takst) || 0 };
      katalog.push(ny);
      _write('catalog', katalog);
      return ny;
    });
  }

  function removeCatalogItem(id) {
    if (_supabase()) {
      // TODO(supabase): from('fine_catalog').delete().eq('id', id)
    }
    return _async(function () {
      var katalog = _read('catalog', []);
      _write('catalog', katalog.filter(function (k) { return k.id !== id; }));
      return true;
    });
  }

  function getWishlist() {
    if (_supabase()) {
      // TODO(supabase): from('wishlist').select('*').order('oprettet')
    }
    return _async(function () {
      return _read('wishlist', []);
    });
  }

  function addWish(w) {
    if (_supabase()) {
      // TODO(supabase): from('wishlist').insert(...)
    }
    return _async(function () {
      var liste = _read('wishlist', []);
      var ny = {
        id: _id('wish'),
        tekst: w.tekst,
        memberId: w.memberId || null,
        oprettet: new Date().toISOString()
      };
      liste.push(ny);
      _write('wishlist', liste);
      return ny;
    });
  }

  /* =========================================================
   * KALENDER: MØDER + RSVP + ARKIV
   * ======================================================= */

  function getMeetings() {
    if (_supabase()) {
      // TODO(supabase): from('meetings').select('*, rsvps(*)')
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var rsvps = _read('rsvps', []);
      // Hæng svar på hvert møde for nem visning.
      return moeder.map(function (m) {
        var kopi = {
          id: m.id, dato: m.dato, sted: m.sted, tema: m.tema,
          type: m.type || 'moede',
          datoer: m.datoer || (m.dato ? [m.dato] : []),
          arkiveret: !!m.arkiveret
        };
        kopi.svar = rsvps.filter(function (r) { return r.meetingId === m.id; });
        return kopi;
      });
    });
  }

  function addMeeting(m) {
    if (_supabase()) {
      // TODO(supabase): from('meetings').insert(...)
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var datoer = (m.datoer && m.datoer.length) ? m.datoer.slice() : (m.dato ? [m.dato] : []);
      datoer.sort(); // stigende ISO
      var ny = {
        id: _id('meet'),
        type: m.type || 'moede',
        dato: datoer[0] || m.dato || '', // tidligste dato, til sortering/kompatibilitet
        datoer: datoer,
        sted: m.sted || '',
        tema: m.tema || '',
        arkiveret: !!m.arkiveret
      };
      moeder.push(ny);
      _write('meetings', moeder);
      return ny;
    });
  }

  // Sæt/opdatér ét medlems svar på et møde. svar: 'ja' | 'nej' | 'maaske'.
  function setRSVP(meetingId, memberId, data) {
    if (_supabase()) {
      // TODO(supabase): from('rsvps').upsert(..., {onConflict:'meeting_id,member_id'})
    }
    return _async(function () {
      var rsvps = _read('rsvps', []);
      var fundet = false;
      rsvps = rsvps.map(function (r) {
        if (r.meetingId === meetingId && r.memberId === memberId) {
          fundet = true;
          return {
            id: r.id, meetingId: meetingId, memberId: memberId,
            svar: data.svar, tekst: data.tekst || ''
          };
        }
        return r;
      });
      if (!fundet) {
        rsvps.push({
          id: _id('rsvp'),
          meetingId: meetingId,
          memberId: memberId,
          svar: data.svar,
          tekst: data.tekst || ''
        });
      }
      _write('rsvps', rsvps);
      return true;
    });
  }

  // Arkiv: kun arkiverede møder (dato/sted/tema), nyeste først.
  function getArchive() {
    if (_supabase()) {
      // TODO(supabase): from('meetings').select('*').eq('arkiveret', true)
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var arkiv = moeder.filter(function (m) { return m.arkiveret; });
      arkiv.sort(function (a, b) { return (b.dato || '').localeCompare(a.dato || ''); });
      return arkiv.map(function (m) {
        return {
          id: m.id,
          type: m.type || 'moede',
          dato: m.dato,
          datoer: m.datoer || (m.dato ? [m.dato] : []),
          sted: m.sted,
          tema: m.tema,
          arkiveret: !!m.arkiveret
        };
      });
    });
  }

  /* =========================================================
   * ØL-PROTOKOLLEN: SESSIONER + ØL + RATINGS + TOP-3
   * ======================================================= */

  function getSessions() {
    if (_supabase()) {
      // TODO(supabase): from('beer_sessions').select('*, beers(*, beer_ratings(*))')
    }
    return _async(function () {
      var sessioner = _read('sessions', []);
      var oel = _read('beers', []);
      var ratings = _read('ratings', []);
      return sessioner.map(function (s) {
        var kopi = {
          id: s.id, dato: s.dato, sted: s.sted,
          deltagere: s.deltagere || [], tema: s.tema || ''
        };
        kopi.oel = oel.filter(function (b) { return b.sessionId === s.id; }).map(function (b) {
          var r = ratings.filter(function (x) { return x.beerId === b.id; });
          var scorer = r.map(function (x) { return x.score; });
          return {
            id: b.id, sessionId: b.sessionId,
            bryggeri: b.bryggeri, navn: b.navn, type: b.type, pct: b.pct,
            havdeMedId: b.havdeMedId || null,
            ratings: r,
            snit: _avg(scorer)
          };
        });
        return kopi;
      });
    });
  }

  function addSession(s) {
    if (_supabase()) {
      // TODO(supabase): from('beer_sessions').insert(...)
    }
    return _async(function () {
      var sessioner = _read('sessions', []);
      var ny = {
        id: _id('sess'),
        dato: s.dato,
        sted: s.sted || '',
        deltagere: s.deltagere || [],
        tema: s.tema || ''
      };
      sessioner.push(ny);
      _write('sessions', sessioner);
      return ny;
    });
  }

  // Tilføj en øl til en session.
  // b: {bryggeri, navn, type, pct, havdeMedId?}
  //   havdeMedId er valgfrit (memberId på den der havde øllen med) — bruges af
  //   getSessions/getBeerTop3 til at udstille havdeMedNavn ("… havde den med").
  //   Supabase-skemaet (beers-tabellen) skal have en tilsvarende kolonne.
  function addBeer(sessionId, b) {
    if (_supabase()) {
      // TODO(supabase): from('beers').insert(...) — inkl. kolonnen havde_med_id
    }
    return _async(function () {
      var oel = _read('beers', []);
      var ny = {
        id: _id('beer'),
        sessionId: sessionId,
        bryggeri: b.bryggeri || '',
        navn: b.navn,
        type: b.type || '',
        pct: b.pct != null ? Number(b.pct) : null,
        havdeMedId: b.havdeMedId || null
      };
      oel.push(ny);
      _write('beers', oel);
      return ny;
    });
  }

  // Sæt ét medlems score (1–10, heltal) for en øl. Overskriver tidligere.
  function rateBeer(beerId, memberId, score) {
    if (_supabase()) {
      // TODO(supabase): from('beer_ratings').upsert(..., {onConflict:'beer_id,member_id'})
    }
    return _async(function () {
      var ratings = _read('ratings', []);
      var fundet = false;
      ratings = ratings.map(function (r) {
        if (r.beerId === beerId && r.memberId === memberId) {
          fundet = true;
          return { id: r.id, beerId: beerId, memberId: memberId, score: Number(score) };
        }
        return r;
      });
      if (!fundet) {
        ratings.push({ id: _id('rate'), beerId: beerId, memberId: memberId, score: Number(score) });
      }
      _write('ratings', ratings);
      return true;
    });
  }

  // Top 3 øl på tværs af alle sessioner, efter gennemsnitsscore.
  function getBeerTop3() {
    if (_supabase()) {
      // TODO(supabase): view/rpc der rangerer øl efter snit
    }
    return _async(function () {
      var sessioner = _read('sessions', []);
      var oel = _read('beers', []);
      var ratings = _read('ratings', []);
      var members = _read('members', []);

      var sessMap = {};
      sessioner.forEach(function (s) { sessMap[s.id] = s; });
      var memMap = {};
      members.forEach(function (m) { memMap[m.id] = m; });

      var rangeret = oel.map(function (b) {
        var scorer = ratings
          .filter(function (x) { return x.beerId === b.id; })
          .map(function (x) { return x.score; });
        var sess = sessMap[b.sessionId] || {};
        var med = memMap[b.havdeMedId];
        return {
          id: b.id,
          navn: b.navn,
          bryggeri: b.bryggeri,
          type: b.type,
          pct: b.pct,
          snit: _avg(scorer),
          antalStemmer: scorer.length,
          dato: sess.dato || null,
          havdeMedId: b.havdeMedId || null,
          havdeMedNavn: med ? med.titel : null
        };
      });

      rangeret.sort(function (a, b) {
        if (b.snit !== a.snit) return b.snit - a.snit;
        return b.antalStemmer - a.antalStemmer;
      });
      return rangeret.slice(0, 3);
    });
  }

  /* =========================================================
   * ORDBOGSNÆVNET: ORD + DOMME
   * ======================================================= */

  function getWords() {
    if (_supabase()) {
      // TODO(supabase): from('words').select('*').order('oprettet', {ascending:false})
    }
    return _async(function () {
      return _read('words', []);
    });
  }

  function addWord(w) {
    if (_supabase()) {
      // TODO(supabase): from('words').insert(...)
    }
    return _async(function () {
      var ord = _read('words', []);
      var ny = {
        id: _id('word'),
        ord: w.ord,
        status: 'afventer',
        begrundelse: '',
        oprettet: new Date().toISOString()
      };
      ord.push(ny);
      _write('words', ord);
      return ny;
    });
  }

  // Afsig dom. status: 'doemt' | 'frikendt' | 'afventer'.
  function ruleWord(wordId, dom) {
    if (_supabase()) {
      // TODO(supabase): from('words').update(...).eq('id', wordId)
    }
    return _async(function () {
      var ord = _read('words', []);
      ord = ord.map(function (o) {
        if (o.id === wordId) {
          return {
            id: o.id,
            ord: o.ord,
            status: dom.status || o.status,
            begrundelse: dom.begrundelse != null ? dom.begrundelse : o.begrundelse,
            oprettet: o.oprettet
          };
        }
        return o;
      });
      _write('words', ord);
      return ord.filter(function (o) { return o.id === wordId; })[0];
    });
  }

  /* ---------- eksportér ---------- */

  window.DB = {
    // intern hjælp brugt af seed.js (idempotens-tjek)
    _read: _read,
    _write: _write,
    _PRA: PRA,

    getMembers: getMembers,

    getFines: getFines,
    addFine: addFine,
    removeFine: removeFine,
    getBalance: getBalance,
    getBalanceByMember: getBalanceByMember,

    getCatalog: getCatalog,
    upsertCatalogItem: upsertCatalogItem,
    removeCatalogItem: removeCatalogItem,

    getWishlist: getWishlist,
    addWish: addWish,

    getMeetings: getMeetings,
    addMeeting: addMeeting,
    setRSVP: setRSVP,
    getArchive: getArchive,

    getSessions: getSessions,
    addSession: addSession,
    addBeer: addBeer,
    rateBeer: rateBeer,
    getBeerTop3: getBeerTop3,

    getWords: getWords,
    addWord: addWord,
    ruleWord: ruleWord
  };
})();
