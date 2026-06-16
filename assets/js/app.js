/* De Fulde Fem — app-stel + hjælpere.
 *
 * window.App: formatterings-hjælpere, et ark (bottom sheet) og toast, plus
 * DOMContentLoaded-opstart der:
 *   (a) på ikke-login-sider: kalder Auth.krævLogin() (redirect uden session),
 *   (b) injicerer .topbar øverst og <nav> nederst (5 faner) med korrekt href
 *       og .aktiv ud fra body[data-side]; login-siden får INGEN nav,
 *   (c) sætter document.body.dataset.rolle til .kun-minister-styring,
 *   (d) eksporterer formatKr / formatDato / avg / ark / toast.
 *
 * Klassisk script: ingen import/export. Hænger App på window.
 */
(function () {
  'use strict';

  /* ---------- formatterings-hjælpere ---------- */

  // 1420 -> "1.420 kr" (dansk tusindtalsseparator).
  function formatKr(n) {
    var tal = Math.round(Number(n) || 0);
    var negativ = tal < 0;
    tal = Math.abs(tal);
    var s = String(tal).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negativ ? '-' : '') + s + ' kr';
  }

  var MAANEDER = [
    'januar', 'februar', 'marts', 'april', 'maj', 'juni',
    'juli', 'august', 'september', 'oktober', 'november', 'december'
  ];
  var UGEDAGE = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

  // ISO-dato ("2026-08-15") -> "Lørdag 15. august 2026". Ukendt input
  // returneres uændret (så fri tekst kan vises som den er).
  function formatDato(isoEllerTekst) {
    if (isoEllerTekst == null) return '';
    var s = String(isoEllerTekst);
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return s;
    var aar = Number(m[1]);
    var maaned = Number(m[2]) - 1;
    var dag = Number(m[3]);
    var d = new Date(aar, maaned, dag);
    var ugedag = UGEDAGE[d.getDay()];
    var maanedNavn = MAANEDER[maaned] || '';
    return ugedag + ' ' + dag + '. ' + maanedNavn + ' ' + aar;
  }

  // Gennemsnit af et array af tal. Tomt -> 0.
  function avg(tal) {
    if (!tal || !tal.length) return 0;
    var sum = 0;
    for (var i = 0; i < tal.length; i++) sum += Number(tal[i]) || 0;
    return sum / tal.length;
  }

  /* ---------- nav-konfiguration ---------- */
  // Rækkefølge = visning. Aktiv fane sættes ud fra body[data-side].
  var FANER = [
    { side: 'tavlen',   href: 'index.html',          ikon: '📌', navn: 'Tavlen' },
    { side: 'boder',    href: 'boder.html',          ikon: '🪙', navn: 'Bøder' },
    { side: 'ollet',    href: 'protokol.html',       ikon: '🍺', navn: 'Øllet' },
    { side: 'kalender', href: 'kalender.html',       ikon: '📅', navn: 'Kalender' },
    { side: 'ord',      href: 'ordbogsnaevnet.html', ikon: '🗣️', navn: 'Ord' }
  ];

  function injicerTopbar() {
    if (document.querySelector('.topbar')) return; // siden har allerede en
    var bar = document.createElement('header');
    bar.className = 'topbar';
    var navn = document.createElement('div');
    navn.className = 'topbar-navn';
    navn.textContent = 'De Fulde Fem';
    var badge = document.createElement('div');
    badge.className = 'fynsk-badge';
    badge.textContent = '100 % fynsk';
    bar.appendChild(navn);
    bar.appendChild(badge);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function injicerNav(aktivSide) {
    if (document.querySelector('nav')) return; // findes allerede
    var nav = document.createElement('nav');
    for (var i = 0; i < FANER.length; i++) {
      var f = FANER[i];
      var a = document.createElement('a');
      a.href = f.href;
      if (f.side === aktivSide) a.className = 'aktiv';
      var ikon = document.createElement('span');
      ikon.className = 'ikon';
      ikon.textContent = f.ikon;
      a.appendChild(ikon);
      a.appendChild(document.createTextNode(f.navn));
      nav.appendChild(a);
    }
    document.body.appendChild(nav);
  }

  /* ---------- ark (bottom sheet) ---------- */
  // App.ark.open(el) / App.ark.close(). Forventer at side selv styrer indhold;
  // her sørger vi blot for synlighed + en mørk baggrund + luk-på-klik.
  function arkOpen(el) {
    if (!el) return;
    var skygge = _arkSkygge();
    skygge.style.display = 'block';
    el.classList.add('aaben');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function arkClose(el) {
    var skygge = document.getElementById('app-ark-skygge');
    if (skygge) skygge.style.display = 'none';
    var maal = el || document.querySelector('.ark.aaben');
    if (maal) {
      maal.classList.remove('aaben');
      maal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  function _arkSkygge() {
    var s = document.getElementById('app-ark-skygge');
    if (s) return s;
    s = document.createElement('div');
    s.id = 'app-ark-skygge';
    s.style.cssText =
      'display:none;position:fixed;inset:0;z-index:30;' +
      'background:rgba(31,78,95,.35);';
    s.addEventListener('click', function () { arkClose(); });
    document.body.appendChild(s);
    return s;
  }

  /* ---------- toast ---------- */
  function toast(tekst) {
    var t = document.getElementById('app-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'app-toast';
      // Skærmlæser-annoncering: toast er appens primære feedback-kanal
      // (succes og valideringsfejl). role=status + aria-live=polite så
      // blinde brugere får besked når en handling lykkes eller fejler.
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      t.setAttribute('aria-atomic', 'true');
      t.style.cssText =
        'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);' +
        'z-index:50;max-width:88%;padding:11px 18px;border-radius:8px;' +
        'background:#27424d;color:#fefdf9;font-family:inherit;font-size:14px;' +
        'font-weight:600;box-shadow:0 6px 18px rgba(31,78,95,.3);' +
        'opacity:0;transition:opacity .2s ease;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = tekst;
    // tving reflow så transition kører hver gang
    void t.offsetWidth;
    t.style.opacity = '1';
    clearTimeout(t._skjul);
    t._skjul = setTimeout(function () { t.style.opacity = '0'; }, 2600);
  }

  /* ---------- opstart ---------- */
  function start() {
    var side = document.body.getAttribute('data-side') || '';

    // (a) guard på alt undtagen login
    if (side !== 'login') {
      if (window.Auth && typeof window.Auth.kraevLogin === 'function') {
        if (!window.Auth.kraevLogin()) return; // redirecter — stop her
      }
    }

    // (c) rolle på body til .kun-minister-styring
    var sess = (window.Auth && window.Auth.current) ? window.Auth.current() : null;
    document.body.dataset.rolle = (sess && sess.rolle) ? sess.rolle : '';

    // (b) topbar + nav. Login: hverken topbar eller nav — dørmands-kortet
    //     skal stå rent med sin egen .skilt-branding.
    if (side !== 'login') {
      injicerTopbar();
      injicerNav(side);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* ---------- eksportér ---------- */
  window.App = {
    formatKr: formatKr,
    formatDato: formatDato,
    avg: avg,
    ark: { open: arkOpen, close: arkClose },
    toast: toast,
    FANER: FANER
  };
})();
