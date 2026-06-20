/* De Fulde Fem — Dørmanden (login, mock).
 *
 * window.Auth: login mod fælles klub-kodeord + ministernavn. Ved succes
 * gemmes session i sessionStorage som {memberId, rolle}. Alle sider ud over
 * login.html kalder Auth.krævLogin() (via app.js) og sendes til login.html
 * uden gyldig session.
 *
 * Rolle slås op via DB.getMembers(). I Supabase-fasen erstattes login() med
 * rigtig auth — signaturen bevares.
 *
 * Klassisk script: ingen import/export.
 */
(function () {
  'use strict';

  var NOEGLE = 'dff:session';

  function gemSession(memberId, rolle) {
    var s = { memberId: memberId, rolle: rolle };
    try {
      sessionStorage.setItem(NOEGLE, JSON.stringify(s));
    } catch (e) { /* sessionStorage utilgængelig — ignorér i mock */ }
    return s;
  }

  function current() {
    try {
      var raw = sessionStorage.getItem(NOEGLE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function _supa() {
    return !!(window.CONFIG && window.CONFIG.BRUG_SUPABASE);
  }

  // Er fejlen "baren lukket" (paused/nede DB)? Genbruger App.erNede hvis muligt.
  function _erNede(err) {
    if (window.App && typeof window.App.erNede === 'function') return window.App.erNede(err);
    var s = Number((err && (err.status || err.statusCode)) || 0);
    return s >= 500 || s === 0;
  }
  function _nedeFejl() { var e = new Error('Baren har lukket'); e.barLukket = true; return e; }

  function logout() {
    try {
      sessionStorage.removeItem(NOEGLE);
    } catch (e) { /* ignorér */ }
    // Supabase: log også ud af Auth-sessionen (rydder den persisterede token).
    if (_supa() && typeof window.DB_sbClient === 'function') {
      try { window.DB_sbClient().auth.signOut(); } catch (e) { /* ignorér */ }
    }
  }

  // Gem profil (memberId+rolle) fra den valgte brik. Returnér Promise<bool>.
  // Rollen slås op i den kanoniske picker-liste (CONFIG.MEDLEMMER), så det ikke
  // afhænger af et DB-kald — falder tilbage på datalaget hvis listen mangler.
  function _gemProfil(memberId) {
    var list = (window.CONFIG && window.CONFIG.MEDLEMMER) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === memberId) {
        gemSession(list[i].id, list[i].rolle);
        return Promise.resolve(true);
      }
    }
    return window.DB.getMembers().then(function (members) {
      for (var j = 0; j < members.length; j++) {
        if (members[j].id === memberId) {
          gemSession(members[j].id, members[j].rolle);
          return true;
        }
      }
      return false;
    });
  }

  // Returnerer Promise<bool>. true = logget ind (session gemt).
  // Supabase: kodeordet er det fælles klub-password (Supabase Auth). Profilen
  //   (hvem af de fem) kommer fra den valgte brik. localStorage: fælles kodeord.
  function login(memberId, kodeord) {
    if (_supa()) {
      if (typeof window.DB_sbClient !== 'function') return Promise.resolve(false);
      return window.DB_sbClient().auth.signInWithPassword({
        email: window.CONFIG.SUPABASE_KLUB_EMAIL,
        password: kodeord
      }).then(function (res) {
        if (res.error) {
          if (_erNede(res.error)) throw _nedeFejl(); // baren lukket -> login.html fanger
          return false;                              // forkert kodeord
        }
        if (!res.data || !res.data.session) return false;
        return _gemProfil(memberId);
      }, function () {
        // fetch/netværk kastede -> behandl som "baren lukket"
        throw _nedeFejl();
      });
    }
    if (!window.CONFIG || kodeord !== window.CONFIG.KLUB_KODEORD) {
      return Promise.resolve(false);
    }
    return _gemProfil(memberId);
  }

  // Kald på alle ikke-login-sider. Redirecter til login.html uden session.
  function kraevLogin() {
    if (!current()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  window.Auth = {
    login: login,
    logout: logout,
    current: current,
    gemSession: gemSession,
    // Både med og uden æ — så kald fra anden kode ikke fejler på tegnsæt.
    kraevLogin: kraevLogin,
    'krævLogin': kraevLogin
  };
})();
