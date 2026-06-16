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

  function logout() {
    try {
      sessionStorage.removeItem(NOEGLE);
    } catch (e) { /* ignorér */ }
  }

  // Returnerer Promise<bool>. true = logget ind (session gemt).
  function login(memberId, kodeord) {
    if (!window.CONFIG || kodeord !== window.CONFIG.KLUB_KODEORD) {
      return Promise.resolve(false);
    }
    return window.DB.getMembers().then(function (members) {
      var m = null;
      for (var i = 0; i < members.length; i++) {
        if (members[i].id === memberId) { m = members[i]; break; }
      }
      if (!m) return false;
      gemSession(m.id, m.rolle);
      return true;
    });
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
