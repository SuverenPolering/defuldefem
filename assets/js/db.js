/* De Fulde Fem — datalag.
 *
 * window.DB.* — ALLE funktioner er async (returnerer Promise). To grene:
 *   - CONFIG.BRUG_SUPABASE = false  → localStorage ("dff:*"), offline + file://.
 *   - CONFIG.BRUG_SUPABASE = true   → Supabase (delt backend; kræver supabase-js
 *     i <head> + et indlogget Auth-session, ellers blokerer RLS alt).
 *
 * Beregninger (saldo, gennemsnit, top-3, skyld) sker HER i db'en — ikke i sider.
 * Supabase bruger snake_case; mapperne nedenfor oversætter til appens camelCase,
 * så sidernes datashapes er uændrede mellem de to grene.
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

  // Er Supabase-grenen aktiv?
  function _supabase() {
    return !!(window.CONFIG && window.CONFIG.BRUG_SUPABASE);
  }

  /* ---------- Supabase: klient + svar-hjælpere + mappere ---------- */

  var _sbClient = null;
  function _sb() {
    if (!_sbClient) {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('supabase-js er ikke loadet (mangler <script> i <head>).');
      }
      _sbClient = window.supabase.createClient(
        window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON
      );
    }
    return _sbClient;
  }
  window.DB_sbClient = _sb; // bruges af Dørmanden (auth)

  // Smid fejl / returnér data fra et supabase-svar.
  function _data(res) {
    if (res && res.error) throw res.error;
    return res ? res.data : null;
  }

  // Letvægts-cache (sessionStorage) til UFORANDERLIGE reference-data. Bruges
  // kun til 'members' (de fem er faste, jf. vedtægt § 6), så hvert sideskift
  // ikke henter dem igen. Ryddes ved tab-luk.
  function _cacheGet(navn) {
    try { var r = sessionStorage.getItem('dff:cache:' + navn); return r ? JSON.parse(r) : null; }
    catch (e) { return null; }
  }
  function _cacheSet(navn, vaerdi) {
    try { sessionStorage.setItem('dff:cache:' + navn, JSON.stringify(vaerdi)); } catch (e) {}
    return vaerdi;
  }

  // snake_case (DB) -> camelCase (app)
  function _fineFromDb(r) {
    return { id: r.id, memberId: r.member_id, grund: r.grund, enhed: r.enhed, antal: r.antal, betalt: r.betalt, dato: r.dato };
  }
  function _wishFromDb(r) {
    return { id: r.id, tekst: r.tekst, memberId: r.member_id, oprettet: r.oprettet };
  }
  function _rsvpFromDb(r) {
    return { id: r.id, meetingId: r.meeting_id, memberId: r.member_id, svar: r.svar, tekst: r.tekst };
  }
  function _beerFromDb(r) {
    return { id: r.id, sessionId: r.session_id, bryggeri: r.bryggeri, navn: r.navn, type: r.type, pct: r.pct, havdeMedId: r.havde_med_id };
  }
  function _ratingFromDb(r) {
    return { id: r.id, beerId: r.beer_id, memberId: r.member_id, score: r.score };
  }
  function _meetingFromDb(m) {
    return {
      id: m.id, type: m.type || 'moede', dato: m.dato,
      datoer: m.datoer || (m.dato ? [m.dato] : []),
      sted: m.sted, tema: m.tema, arkiveret: !!m.arkiveret
    };
  }
  function _kasseLogFromDb(r) {
    return { id: r.id, dato: r.dato, beloeb: r.beloeb, note: r.note };
  }

  // Kategori-rækkefølge i bødekataloget (DB-rækker har ingen iboende orden).
  var _KAT_ORDEN = [
    'Snak, telefon og bordopførsel',
    'Øl – spild og uheld',
    'Øl – forkert eller dårlig øl',
    'Glemt udstyr',
    'Fremmøde og mødedisciplin',
    'Ritualer: challenge og sang',
    'Tøj',
    'Skade, gæster og status'
  ];

  /* ---------- beregnings-hjælpere (intern) ---------- */

  function _avg(tal) {
    if (!tal || !tal.length) return 0;
    var sum = 0;
    for (var i = 0; i < tal.length; i++) sum += Number(tal[i]) || 0;
    return sum / tal.length;
  }

  // Beløb for en bøde = enhed * antal. Falder tilbage på (gammel) beloeb-form
  // og antal=1, så gamle bøder uden enhed/antal stadig regnes korrekt.
  function _fineBeloeb(f) {
    var enhed = (f.enhed != null ? Number(f.enhed) : Number(f.beloeb)) || 0;
    var antal = (f.antal != null ? Number(f.antal) : 1);
    return enhed * antal;
  }

  /* =========================================================
   * MEDLEMMER
   * ======================================================= */

  function getMembers() {
    if (_supabase()) {
      var c = _cacheGet('members');
      if (c && c.length) return Promise.resolve(c);
      return _sb().from('members').select('*').order('navn').then(function (res) {
        return _cacheSet('members', _data(res));
      });
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
      return _sb().from('fines').select('*').order('dato', { ascending: false })
        .then(function (res) { return _data(res).map(_fineFromDb); });
    }
    return _async(function () {
      return _read('fines', []);
    });
  }

  function addFine(b) {
    var enhed = (b.enhed != null ? Number(b.enhed) : Number(b.beloeb)) || 0;
    var antal = Math.max(1, Math.floor(Number(b.antal) || 1));
    var dato = b.dato || new Date().toISOString().slice(0, 10);
    if (_supabase()) {
      // MERGE: læg oveni en eksisterende UBETALT bøde med samme memberId+grund+enhed.
      return _sb().from('fines').select('*')
        .eq('member_id', b.memberId).eq('grund', b.grund).eq('enhed', enhed).eq('betalt', false)
        .limit(1).then(function (res) {
          var ex = _data(res)[0];
          if (ex) {
            return _sb().from('fines').update({ antal: ex.antal + antal, dato: dato })
              .eq('id', ex.id).select().single()
              .then(function (r) { return _fineFromDb(_data(r)); });
          }
          return _sb().from('fines').insert({
            member_id: b.memberId, grund: b.grund, enhed: enhed, antal: antal, betalt: false, dato: dato
          }).select().single().then(function (r) { return _fineFromDb(_data(r)); });
        });
    }
    return _async(function () {
      var fines = _read('fines', []);
      for (var i = 0; i < fines.length; i++) {
        var f = fines[i];
        if (f.betalt !== true && f.memberId === b.memberId &&
            f.grund === b.grund && Number(f.enhed) === enhed) {
          f.antal = (f.antal != null ? Number(f.antal) : 1) + antal;
          f.dato = dato;
          _write('fines', fines);
          return f;
        }
      }
      var ny = {
        id: _id('fine'), memberId: b.memberId, grund: b.grund,
        enhed: enhed, antal: antal, betalt: false, dato: dato
      };
      fines.push(ny);
      _write('fines', fines);
      return ny;
    });
  }

  // Sænk antallet på en bøde med 1. Fjern bøden helt når antal når 0. Returnér true.
  function decrementFine(id) {
    if (_supabase()) {
      return _sb().from('fines').select('antal').eq('id', id).single().then(function (res) {
        var ny = (Number(_data(res).antal) || 1) - 1;
        if (ny <= 0) {
          return _sb().from('fines').delete().eq('id', id).then(function (r) { _data(r); return true; });
        }
        return _sb().from('fines').update({ antal: ny }).eq('id', id).then(function (r) { _data(r); return true; });
      });
    }
    return _async(function () {
      var fines = _read('fines', []);
      var ud = [];
      for (var i = 0; i < fines.length; i++) {
        var f = fines[i];
        if (f.id === id) {
          var nyAntal = (f.antal != null ? Number(f.antal) : 1) - 1;
          if (nyAntal <= 0) continue;
          f.antal = nyAntal;
        }
        ud.push(f);
      }
      _write('fines', ud);
      return true;
    });
  }

  // Ryd KUN betalte bøder fra protokollen. Ubetalt gæld bevares. Rører IKKE kassen.
  function nulstilProtokol() {
    if (_supabase()) {
      return _sb().from('fines').delete().eq('betalt', true).select('id')
        .then(function (res) { return _data(res).length; });
    }
    return _async(function () {
      var fines = _read('fines', []);
      var beholdt = fines.filter(function (f) { return f.betalt !== true; });
      var antalSlettet = fines.length - beholdt.length;
      _write('fines', beholdt);
      return antalSlettet;
    });
  }

  function removeFine(id) {
    if (_supabase()) {
      return _sb().from('fines').delete().eq('id', id).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var fines = _read('fines', []);
      var ud = fines.filter(function (f) { return f.id !== id; });
      _write('fines', ud);
      return true;
    });
  }

  // Skyld pr. medlem: [{memberId, navn, titel, beloeb}] = sum af UBETALTE bøder.
  function getBalanceByMember() {
    if (_supabase()) {
      return Promise.all([
        getMembers(),
        _sb().from('fines').select('member_id,enhed,antal').eq('betalt', false).then(_data)
      ]).then(function (r) {
        var members = r[0], fines = r[1];
        var pr = {};
        members.forEach(function (m) { pr[m.id] = 0; });
        fines.forEach(function (f) {
          if (!(f.member_id in pr)) pr[f.member_id] = 0;
          pr[f.member_id] += (Number(f.enhed) || 0) * (f.antal != null ? Number(f.antal) : 1);
        });
        var liste = members.map(function (m) {
          return { memberId: m.id, navn: m.navn, titel: m.titel, beloeb: pr[m.id] || 0 };
        });
        liste.sort(function (a, b) { return b.beloeb - a.beloeb; });
        return liste;
      });
    }
    return _async(function () {
      var members = _read('members', []);
      var fines = _read('fines', []);
      var pr = {};
      members.forEach(function (m) { pr[m.id] = 0; });
      fines.forEach(function (f) {
        if (f.betalt === true) return;
        if (!(f.memberId in pr)) pr[f.memberId] = 0;
        pr[f.memberId] += _fineBeloeb(f);
      });
      var liste = members.map(function (m) {
        return { memberId: m.id, navn: m.navn, titel: m.titel, beloeb: pr[m.id] || 0 };
      });
      liste.sort(function (a, b) { return b.beloeb - a.beloeb; });
      return liste;
    });
  }

  // Penge i kassen (et lagret tal).
  function getKasseSaldo() {
    if (_supabase()) {
      return _sb().from('kasse').select('saldo').eq('id', 1).maybeSingle()
        .then(function (res) { var d = _data(res); return d ? Number(d.saldo) || 0 : 0; });
    }
    return _async(function () {
      return Number(_read('kasse_saldo', 0)) || 0;
    });
  }

  // Justér kassens saldo med delta (+/-). Logfører i kasse_log. Returnér ny saldo.
  function aendreKasse(delta, note) {
    var beloeb = Number(delta) || 0;
    var rentNote = (note == null ? '' : String(note)).trim();
    if (_supabase()) {
      return _sb().from('kasse').select('saldo').eq('id', 1).maybeSingle().then(function (res) {
        var cur = _data(res);
        var nyt = (cur ? Number(cur.saldo) || 0 : 0) + beloeb;
        return _sb().from('kasse').upsert({ id: 1, saldo: nyt }).then(function (u) {
          _data(u);
          return _sb().from('kasse_log').insert({ beloeb: beloeb, note: rentNote }).then(function (l) {
            _data(l); return nyt;
          });
        });
      });
    }
    return _async(function () {
      var nyt = (Number(_read('kasse_saldo', 0)) || 0) + beloeb;
      _write('kasse_saldo', nyt);
      var log = _read('kasse_log', []);
      log.push({ id: _id('kasse'), dato: new Date().toISOString(), beloeb: beloeb, note: rentNote });
      _write('kasse_log', log);
      return nyt;
    });
  }

  // Kassebog: alle posteringer (ind/ud), nyeste først.
  function getKasseLog() {
    if (_supabase()) {
      return _sb().from('kasse_log').select('*').order('dato', { ascending: false })
        .then(function (res) { return _data(res).map(_kasseLogFromDb); });
    }
    return _async(function () {
      var log = _read('kasse_log', []);
      log.sort(function (a, b) { return (b.dato || '').localeCompare(a.dato || ''); });
      return log;
    });
  }

  // Markér ALLE et medlems ubetalte bøder som betalt; læg summen til kassen.
  function markerBetalt(memberId) {
    if (_supabase()) {
      return Promise.all([
        _sb().from('fines').select('enhed,antal').eq('member_id', memberId).eq('betalt', false).then(_data),
        _sb().from('kasse').select('saldo').eq('id', 1).maybeSingle().then(_data),
        _sb().from('members').select('titel').eq('id', memberId).maybeSingle().then(_data)
      ]).then(function (r) {
        var unpaid = r[0] || [];
        var saldo = r[1] ? Number(r[1].saldo) || 0 : 0;
        var titel = r[2] ? r[2].titel : memberId;
        var antal = unpaid.length;
        var beloeb = unpaid.reduce(function (s, f) {
          return s + (Number(f.enhed) || 0) * (f.antal != null ? Number(f.antal) : 1);
        }, 0);
        if (antal === 0) return { antal: 0, beloeb: 0, nySaldo: saldo };
        var nySaldo = saldo + beloeb;
        return _sb().from('fines').update({ betalt: true })
          .eq('member_id', memberId).eq('betalt', false).then(function (u) {
            _data(u);
            return _sb().from('kasse').upsert({ id: 1, saldo: nySaldo }).then(function (k) {
              _data(k);
              return _sb().from('kasse_log').insert({
                beloeb: beloeb,
                note: 'Bøder betalt: ' + titel + (antal > 1 ? ' (' + antal + ' bøder)' : '')
              }).then(function (l) {
                _data(l);
                return { antal: antal, beloeb: beloeb, nySaldo: nySaldo };
              });
            });
          });
      });
    }
    return _async(function () {
      var fines = _read('fines', []);
      var antal = 0;
      var beloeb = 0;
      fines = fines.map(function (f) {
        if (f.memberId === memberId && f.betalt !== true) {
          antal += 1;
          beloeb += _fineBeloeb(f);
          var kopi = {};
          for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) kopi[k] = f[k]; }
          kopi.betalt = true;
          return kopi;
        }
        return f;
      });
      _write('fines', fines);
      var nySaldo = (Number(_read('kasse_saldo', 0)) || 0) + beloeb;
      _write('kasse_saldo', nySaldo);
      if (beloeb > 0) {
        var medlemmer = _read('members', []);
        var titel = memberId;
        for (var mi = 0; mi < medlemmer.length; mi++) {
          if (medlemmer[mi].id === memberId) { titel = medlemmer[mi].titel; break; }
        }
        var log = _read('kasse_log', []);
        log.push({
          id: _id('kasse'), dato: new Date().toISOString(), beloeb: beloeb,
          note: 'Bøder betalt: ' + titel + (antal > 1 ? ' (' + antal + ' bøder)' : '')
        });
        _write('kasse_log', log);
      }
      return { antal: antal, beloeb: beloeb, nySaldo: nySaldo };
    });
  }

  function getCatalog() {
    if (_supabase()) {
      return _sb().from('fine_catalog').select('*').then(function (res) {
        var rows = _data(res);
        rows.sort(function (a, b) {
          var ia = _KAT_ORDEN.indexOf(a.kategori); if (ia < 0) ia = 99;
          var ib = _KAT_ORDEN.indexOf(b.kategori); if (ib < 0) ib = 99;
          if (ia !== ib) return ia - ib;
          if ((a.takst || 0) !== (b.takst || 0)) return (a.takst || 0) - (b.takst || 0);
          return (a.forseelse || '').localeCompare(b.forseelse || '', 'da');
        });
        return rows;
      });
    }
    return _async(function () {
      return _read('catalog', []);
    });
  }

  // Opretter (intet id) eller opdaterer (med id) en katalogpost.
  function upsertCatalogItem(post) {
    if (_supabase()) {
      var row = {
        kategori: post.kategori != null ? post.kategori : '',
        forseelse: post.forseelse,
        takst: Number(post.takst) || 0
      };
      if (post.id) {
        return _sb().from('fine_catalog').update(row).eq('id', post.id).select().single().then(_data);
      }
      return _sb().from('fine_catalog').insert(row).select().single().then(_data);
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
              kategori: post.kategori != null ? post.kategori : (k.kategori || ''),
              forseelse: post.forseelse != null ? post.forseelse : k.forseelse,
              takst: post.takst != null ? (Number(post.takst) || 0) : k.takst
            };
          }
          return k;
        });
        if (!fundet) {
          katalog.push({ id: post.id, kategori: post.kategori || '', forseelse: post.forseelse, takst: Number(post.takst) || 0 });
        }
        _write('catalog', katalog);
        return katalog.filter(function (k) { return k.id === post.id; })[0];
      }
      var ny = { id: _id('cat'), kategori: post.kategori || '', forseelse: post.forseelse, takst: Number(post.takst) || 0 };
      katalog.push(ny);
      _write('catalog', katalog);
      return ny;
    });
  }

  function removeCatalogItem(id) {
    if (_supabase()) {
      return _sb().from('fine_catalog').delete().eq('id', id).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var katalog = _read('catalog', []);
      _write('catalog', katalog.filter(function (k) { return k.id !== id; }));
      return true;
    });
  }

  function getWishlist() {
    if (_supabase()) {
      return _sb().from('wishlist').select('*').order('oprettet')
        .then(function (res) { return _data(res).map(_wishFromDb); });
    }
    return _async(function () {
      return _read('wishlist', []);
    });
  }

  function addWish(w) {
    if (_supabase()) {
      return _sb().from('wishlist').insert({ tekst: w.tekst, member_id: w.memberId || null })
        .select().single().then(function (r) { return _wishFromDb(_data(r)); });
    }
    return _async(function () {
      var liste = _read('wishlist', []);
      var ny = { id: _id('wish'), tekst: w.tekst, memberId: w.memberId || null, oprettet: new Date().toISOString() };
      liste.push(ny);
      _write('wishlist', liste);
      return ny;
    });
  }

  function updateWish(id, felter) {
    if (_supabase()) {
      var f = felter || {};
      if (f.tekst == null) {
        return _sb().from('wishlist').select('*').eq('id', id).maybeSingle()
          .then(function (res) { var d = _data(res); return d ? _wishFromDb(d) : null; });
      }
      return _sb().from('wishlist').update({ tekst: String(f.tekst) }).eq('id', id)
        .select().single().then(function (r) { return _wishFromDb(_data(r)); });
    }
    return _async(function () {
      var liste = _read('wishlist', []);
      var opdateret = null;
      for (var i = 0; i < liste.length; i++) {
        if (liste[i].id === id) {
          liste[i].tekst = (felter && felter.tekst != null) ? String(felter.tekst) : liste[i].tekst;
          opdateret = liste[i];
          break;
        }
      }
      _write('wishlist', liste);
      return opdateret;
    });
  }

  function removeWish(id) {
    if (_supabase()) {
      return _sb().from('wishlist').delete().eq('id', id).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var liste = _read('wishlist', []);
      _write('wishlist', liste.filter(function (w) { return w.id !== id; }));
      return true;
    });
  }

  /* =========================================================
   * KALENDER: MØDER + RSVP + ARKIV
   * ======================================================= */

  function getMeetings() {
    if (_supabase()) {
      return _sb().from('meetings').select('*, rsvps(*)').then(function (res) {
        return _data(res).map(function (m) {
          var k = _meetingFromDb(m);
          k.svar = (m.rsvps || []).map(_rsvpFromDb);
          return k;
        });
      });
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var rsvps = _read('rsvps', []);
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
    var datoer = (m.datoer && m.datoer.length) ? m.datoer.slice() : (m.dato ? [m.dato] : []);
    datoer.sort();
    if (_supabase()) {
      return _sb().from('meetings').insert({
        type: m.type || 'moede',
        dato: datoer[0] || m.dato,
        datoer: datoer,
        sted: m.sted || '',
        tema: m.tema || '',
        arkiveret: !!m.arkiveret
      }).select().single().then(function (r) { return _meetingFromDb(_data(r)); });
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var ny = {
        id: _id('meet'), type: m.type || 'moede',
        dato: datoer[0] || m.dato || '', datoer: datoer,
        sted: m.sted || '', tema: m.tema || '', arkiveret: !!m.arkiveret
      };
      moeder.push(ny);
      _write('meetings', moeder);
      return ny;
    });
  }

  function updateMeeting(id, felter) {
    if (_supabase()) {
      return _sb().from('meetings').select('*').eq('id', id).single().then(function (res) {
        var m = _data(res);
        var f = felter || {};
        var datoer;
        if (f.datoer && f.datoer.length) datoer = f.datoer.slice();
        else if (f.dato) datoer = [f.dato];
        else datoer = (m.datoer && m.datoer.length) ? m.datoer.slice() : (m.dato ? [m.dato] : []);
        datoer.sort();
        var upd = {
          type: f.type != null ? f.type : (m.type || 'moede'),
          dato: datoer[0] || m.dato,
          datoer: datoer,
          sted: f.sted != null ? f.sted : (m.sted || ''),
          tema: f.tema != null ? f.tema : (m.tema || ''),
          arkiveret: f.arkiveret != null ? !!f.arkiveret : !!m.arkiveret
        };
        return _sb().from('meetings').update(upd).eq('id', id).select().single()
          .then(function (r) { return _meetingFromDb(_data(r)); });
      });
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var opdateret = null;
      moeder = moeder.map(function (m) {
        if (m.id !== id) return m;
        var f = felter || {};
        var datoer;
        if (f.datoer && f.datoer.length) datoer = f.datoer.slice();
        else if (f.dato) datoer = [f.dato];
        else datoer = (m.datoer && m.datoer.length) ? m.datoer.slice() : (m.dato ? [m.dato] : []);
        datoer.sort();
        opdateret = {
          id: m.id,
          type: f.type != null ? f.type : (m.type || 'moede'),
          dato: datoer[0] || '',
          datoer: datoer,
          sted: f.sted != null ? f.sted : (m.sted || ''),
          tema: f.tema != null ? f.tema : (m.tema || ''),
          arkiveret: f.arkiveret != null ? !!f.arkiveret : !!m.arkiveret
        };
        return opdateret;
      });
      _write('meetings', moeder);
      return opdateret;
    });
  }

  function removeMeeting(id) {
    if (_supabase()) {
      // rsvps fjernes via FK on delete cascade.
      return _sb().from('meetings').delete().eq('id', id).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      _write('meetings', moeder.filter(function (m) { return m.id !== id; }));
      var rsvps = _read('rsvps', []);
      _write('rsvps', rsvps.filter(function (r) { return r.meetingId !== id; }));
      return true;
    });
  }

  function setRSVP(meetingId, memberId, data) {
    if (_supabase()) {
      return _sb().from('rsvps').upsert({
        meeting_id: meetingId, member_id: memberId, svar: data.svar, tekst: data.tekst || ''
      }, { onConflict: 'meeting_id,member_id' }).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var rsvps = _read('rsvps', []);
      var fundet = false;
      rsvps = rsvps.map(function (r) {
        if (r.meetingId === meetingId && r.memberId === memberId) {
          fundet = true;
          return { id: r.id, meetingId: meetingId, memberId: memberId, svar: data.svar, tekst: data.tekst || '' };
        }
        return r;
      });
      if (!fundet) {
        rsvps.push({ id: _id('rsvp'), meetingId: meetingId, memberId: memberId, svar: data.svar, tekst: data.tekst || '' });
      }
      _write('rsvps', rsvps);
      return true;
    });
  }

  function getArchive() {
    if (_supabase()) {
      return _sb().from('meetings').select('*').eq('arkiveret', true).order('dato', { ascending: false })
        .then(function (res) { return _data(res).map(_meetingFromDb); });
    }
    return _async(function () {
      var moeder = _read('meetings', []);
      var arkiv = moeder.filter(function (m) { return m.arkiveret; });
      arkiv.sort(function (a, b) { return (b.dato || '').localeCompare(a.dato || ''); });
      return arkiv.map(function (m) {
        return {
          id: m.id, type: m.type || 'moede', dato: m.dato,
          datoer: m.datoer || (m.dato ? [m.dato] : []),
          sted: m.sted, tema: m.tema, arkiveret: !!m.arkiveret
        };
      });
    });
  }

  /* =========================================================
   * ØL-PROTOKOLLEN: SESSIONER + ØL + RATINGS + TOP-3
   * ======================================================= */

  function getSessions() {
    if (_supabase()) {
      return _sb().from('beer_sessions').select('*, beers(*, beer_ratings(*))').then(function (res) {
        return _data(res).map(function (s) {
          return {
            id: s.id, dato: s.dato, sted: s.sted,
            deltagere: s.deltagere || [], tema: s.tema || '',
            oel: (s.beers || []).map(function (b) {
              var ratings = (b.beer_ratings || []).map(_ratingFromDb);
              return {
                id: b.id, sessionId: b.session_id,
                bryggeri: b.bryggeri, navn: b.navn, type: b.type, pct: b.pct,
                havdeMedId: b.havde_med_id || null,
                ratings: ratings,
                snit: _avg(ratings.map(function (x) { return x.score; }))
              };
            })
          };
        });
      });
    }
    return _async(function () {
      var sessioner = _read('sessions', []);
      var oel = _read('beers', []);
      var ratings = _read('ratings', []);
      return sessioner.map(function (s) {
        var kopi = { id: s.id, dato: s.dato, sted: s.sted, deltagere: s.deltagere || [], tema: s.tema || '' };
        kopi.oel = oel.filter(function (b) { return b.sessionId === s.id; }).map(function (b) {
          var r = ratings.filter(function (x) { return x.beerId === b.id; });
          var scorer = r.map(function (x) { return x.score; });
          return {
            id: b.id, sessionId: b.sessionId,
            bryggeri: b.bryggeri, navn: b.navn, type: b.type, pct: b.pct,
            havdeMedId: b.havdeMedId || null, ratings: r, snit: _avg(scorer)
          };
        });
        return kopi;
      });
    });
  }

  function addSession(s) {
    if (_supabase()) {
      return _sb().from('beer_sessions').insert({
        dato: s.dato, sted: s.sted || '', deltagere: s.deltagere || [], tema: s.tema || ''
      }).select().single().then(function (r) {
        var x = _data(r);
        return { id: x.id, dato: x.dato, sted: x.sted, deltagere: x.deltagere || [], tema: x.tema || '' };
      });
    }
    return _async(function () {
      var sessioner = _read('sessions', []);
      var ny = { id: _id('sess'), dato: s.dato, sted: s.sted || '', deltagere: s.deltagere || [], tema: s.tema || '' };
      sessioner.push(ny);
      _write('sessions', sessioner);
      return ny;
    });
  }

  function addBeer(sessionId, b) {
    if (_supabase()) {
      return _sb().from('beers').insert({
        session_id: sessionId, bryggeri: b.bryggeri || '', navn: b.navn,
        type: b.type || '', pct: b.pct != null ? Number(b.pct) : null,
        havde_med_id: b.havdeMedId || null
      }).select().single().then(function (r) { return _beerFromDb(_data(r)); });
    }
    return _async(function () {
      var oel = _read('beers', []);
      var ny = {
        id: _id('beer'), sessionId: sessionId, bryggeri: b.bryggeri || '', navn: b.navn,
        type: b.type || '', pct: b.pct != null ? Number(b.pct) : null, havdeMedId: b.havdeMedId || null
      };
      oel.push(ny);
      _write('beers', oel);
      return ny;
    });
  }

  // Opdatér en session (dato/sted/tema/deltagere). Kun angivne felter ændres.
  function updateSession(id, felter) {
    var f = felter || {};
    if (_supabase()) {
      var upd = {};
      if (f.dato != null) upd.dato = f.dato;
      if (f.sted != null) upd.sted = f.sted;
      if (f.tema != null) upd.tema = f.tema;
      if (f.deltagere != null) upd.deltagere = f.deltagere;
      return _sb().from('beer_sessions').update(upd).eq('id', id).select().single()
        .then(function (r) {
          var x = _data(r);
          return { id: x.id, dato: x.dato, sted: x.sted, deltagere: x.deltagere || [], tema: x.tema || '' };
        });
    }
    return _async(function () {
      var sessioner = _read('sessions', []);
      var opdateret = null;
      sessioner = sessioner.map(function (s) {
        if (s.id !== id) return s;
        opdateret = {
          id: s.id,
          dato: f.dato != null ? f.dato : s.dato,
          sted: f.sted != null ? f.sted : (s.sted || ''),
          tema: f.tema != null ? f.tema : (s.tema || ''),
          deltagere: f.deltagere != null ? f.deltagere : (s.deltagere || [])
        };
        return opdateret;
      });
      _write('sessions', sessioner);
      return opdateret;
    });
  }

  // Slet en session + dens øl + karakterer.
  function removeSession(id) {
    if (_supabase()) {
      // beers + beer_ratings fjernes via FK on delete cascade.
      return _sb().from('beer_sessions').delete().eq('id', id).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var beers = _read('beers', []);
      var fjern = beers.filter(function (b) { return b.sessionId === id; }).map(function (b) { return b.id; });
      _write('beers', beers.filter(function (b) { return b.sessionId !== id; }));
      var ratings = _read('ratings', []);
      _write('ratings', ratings.filter(function (r) { return fjern.indexOf(r.beerId) === -1; }));
      var sessioner = _read('sessions', []);
      _write('sessions', sessioner.filter(function (s) { return s.id !== id; }));
      return true;
    });
  }

  // Opdatér en øl (navn/bryggeri/type/pct/havdeMedId). Kun angivne felter ændres.
  function updateBeer(id, felter) {
    var f = felter || {};
    if (_supabase()) {
      var upd = {};
      if (f.navn != null) upd.navn = f.navn;
      if (f.bryggeri != null) upd.bryggeri = f.bryggeri;
      if (f.type != null) upd.type = f.type;
      if (f.pct !== undefined) upd.pct = f.pct != null ? Number(f.pct) : null;
      if (f.havdeMedId !== undefined) upd.havde_med_id = f.havdeMedId || null;
      return _sb().from('beers').update(upd).eq('id', id).select().single()
        .then(function (r) { return _beerFromDb(_data(r)); });
    }
    return _async(function () {
      var oel = _read('beers', []);
      var opdateret = null;
      oel = oel.map(function (b) {
        if (b.id !== id) return b;
        opdateret = {
          id: b.id, sessionId: b.sessionId,
          bryggeri: f.bryggeri != null ? f.bryggeri : (b.bryggeri || ''),
          navn: f.navn != null ? f.navn : b.navn,
          type: f.type != null ? f.type : (b.type || ''),
          pct: f.pct !== undefined ? (f.pct != null ? Number(f.pct) : null) : (b.pct != null ? b.pct : null),
          havdeMedId: f.havdeMedId !== undefined ? (f.havdeMedId || null) : (b.havdeMedId || null)
        };
        return opdateret;
      });
      _write('beers', oel);
      return opdateret;
    });
  }

  // Slet en øl + dens karakterer.
  function removeBeer(id) {
    if (_supabase()) {
      return _sb().from('beers').delete().eq('id', id).then(function (r) { _data(r); return true; });
    }
    return _async(function () {
      var oel = _read('beers', []);
      _write('beers', oel.filter(function (b) { return b.id !== id; }));
      var ratings = _read('ratings', []);
      _write('ratings', ratings.filter(function (r) { return r.beerId !== id; }));
      return true;
    });
  }

  function rateBeer(beerId, memberId, score) {
    if (_supabase()) {
      return _sb().from('beer_ratings').upsert({
        beer_id: beerId, member_id: memberId, score: Number(score)
      }, { onConflict: 'beer_id,member_id' }).then(function (r) { _data(r); return true; });
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

  function getBeerTop3() {
    if (_supabase()) {
      return Promise.all([
        _sb().from('beers').select('*, beer_ratings(score)').then(_data),
        _sb().from('beer_sessions').select('id,dato').then(_data),
        getMembers()
      ]).then(function (res) {
        var oel = res[0], sessioner = res[1], members = res[2];
        var sessMap = {}; sessioner.forEach(function (s) { sessMap[s.id] = s; });
        var memMap = {}; members.forEach(function (m) { memMap[m.id] = m; });
        var rangeret = oel.map(function (b) {
          var scorer = (b.beer_ratings || []).map(function (x) { return x.score; });
          var sess = sessMap[b.session_id] || {};
          var med = memMap[b.havde_med_id];
          return {
            id: b.id, navn: b.navn, bryggeri: b.bryggeri, type: b.type, pct: b.pct,
            snit: _avg(scorer), antalStemmer: scorer.length,
            dato: sess.dato || null,
            havdeMedId: b.havde_med_id || null,
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
    return _async(function () {
      var sessioner = _read('sessions', []);
      var oel = _read('beers', []);
      var ratings = _read('ratings', []);
      var members = _read('members', []);
      var sessMap = {}; sessioner.forEach(function (s) { sessMap[s.id] = s; });
      var memMap = {}; members.forEach(function (m) { memMap[m.id] = m; });
      var rangeret = oel.map(function (b) {
        var scorer = ratings.filter(function (x) { return x.beerId === b.id; }).map(function (x) { return x.score; });
        var sess = sessMap[b.sessionId] || {};
        var med = memMap[b.havdeMedId];
        return {
          id: b.id, navn: b.navn, bryggeri: b.bryggeri, type: b.type, pct: b.pct,
          snit: _avg(scorer), antalStemmer: scorer.length,
          dato: sess.dato || null, havdeMedId: b.havdeMedId || null,
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
   * VEDTÆGTER (key: 'forening' | 'boedekasse')
   * ======================================================= */

  function getVedtaegter(key) {
    if (_supabase()) {
      return _sb().from('vedtaegter').select('tekst').eq('noegle', key).maybeSingle()
        .then(function (res) { var d = _data(res); return d ? d.tekst : ''; });
    }
    return _async(function () {
      var alle = _read('vedtaegter', {});
      return (alle && alle[key]) || '';
    });
  }

  function setVedtaegter(key, tekst) {
    if (_supabase()) {
      return _sb().from('vedtaegter').upsert({ noegle: key, tekst: String(tekst) }, { onConflict: 'noegle' })
        .then(function (r) { _data(r); return String(tekst); });
    }
    return _async(function () {
      var alle = _read('vedtaegter', {});
      if (!alle || typeof alle !== 'object') alle = {};
      alle[key] = String(tekst);
      _write('vedtaegter', alle);
      return alle[key];
    });
  }

  /* ---------- eksportér ---------- */

  window.DB = {
    _read: _read,
    _write: _write,
    _PRA: PRA,

    getMembers: getMembers,

    getFines: getFines,
    addFine: addFine,
    decrementFine: decrementFine,
    nulstilProtokol: nulstilProtokol,
    removeFine: removeFine,
    getBalanceByMember: getBalanceByMember,
    markerBetalt: markerBetalt,
    getKasseSaldo: getKasseSaldo,
    aendreKasse: aendreKasse,
    getKasseLog: getKasseLog,

    getCatalog: getCatalog,
    upsertCatalogItem: upsertCatalogItem,
    removeCatalogItem: removeCatalogItem,

    getWishlist: getWishlist,
    addWish: addWish,
    updateWish: updateWish,
    removeWish: removeWish,

    getMeetings: getMeetings,
    addMeeting: addMeeting,
    updateMeeting: updateMeeting,
    removeMeeting: removeMeeting,
    setRSVP: setRSVP,
    getArchive: getArchive,

    getSessions: getSessions,
    addSession: addSession,
    updateSession: updateSession,
    removeSession: removeSession,
    addBeer: addBeer,
    updateBeer: updateBeer,
    removeBeer: removeBeer,
    rateBeer: rateBeer,
    getBeerTop3: getBeerTop3,

    getVedtaegter: getVedtaegter,
    setVedtaegter: setVedtaegter
  };
})();
