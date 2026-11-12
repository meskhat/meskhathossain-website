/* Find My Professor — loads supervisors-<province>.json (built from OpenAlex) and filters in the browser. */
(function(){
  const PAGE = 24;
  const DLI = { "Dalhousie":"O19209939282", "Saint Mary's":"O19021279692", "Acadia":"O19391556792", "StFX":"O19391556899", "Cape Breton":"O19391556824", "Mount Saint Vincent":"O19301947442" };
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = u => {
    u = u || '';
    if (u.startsWith('doi:')) return 'https://doi.org/' + u.slice(4);
    if (u.startsWith('oa:')) return 'https://openalex.org/' + u.slice(3);
    return /^https:\/\//.test(u) ? u : '#';
  };
  let data = null, people = [], shown = PAGE, uniBy = {};

  function load(code){
    $('svCount').textContent = 'Loading researchers…';
    fetch('supervisors-' + code + '.json?v=20261112f').then(r => r.json()).then(d => {
      data = d; people = d.people;
      uniBy = Object.fromEntries(d.universities.map(u => [u.short, u]));
      $('mPeople').textContent = people.length.toLocaleString();
      $('mUnis').textContent = d.universities.length;
      $('mDate').textContent = new Date(d.generated + 'T00:00:00').toLocaleDateString('en-CA', {month:'short', year:'numeric'});
      $('fUni').innerHTML = '<option value="">All universities</option>' + d.universities.map(u => `<option value="${esc(u.short)}">${esc(u.name)} (${people.filter(p => p.uni === u.short).length})</option>`).join('');
      const fields = {}; people.forEach(p => fields[p.field] = (fields[p.field] || 0) + 1);
      $('fField').innerHTML = '<option value="">All fields</option>' + Object.entries(fields).sort((a,b) => b[1]-a[1]).map(([f,n]) => `<option value="${esc(f)}">${esc(f)} (${n})</option>`).join('');
      const params = new URLSearchParams(location.search);
      if (params.get('q')) $('fQ').value = params.get('q');
      if (params.get('uni')) $('fUni').value = params.get('uni');
      if (params.get('field')) $('fField').value = params.get('field');
      render();
    }).catch(() => { $('svCount').textContent = 'Could not load the researcher list. Please refresh the page.'; });
  }

  function matches(){
    const uni = $('fUni').value, field = $('fField').value;
    const words = $('fQ').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = people.filter(p => {
      if (uni && p.uni !== uni) return false;
      if (field && p.field !== field) return false;
      if (!words.length) return true;
      const hay = (p.name + ' ' + p.topics.join(' ') + ' ' + (p.sub || []).join(' ') + ' ' + p.field + ' ' + p.recent.map(r => r.t).join(' ')).toLowerCase();
      return words.every(w => hay.includes(w));
    });
    const s = $('fSort').value;
    list.sort(s === 'cites' ? (a,b) => b.cites - a.cites : s === 'name' ? (a,b) => a.name.localeCompare(b.name) : (a,b) => b.rc - a.rc || b.cites - a.cites);
    return list;
  }

  function card(p){
    const u = uniBy[p.uni] || {};
    const official = 'https://www.google.com/search?q=' + encodeURIComponent('"' + p.name + '" site:' + u.site);
    const scholar = 'https://scholar.google.com/citations?view_op=search_authors&mauthors=' + encodeURIComponent(p.name + ' ' + (u.name || ''));
    return `<article class="sv-card">
      <div class="sv-top">
        <div><h3>${esc(p.name)}</h3><p class="sv-uni">${esc(u.name || p.uni)} · <span>${esc(p.field)}</span></p></div>
        <span class="sv-active" title="Papers at this university in the last 3 years">${p.rc} recent papers</span>
      </div>
      <div class="sv-topics">${p.topics.slice(0,4).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <details class="sv-recent"><summary>Recent research (${p.recent.length})</summary><ul>${p.recent.map(r => `<li><a href="${esc(safeUrl(r.u))}" target="_blank" rel="noopener">${esc(r.t)}</a> <em>${esc(r.y)}</em></li>`).join('')}</ul></details>
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
    const uni = $('fUni').value;
    $('svCount').innerHTML = `<b>${list.length.toLocaleString()}</b> researcher${list.length === 1 ? '' : 's'} found` + (uni && DLI[uni] ? ` · DLI number ${DLI[uni]}` : '');
    $('svList').innerHTML = list.slice(0, shown).map(card).join('');
    $('svMore').hidden = list.length <= shown;
    $('svEmpty').hidden = list.length > 0;
  }

  let t;
  const reset = () => { shown = PAGE; render(); };
  ['fUni','fField','fSort'].forEach(id => $(id).addEventListener('change', () => { reset(); if (window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'filter_' + id.slice(1).toLowerCase()}); }));
  $('fQ').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { reset(); const q = $('fQ').value.trim(); if (q.length > 2 && window.mhTrack) mhTrack('search', {search_term: q.slice(0,60), area:'supervisors'}); }, 250); });
  $('svMore').addEventListener('click', () => { shown += PAGE; render(); });
  $('svList').addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a && window.mhTrack) mhTrack('tool_use', {tool:'supervisor_finder', action:'open_' + a.dataset.act}); });
  load($('fProv').value);
})();
