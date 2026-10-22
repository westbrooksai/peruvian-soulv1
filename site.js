/* =========================================================
   Peruvian Soul — shared site script (every page)
   - Force HTTPS (fallback; the server config does this properly)
   - Cookie consent banner + preferences
   - Consent-gated Google Map
   - Email links assembled in the browser so scrapers can't harvest them
   ========================================================= */

/* ---------- Force HTTPS ---------- */
(() => {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (location.protocol === 'http:' && !local) {
    location.replace('https://' + location.host + location.pathname + location.search + location.hash);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'ps-consent-v1';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  };
  // Global Privacy Control: a browser-level "do not sell/share" signal. Marketing stays off when it's set.
  const gpc = navigator.globalPrivacyControl === true;
  const write = prefs => {
    const value = { necessary: true, maps: !!prefs.maps, analytics: !!prefs.analytics, marketing: !!prefs.marketing && !gpc, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* storage blocked: consent lasts this visit only */ }
    // Withdrawing consent can't unload code that already ran, so reload to start clean
    const withdrawn = current && ['maps', 'analytics', 'marketing'].some(k => current[k] && !value[k]);
    current = value;
    if (withdrawn) { location.reload(); return; }
    apply(value);
  };
  let current = read();

  /* ---------- Things that depend on consent ---------- */
  const loadMaps = () => {
    document.querySelectorAll('[data-map-src]').forEach(box => {
      if (box.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.src = box.dataset.mapSrc;
      iframe.title = box.dataset.mapTitle || 'Map';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      box.querySelector('.map__gate')?.remove();
      box.appendChild(iframe);
    });
  };

  /* Consent gate for analytics, pixels and any other third-party code.
     Nothing in these categories may load before the visitor allows it. Add trackers ONLY in this form:
       <script type="text/plain" data-consent="analytics" data-src="https://provider.example/script.js"></script>
       <img data-consent="marketing" data-src="https://pixel.example/p.gif" alt="" width="1" height="1" hidden>
     type="text/plain" stops the browser from running the script until consent swaps it for a real one.
     The security policy also blocks every third-party script, so each provider's domain must be added to it
     (in every page and in _headers/.htaccess), and inline setup code must live in a local .js file. */
  const activate = prefs => {
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(held => {
      if (!prefs[held.dataset.consent]) return;
      const live = document.createElement('script');
      [...held.attributes].forEach(a => {
        if (a.name === 'type' || a.name === 'data-consent') return;
        live.setAttribute(a.name === 'data-src' ? 'src' : a.name, a.value);
      });
      held.replaceWith(live);
    });
    document.querySelectorAll('img[data-consent][data-src], iframe[data-consent][data-src]').forEach(el => {
      if (!prefs[el.dataset.consent]) return;
      el.src = el.dataset.src;
      el.removeAttribute('data-src');
    });
  };

  const apply = prefs => {
    if (!prefs) return;
    if (prefs.maps) loadMaps();
    activate(prefs);
  };

  /* ---------- Banner ---------- */
  const banner = document.createElement('section');
  banner.className = 'cookie';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.hidden = true;
  banner.innerHTML = `
    <div class="cookie__body">
      <h2 class="cookie__title">We value your privacy</h2>
      <p>We use essential storage to make this site work. With your permission we'd also load Google Maps and,
        in future, privacy-friendly analytics, which may set cookies. You can change your choice at any time
        under “Cookie Settings” at the bottom of the page. <a href="privacy.html#cookies">Read our Privacy Policy</a>.</p>
      <form class="cookie__prefs" hidden>
        <fieldset>
          <legend class="sr-only">Cookie categories</legend>
          <label class="cookie__opt"><input type="checkbox" checked disabled> <span><strong>Essential</strong> Remembers your cookie choice. Always on.</span></label>
          <label class="cookie__opt"><input type="checkbox" name="maps"> <span><strong>Maps</strong> Embedded Google Map on the Visit section.</span></label>
          <label class="cookie__opt"><input type="checkbox" name="analytics"> <span><strong>Analytics</strong> Anonymous visit statistics to improve the site.</span></label>
          <label class="cookie__opt"><input type="checkbox" name="marketing"> <span><strong>Marketing</strong> Measures our social media ads.</span></label>
        </fieldset>
      </form>
    </div>
    <div class="cookie__actions">
      <button type="button" class="btn btn--ghost btn--sm" data-c="reject">Reject non-essential</button>
      <button type="button" class="btn btn--ghost btn--sm" data-c="prefs" aria-expanded="false">Customize</button>
      <button type="button" class="btn btn--ghost btn--sm" data-c="save" hidden>Save choices</button>
      <button type="button" class="btn btn--gold btn--sm" data-c="accept">Accept all</button>
    </div>`;
  document.body.appendChild(banner);

  const prefsForm = banner.querySelector('.cookie__prefs');
  const btn = name => banner.querySelector(`[data-c="${name}"]`);
  let returnFocus = null;

  const open = (withPrefs = false) => {
    returnFocus = document.activeElement;
    const p = current || {};
    ['maps', 'analytics', 'marketing'].forEach(n => { prefsForm.elements[n].checked = !!p[n]; });
    showPrefs(withPrefs);
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('is-open'));
    if (withPrefs) prefsForm.querySelector('input[name="maps"]').focus();
  };
  const close = () => {
    banner.classList.remove('is-open');
    banner.hidden = true;
    if (returnFocus && document.body.contains(returnFocus)) returnFocus.focus();
  };
  const showPrefs = on => {
    prefsForm.hidden = !on;
    btn('save').hidden = !on;
    btn('prefs').hidden = on;
    btn('prefs').setAttribute('aria-expanded', on);
  };

  btn('accept').addEventListener('click', () => { write({ maps: true, analytics: true, marketing: true }); close(); });
  btn('reject').addEventListener('click', () => { write({}); close(); });
  btn('prefs').addEventListener('click', () => { showPrefs(true); prefsForm.querySelector('input[name="maps"]').focus(); });
  btn('save').addEventListener('click', () => {
    const f = prefsForm.elements;
    write({ maps: f.maps.checked, analytics: f.analytics.checked, marketing: f.marketing.checked });
    close();
  });
  banner.addEventListener('keydown', e => { if (e.key === 'Escape' && current) close(); });

  document.querySelectorAll('[data-cookie-settings]').forEach(b => b.addEventListener('click', () => open(true)));

  // Map "Load map" button counts as consent for maps only
  document.querySelectorAll('.map__load').forEach(b => b.addEventListener('click', () => {
    write({ ...(current || {}), maps: true });
    close();
  }));

  if (current) apply(current); else open(false);

  /* ---------- Email obfuscation ---------- */
  document.querySelectorAll('.js-email').forEach(el => {
    const addr = `${el.dataset.user}@${el.dataset.domain}`;
    const a = document.createElement('a');
    a.href = 'mailto:' + addr;
    a.textContent = addr;
    el.replaceWith(a);
  });
});
