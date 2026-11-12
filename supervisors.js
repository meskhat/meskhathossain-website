/* Find My Professor — loads supervisors-index.json, then per-university files (sv-*.json) for the chosen province.
   Data: OpenAlex (CC0). Recent papers load live from OpenAlex when a card is opened. No emails are stored. */
(function(){
  const PAGE = 24, V = '20261112j';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = u => {
    u = u || '';
    if (u.startsWith('doi:')) return 'https://doi.org/' + u.slice(4);
    if (u.startsWith('oa:')) return 'https://openalex.org/' + u.slice(3);
    return /^https:\/\//.test(u) ? u : '#';
  };
  let index = null, people = [], shown = PAGE, uniBy = {}, cache = {}, loadToken = 0;

  fetch('supervisors-index.json?v=' + V).then(r => r.json()).then(d => {
    index = d;
    const provs = d.provinces.filter(p => p.universities.some(u => u.file && u.count));
    let total = 0, unis = 0;
    provs.forEach(p => p.universities.forEach(u => { if (u.file && u.count){ total += u.count; unis++; } }));
    $('mPeople').textContent = total.toLocaleString();
    $('mUnis').textContent = unis;
    $('mDate').textContent = new Date(d.generated + 'T00:00:00').toLocaleDateString('en-CA', {month:'short', year:'numeric'});
    const params = new URLSearchParams(location.search);
    const want = params.get('province') || 'Nova Scotia';
    $('fProv').innerHTML = provs.map(p => {
      const n = p.universities.reduce((s,u) => s + (u.count || 0), 0);
      return `<option value="${esc(p.name)}"${p.name === want ? ' selected' : ''}>${esc(p.name)} (${n.toLocaleString()})</option>`;
    }).join('');
    if (params.get('q')) $('fQ').value = params.get('q');
    loadProvince($('fProv').value, params.get('uni'), params.get('field'));
  }).catch(() => { $('svCount').textContent = 'Could not load the researcher list. Please refresh the page.'; });

  const BIG = 12000; // provinces larger than this load one university at a time
  let curProv = null;
  function fetchUni(u){
    if (cache[u.file]) return Promise.resolve(cache[u.file]);
    return fetch(u.file + '?v=' + V).then(r => r.json()).then(j => (cache[u.file] = j.people.filter(p => p.rc <= 1000).map(p => (p.uni = u.short, p.topics = p.topics || [], p)))).catch(() => []);
  }
  function loadProvince(name, wantUni, wantField){
    const prov = index.provinces.find(p => p.name === name);
    curProv = prov;
    const unis = prov.universities.filter(u => u.file && u.count);
    const total = unis.reduce((s,u) => s + u.count, 0);
    uniBy = {}; prov.universities.forEach(u => uniBy[u.short] = u);
    $('fUni').innerHTML = '<option value="">All universities in ' + esc(name) + (total > BIG ? ' (large: may take a moment)' : '') + '</option>' + unis.map(u => `<option value="${esc(u.short)}">${esc(u.name)} (${u.count.toLocaleString()})</option>`).join('');
    if (wantUni && unis.some(u => u.short === wantUni)) $('fUni').value = wantUni;
    else if (total > BIG) $('fUni').value = unis[0].short;   // big province: start with its largest university
    loadScope(wantField);
  }
  function loadScope(wantField){
    const unis = curProv.universities.filter(u => u.file && u.count);
    const pick = $('fUni').value;
    const scope = pick ? unis.filter(u => u.short === pick) : unis;
    $('svCount').textContent = 'Loading researchers…';
    $('svList').innerHTML = '';
    const token = ++loadToken;
    Promise.all(scope.map(fetchUni))
    .then(lists => {
      if (token !== loadToken) return;
      people = lists.flat();
      const keep = wantField || $('fField').value;
      const fields = {}; people.forEach(p => fields[p.field] = (fields[p.field] || 0) + 1);
      $('fField').innerHTML = '<option value="">All fields</option>' + Object.entries(fields).sort((a,b) => b[1]-a[1]).map(([f,n]) => `<option value="${esc(f)}">${esc(f)} (${n.toLocaleString()})</option>`).join('');
      if (keep && fields[keep]) $('fField').value = keep;
      shown = PAGE; render();
    });
  }

  function matches(){
    const uni = $('fUni').value, field = $('fField').value;
    const words = $('fQ').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = people.filter(p => {
      if (uni && p.uni !== uni) return false;
      if (field && p.field !== field) return false;
      if (!words.length) return true;
      const hay = (p.name + ' ' + p.topics.join(' ') + ' ' + p.field + ' ' + (p.recent || []).map(r => r.t).join(' ')).toLowerCase();
      return words.every(w => hay.includes(w));
    });
    const s = $('fSort').value;
    list.sort(s === 'cites' ? (a,b) => b.cites - a.cites : s === 'name' ? (a,b) => a.name.localeCompare(b.name) : (a,b) => Math.min(b.rc, 30) - Math.min(a.rc, 30) || b.cites - a.cites);
    return list;
  }

  function recentHtml(list){
    return list.length ? '<ul>' + list.map(r => `<li><a href="${esc(safeUrl(r.u))}" target="_blank" rel="noopener">${esc(r.t)}</a> <em>${esc(r.y)}</em></li>`).join('') + '</ul>' : '<p class="sv-loading">No recent papers found.</p>';
  }

  function card(p){
    const u = uniBy[p.uni] || {};
    const official = 'https://www.google.com/search?q=' + encodeURIComponent('"' + p.name + '" site:' + u.site);
    const scholar = 'https://scholar.google.com/citations?view_op=search_authors&mauthors=' + encodeURIComponent(p.name + ' ' + (u.name || ''));
    const pre = (p.recent && p.recent.length) ? recentHtml(p.recent) : '<p class="sv-loading">Loading recent papers…</p>';
    return `<article class="sv-card">
      <div class="sv-top">
        <div><h3>${esc(p.name)}</h3><p class="sv-uni">${esc(u.name || p.uni)} · <span>${esc(p.field)}</span></p></div>
        <span class="sv-active" title="Publications in the last 3 years">${p.rc > 100 ? '100+' : p.rc} recent papers</span>
      </div>
      <div class="sv-topics">${p.topics.slice(0,4).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <details class="sv-recent" data-id="${esc(p.id)}"${p.recent && p.recent.length ? ' data-loaded="1"' : ''}><summary>Recent research</summary>${pre}</details>
      <div class="sv-links">
        <a class="btn btn-solid sv-btn" href="${esc(official)}" target="_blank" rel="noopener" data-act="official">Official profile &amp; email ↗</a>
        <a href="${esc(scholar)}" target="_blank" rel="noopener" data-act="scholar">Google Scholar</a>
        ${p.orcid ? `<a href="https://orcid.org/${esc(p.orcid)}" target="_blank" rel="noopener" data-act="orcid">ORCID</a>` : ''}
        <a href="https://openalex.org/${esc(p.id)}" target="_blank" rel="noopener" data-act="openalex">All papers</a>
      </div>
      <p class="sv-meta">${p.works.toLocaleString()} publications · ${p.cites.toLocaleString()} citations${p.h ? ' · h-index ' + p.h : ''}</p>
    </article>`;
  }

  function render(){
    const list = matches();
    const uni = $('fUni').value, u = uniBy[uni];
    $('svCount').innerHTML = `<b>${list.length.toLocaleString()}</b> researcher${list.length === 1 ? '' : 's'} found` + (u && u.dli ? ` · DLI number ${esc(u.dli)}` : '');
    $('svList').innerHTML = list.slice(0, shown).map(card).join('');
    $('svMore').hidden = list.length <= shown;
    $('svEmpty').hidden = list.length > 0;
  }

  /* recent papers on demand */
  $('svList').addEventListener('toggle', e => {
    const d = e.target;
    if (!d.matches || !d.matches('details.sv-recent') || !d.open || d.dataset.loaded) return;
    d.dataset.loaded = '1';
    const since = (new Date().getFullYear() - 3) + '-01-01';
    fetch('https://api.openalex.org/works?filter=author.id:' + encodeURIComponent(d.dataset.id) + ',from_publication_date:' + since + '&sort=publication_date:desc&per_page=3&select=id,title,publication_year,doi')
      .then(r => r.json()).then(j => {
        const list = (j.results || []).filter(w => w.title).map(w => ({t: w.title.slice(0,160), y: w.publication_year, u: w.doi || w.id}));
        d.querySelector('.sv-loading, ul') && d.querySelector('.sv-loading, ul').remove();
        d.insertAdjacentHTML('beforeend', recentHtml(list));
      }).catch(() => { const l = d.querySelector('.sv-loading'); if (l) l.innerHTML = 'Couldn\'t load papers right now. <a href="https://openalex.org/' + esc(d.dataset.id) + '" target="_blank" rel="noopener">See all papers ↗</a>'; });
    if (window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'open_recent'});
  }, true);

  let t;
  const reset = () => { shown = PAGE; render(); };
  $('fProv').addEventListener('change', () => { loadProvince($('fProv').value); if (window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'filter_province'}); });
  $('fUni').addEventListener('change', () => { loadScope(); if (window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'filter_uni'}); });
  ['fField','fSort'].forEach(id => $(id).addEventListener('change', () => { reset(); if (window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'filter_' + id.slice(1).toLowerCase()}); }));
  $('fQ').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { reset(); const q = $('fQ').value.trim(); if (q.length > 2 && window.mhTrack) mhTrack('search', {search_term: q.slice(0,60), area:'supervisors'}); }, 250); });
  $('svMore').addEventListener('click', () => { shown += PAGE; render(); });
  $('svList').addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'open_' + a.dataset.act}); });
})();
