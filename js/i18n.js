/* Simple client-side i18n loader
   - Loads /i18n/{lang}.json
   - Applies translations to elements with `data-i18n` attributes
   - Stores choice in localStorage and supports ?lang= in URL
   - Exposes window.i18nToggle() to switch languages
   - Supports German (de), English (en), and Chinese (zh)
*/
(function(){
  const DEFAULT = 'de';
  const LANGS = ['de', 'en', 'zh'];
  const LANG_EMOJIS = {de: '🇩🇪', en: '🇬🇧', zh: '🇨🇳'};
  function getLangFromUrl(){ const p = new URLSearchParams(window.location.search).get('lang'); return p; }
  function getSavedLang(){ return localStorage.getItem('site_lang'); }
  function setSavedLang(l){ localStorage.setItem('site_lang', l); }
  async function loadTranslations(lang){
    const relPath = 'i18n/' + lang + '.json';
    const absPath = '/i18n/' + lang + '.json';
    try{
      // try relative path first (works when site is hosted under a subpath)
      let res = await fetch(relPath);
      if(!res.ok) {
        // fallback to absolute path
        res = await fetch(absPath);
      }
      if(!res.ok) throw new Error('no translation');
      return await res.json();
    } catch(e){
      console.error('i18n: failed to load', lang, e);
      if(lang !== DEFAULT) return loadTranslations(DEFAULT);
      return {};
    }
  }
  function applyTranslations(dict, currentLang){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(!key) return;
      const val = dict[key];
      if(typeof val === 'string'){
        el.innerHTML = val;
      }
    });
    // update lang button styling: highlight the current language flag
    const flags = document.querySelectorAll('.lang-flag');
    const active = (currentLang || (localStorage.getItem('site_lang') || DEFAULT));
    flags.forEach(flag => {
      const lang = flag.getAttribute('data-lang');
      if(lang === active){
        flag.style.opacity = '1';
        flag.style.fontWeight = 'bold';
      } else {
        flag.style.opacity = '0.5';
        flag.style.fontWeight = 'normal';
      }
    });
    // Apply translated iframe sizing (optional per-language override)
    try{
      var rsvpHeight = dict && (dict['rsvp_form_height'] || dict['rsvp_form_height'] === 0 ? dict['rsvp_form_height'] : null);
      if(rsvpHeight){
        var iframe = document.getElementById('rsvp-iframe');
        if(iframe){
          iframe.setAttribute('height', String(rsvpHeight));
        }
      }
    }catch(e){ /* no-op */ }
    // debug banner removed: inline iframe-switcher handles RSVP and we avoid on-screen debug elements
  }
  async function setLang(lang){
    // validate lang against supported languages
    const normalized = LANGS.includes(lang) ? lang : DEFAULT;
    const dict = await loadTranslations(normalized);
    applyTranslations(dict, normalized);
    setSavedLang(normalized);
    document.documentElement.lang = normalized;
    // update URL param without reload
    try{
      const url = new URL(window.location);
      url.searchParams.set('lang', normalized);
      history.replaceState({}, '', url);
    }catch(e){}
  }
  window.i18nToggle = async function(){
    const cur = getSavedLang() || getLangFromUrl() || DEFAULT;
    const currentIdx = LANGS.indexOf(cur);
    const nextIdx = (currentIdx + 1) % LANGS.length;
    const next = LANGS[nextIdx];
    await setLang(next);
  };
  window.i18nSetLang = async function(lang){
    await setLang(lang);
  };
  // init when DOM is ready
  document.addEventListener('DOMContentLoaded', async function(){
    const param = getLangFromUrl();
    const saved = getSavedLang();
    let lang = param || saved || DEFAULT;
    // normalize to valid language
    if(!LANGS.includes(lang)) lang = DEFAULT;
    await setLang(lang);
  });
})();
