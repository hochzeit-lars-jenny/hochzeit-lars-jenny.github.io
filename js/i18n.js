/* Simple client-side i18n loader
   - Loads /i18n/{lang}.json
   - Applies translations to elements with `data-i18n` attributes
   - Stores choice in localStorage and supports ?lang= in URL
   - Exposes window.i18nToggle() to switch languages
*/
(function(){
  const DEFAULT = 'en';
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
    // update lang button label if present
    const btn = document.getElementById('lang-btn');
    if(btn){
      const cur = currentLang || (localStorage.getItem('site_lang') || DEFAULT);
      // show the language that will be switched TO (so button indicates action)
      btn.innerText = cur === 'en' ? (dict['lang_button_de'] || 'DE') : (dict['lang_button_en'] || 'EN');
    }
  }
  async function setLang(lang){
    const normalized = (lang === 'de') ? 'de' : 'en';
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
    const cur = getSavedLang() || getLangFromUrl() || (navigator.language||'en').slice(0,2) || DEFAULT;
    const next = cur === 'en' ? 'de' : 'en';
    await setLang(next);
  };
  // init when DOM is ready
  document.addEventListener('DOMContentLoaded', async function(){
    const param = getLangFromUrl();
    const saved = getSavedLang();
    let lang = param || saved || (navigator.language||'en').slice(0,2);
    lang = (lang === 'de') ? 'de' : 'en';
    await setLang(lang);
  });
})();
