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

  // 1420 -> "1.420 kr", 12.5 -> "12,5 kr" (dansk: "." tusind, "," decimal).
  // Afrundes til 2 decimaler; brøkdel vises kun hvis >0, uden efterstillede nuller.
  function formatKr(n) {
    var tal = Number(n) || 0;
    var negativ = tal < 0;
    tal = Math.abs(tal);
    tal = Math.round(tal * 100) / 100; // 2 decimaler
    var heltal = Math.floor(tal);
    var broek = Math.round((tal - heltal) * 100); // 0..99
    var s = String(heltal).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (broek > 0) {
      var dec = String(broek);
      if (dec.length < 2) dec = '0' + dec; // 5 -> "05"
      dec = dec.replace(/0+$/, '');        // fjern efterstillede nuller
      s = s + ',' + dec;
    }
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
    { side: 'vedtaegter', href: 'vedtaegter.html', ikon: '📜', navn: 'Vedtægter' }
  ];

  function injicerTopbar() {
    if (document.querySelector('.topbar')) return; // siden har allerede en
    var bar = document.createElement('header');
    bar.className = 'topbar';
    var navn = document.createElement('div');
    navn.className = 'topbar-navn';
    navn.textContent = 'De Fulde Fem';
    var mig = document.createElement('div');
    mig.className = 'topbar-mig';
    mig.id = 'topbar-mig';
    var badge = document.createElement('div');
    badge.className = 'fynsk-badge';
    badge.textContent = '100 % fynsk';
    bar.appendChild(navn);
    bar.appendChild(mig);
    bar.appendChild(badge);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function injicerNav(aktivSide) {
    if (document.querySelector('nav')) return; // findes allerede
    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Forsamlingshusets navigation');
    for (var i = 0; i < FANER.length; i++) {
      var f = FANER[i];
      var a = document.createElement('a');
      a.href = f.href;
      if (f.side === aktivSide) {
        a.className = 'aktiv';
        a.setAttribute('aria-current', 'page');
      }
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
  //
  // Central fokusstyring (spejler protokol.html): mens et ark er åbent gøres
  // resten af siden inert + aria-hidden for tastatur og skærmlæsere, fokus
  // flyttes ind i arket, fanges der (Tab-fælde) og føres tilbage til
  // udløseren ved luk. Escape lukker.
  var _aabentArk = null;   // det aktuelt åbne ark-element
  var _udloeserEl = null;  // elementet der åbnede arket — fokus føres hertil igen
  var _ARK_FOKUS_VAELGER =
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Skjul resten af siden for tastatur + skærmlæsere, mens et ark er åbent.
  // Spring selve arket, baggrunden og toasten over — samt andre .ark/.ark-baggrund.
  function _saetBaggrundInert(ark, inert) {
    var skygge = document.getElementById('app-ark-skygge');
    var toastEl = document.getElementById('app-toast');
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === ark || el === skygge || el === toastEl) return;
      if (el.classList && (el.classList.contains('ark') || el.classList.contains('ark-baggrund'))) return;
      if (inert) {
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('inert', '');
      } else {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('inert');
      }
    });
  }

  function _fokusbareI(ark) {
    return Array.prototype.filter.call(
      ark.querySelectorAll(_ARK_FOKUS_VAELGER),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
  }

  function arkOpen(el) {
    if (!el) return;
    _udloeserEl = (document.activeElement instanceof HTMLElement) ? document.activeElement : null;
    var skygge = _arkSkygge();
    skygge.style.display = 'block';
    el.classList.add('aaben');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    _aabentArk = el;
    _saetBaggrundInert(el, true);
    // Flyt fokus ind i arket (første interaktive element).
    var fokusbare = _fokusbareI(el);
    setTimeout(function () {
      if (fokusbare.length) fokusbare[0].focus();
    }, 0);
  }

  function arkClose(el) {
    var maal = el || _aabentArk || document.querySelector('.ark.aaben');
    var skygge = document.getElementById('app-ark-skygge');
    if (skygge) skygge.style.display = 'none';
    if (maal) {
      maal.classList.remove('aaben');
      maal.setAttribute('aria-hidden', 'true');
      _saetBaggrundInert(maal, false);
    }
    document.body.style.overflow = '';
    _aabentArk = null;
    // Returnér fokus til den udløsende knap.
    if (_udloeserEl && typeof _udloeserEl.focus === 'function') {
      _udloeserEl.focus();
    }
    _udloeserEl = null;
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

  // Escape lukker; Tab/Shift+Tab fanges inden i det åbne ark (fokusfælde).
  document.addEventListener('keydown', function (e) {
    if (!_aabentArk) return;
    if (e.key === 'Escape') {
      arkClose();
      return;
    }
    if (e.key === 'Tab') {
      var ark = _aabentArk;
      var fokusbare = _fokusbareI(ark);
      if (!fokusbare.length) { e.preventDefault(); return; }
      var foerste = fokusbare[0];
      var sidste = fokusbare[fokusbare.length - 1];
      var aktiv = document.activeElement;
      if (e.shiftKey) {
        if (aktiv === foerste || !ark.contains(aktiv)) {
          e.preventDefault();
          sidste.focus();
        }
      } else {
        if (aktiv === sidste || !ark.contains(aktiv)) {
          e.preventDefault();
          foerste.focus();
        }
      }
    }
  });

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
        'position:fixed;left:50%;bottom:160px;transform:translateX(-50%);' +
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

  /* ---------- auto-stort-forbogstav ---------- */
  // Gør første bogstav i hver sætning stort i skrivefelter. ÉN document-niveau
  // listener (registreres én gang). Kun <textarea> + <input type=text|uden type>;
  // undtag data-no-cap samt password/number/email/date/url/tel/range. Caret bevares.
  var _autoCapMonteret = false;
  function _autoCapTaeller(el) {
    if (!el) return false;
    var tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (tag !== 'INPUT') return false;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    return t === 'text';
  }
  function montérAutoCap() {
    if (_autoCapMonteret) return;
    _autoCapMonteret = true;
    document.addEventListener('input', function (e) {
      var el = e.target;
      if (!_autoCapTaeller(el)) return;
      if (el.hasAttribute('data-no-cap')) return;
      var value = el.value;
      if (typeof value !== 'string' || !value) return;
      var ny = value.replace(/(^\s*[a-zæøå])|([.!?]\s+[a-zæøå])/g, function (m) {
        return m.toUpperCase();
      });
      if (ny !== value) {
        var caret = el.selectionStart;
        el.value = ny; // samme længde — caret-index uændret
        if (caret != null && typeof el.setSelectionRange === 'function') {
          el.setSelectionRange(caret, caret);
        }
      }
    });
  }

  /* ---------- "Baren har lukket" (paused/nede database) ---------- */
  // Ligner en fejl der skyldes at Supabase-projektet er paused/utilgængeligt
  // (5xx, netværk, eller paused). RLS-tomt ([] uden fejl) tæller IKKE som nede.
  function erNede(err) {
    if (!err) return false;
    var s = Number(err.status || err.statusCode || (err.originalError && err.originalError.status) || 0);
    if (s >= 500 || s === 0) return true;
    var m = ((err.message || '') + ' ' + (err.details || '') + ' ' + (err.name || '')).toLowerCase();
    return m.indexOf('fetch') >= 0 || m.indexOf('network') >= 0 ||
           m.indexOf('load failed') >= 0 || m.indexOf('paused') >= 0 ||
           m.indexOf('unavailable') >= 0;
  }

  // Fuldskærms-skilt à la B4: "Baren har lukket" + Prøv igen.
  function barLukket(besked) {
    if (document.getElementById('app-bar-lukket')) return;
    var o = document.createElement('div');
    o.id = 'app-bar-lukket';
    o.style.cssText =
      'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;' +
      'justify-content:center;padding:24px;background:var(--himmel,#f1f6f4);';
    var kort = document.createElement('div');
    kort.style.cssText =
      'max-width:360px;width:100%;text-align:center;background:var(--hvid,#fefdf9);' +
      'border:1px solid var(--linje,#dde6e1);border-radius:14px;padding:34px 24px;' +
      'box-shadow:0 12px 32px rgba(31,78,95,.16);';
    var ikon = el('div', null, '🍺');
    ikon.setAttribute('aria-hidden', 'true');
    ikon.style.cssText = 'font-size:46px;line-height:1;margin-bottom:10px;filter:grayscale(.35) opacity(.85)';
    var h = el('div', null, 'Baren har lukket');
    h.style.cssText = "font-family:'Yellowtail',cursive;font-size:40px;color:var(--hav,#1f4e5f);line-height:1.05;margin-bottom:12px";
    var p = el('p', null, besked || 'Forsamlingshuset blunder lige nu. Prøv igen om et øjeblik — Dørmanden vågner snart.');
    p.style.cssText = "font-family:'Barlow Semi Condensed',sans-serif;color:var(--tekst-svag,#54707e);font-size:15px;line-height:1.6;margin:0 0 22px";
    var b = el('button', 'knap', 'Prøv igen');
    b.type = 'button';
    b.addEventListener('click', function () { window.location.reload(); });
    kort.appendChild(ikon); kort.appendChild(h); kort.appendChild(p); kort.appendChild(b);
    o.appendChild(kort);
    document.body.appendChild(o);
  }

  // lille DOM-helper (samme som sidernes el())
  function el(tag, klasse, tekst) {
    var n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (tekst != null) n.textContent = tekst;
    return n;
  }

  /* ---------- opstart ---------- */
  // Rolle på body + topbar/nav. Kører efter login-guard (og evt. Supabase-
  // sessionstjek) er bestået.
  function _efterGuard(side) {
    // (c) rolle på body til .kun-minister-styring
    var sess = (window.Auth && window.Auth.current) ? window.Auth.current() : null;
    document.body.dataset.rolle = (sess && sess.rolle) ? sess.rolle : '';

    // (b) topbar + nav. Login/velkommen: ingen topbar — de står rent.
    if (side !== 'login' && side !== 'velkommen') {
      injicerTopbar();
      injicerNav(side);
      // Center-zonen: vis den indloggedes titel.
      if (sess && sess.memberId && window.DB && typeof window.DB.getMembers === 'function') {
        window.DB.getMembers().then(function (members) {
          var m = null;
          for (var i = 0; i < members.length; i++) {
            if (members[i].id === sess.memberId) { m = members[i]; break; }
          }
          var migEl = document.getElementById('topbar-mig');
          if (migEl && m) migEl.textContent = m.titel;
        }).catch(function () { /* topbar-titel er pynt — ignorér */ });
      }
    }
  }

  function start() {
    montérAutoCap();
    var side = document.body.getAttribute('data-side') || '';

    if (side === 'login') { _efterGuard(side); return; }

    // (a) profil-guard (sessionStorage). Redirecter til Dørmanden uden profil.
    if (window.Auth && typeof window.Auth.kraevLogin === 'function') {
      if (!window.Auth.kraevLogin()) return;
    }

    // (a2) Supabase: bekræft også en gyldig Auth-session — profilen i
    //      sessionStorage kan overleve sessionen (fx returnerende bruger).
    //      Ingen session → tilbage til Dørmanden (ellers tom app pga. RLS).
    if (window.CONFIG && window.CONFIG.BRUG_SUPABASE && typeof window.DB_sbClient === 'function') {
      var sb = window.DB_sbClient();
      sb.auth.getSession().then(function (res) {
        if (!res || !res.data || !res.data.session) {
          window.location.href = 'login.html';
          return;
        }
        // Er baren åben? Et let ping opdager paused/nede database.
        sb.from('members').select('id').limit(1).then(function (p) {
          if (p && p.error && erNede(p.error)) { barLukket(); return; }
          _efterGuard(side);
        }, function () { barLukket(); });
      }).catch(function () { window.location.href = 'login.html'; });
      return;
    }

    _efterGuard(side);
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
    barLukket: barLukket,
    erNede: erNede,
    FANER: FANER
  };
})();
