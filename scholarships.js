/* Find My Scholarship: loads scholarships.json and renders searchable, filterable scholarship cards.
   Data is checked by hand on official university pages; see meskhathossain-website-src/build_scholarships.py. */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rich = s => esc(s).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');   // allow <b> from our own data only
  const LEVEL = {bachelor:"Bachelor's", master:"Master's", phd:'PhD'};
  const TYPE = {auto:['Automatic','No extra form: you are considered when you apply for admission'], apply:['Application','Needs its own application or nomination'], check:['Check eligibility','The official page doesn’t clearly say international students qualify; confirm first']};
  const PAGE = 18;
  let D = null, shown = PAGE;

  fetch('scholarships.json?v=20261113e').then(r => r.json()).then(d => {
    D = d;
    const p = new URLSearchParams(location.search);
    if (p.get('level') && LEVEL[p.get('level')]) $('sLevel').value = p.get('level');
    if (p.get('q')) $('sQ').value = p.get('q');
    if (p.get('type')) $('sType').value = p.get('type');
    fillUnis(p.get('uni'));
    syncTabs(); render();
  }).catch(() => { $('sCount').textContent = 'Could not load scholarships. Please refresh the page.'; });

  function fillUnis(want){
    const lv = $('sLevel').value, cur = want || $('sUni').value;
    const names = [...new Set(D.items.filter(i => !lv || i.level === lv).map(i => i.uni))].sort();
    $('sUni').innerHTML = '<option value="">All universities</option>' + names.map(n => `<option${n === cur ? ' selected' : ''}>${esc(n)}</option>`).join('');
  }
  function syncTabs(){
    document.querySelectorAll('.sc-levels button').forEach(b => b.classList.toggle('on', b.dataset.level === $('sLevel').value));
  }

  function list(){
    const lv = $('sLevel').value, uni = $('sUni').value, ty = $('sType').value;
    const words = $('sQ').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const out = D.items.filter(i => {
      if (lv && i.level !== lv) return false;
      if (uni && i.uni !== uni) return false;
      if (ty && i.type !== ty) return false;
      if (!words.length) return true;
      const u = D.unis[i.uid];
      const hay = (i.name + ' ' + i.uni + ' ' + i.note + ' ' + i.value + ' ' + LEVEL[i.level] + ' ' + u.how + ' ' + u.city).toLowerCase();
      return words.every(w => hay.includes(w));
    });
    const s = $('sSort').value;
    const far = '9999-12-31';
    out.sort(s === 'dl' ? (a,b) => (a.dl || far).localeCompare(b.dl || far) || b.amt - a.amt
           : s === 'uni' ? (a,b) => a.uni.localeCompare(b.uni) || b.amt - a.amt
           : (a,b) => b.amt - a.amt || (a.dl || far).localeCompare(b.dl || far));
    return out;
  }

  function deadline(i){
    if (!i.dl) return i.deadline ? `<span class="sc-dl">${esc(i.deadline)}</span>` : '<span class="sc-dl">No fixed deadline</span>';
    const days = Math.ceil((new Date(i.dl + 'T23:59:00') - new Date()) / 864e5);
    if (days < 0) return `<span class="sc-dl closed">Closed: ${esc(i.deadline)}</span>`;
    const soon = days <= 45 ? ` <b>· ${days} day${days === 1 ? '' : 's'} left</b>` : '';
    return `<span class="sc-dl${days <= 45 ? ' soon' : ''}">Deadline ${esc(i.deadline)}${soon}</span>`;
  }

  function card(i){
    const u = D.unis[i.uid], t = TYPE[i.type];
    const btn = i.type === 'auto' ? 'Official page' : 'Apply on official site';
    const sup = i.level !== 'bachelor' ? '<a href="/find-my-professor.html" data-act="professor">Find a supervisor</a>' : '';
    return `<article class="sv-card sc-card">
      <div class="sv-top">
        <div><span class="sc-level ${i.level}">${LEVEL[i.level]}</span><h3>${esc(i.name)}</h3><p class="sv-uni">${esc(u.short)} · ${esc(u.city)}</p></div>
        <span class="sc-val${i.amt ? '' : ' none'}">${esc(i.value)}</span>
      </div>
      <p class="sc-note">${esc(i.note)}</p>
      <div class="sc-facts"><span class="sc-type ${i.type}" title="${esc(t[1])}">${t[0]}</span>${deadline(i)}</div>
      <details class="sv-recent"><summary>How it works at ${esc(u.short)}</summary><p class="sc-how">${rich(u.how)}</p>${u.no ? `<p class="sch-no">${esc(u.no)}</p>` : ''}</details>
      <div class="sv-links"><a class="btn btn-solid sv-btn" href="${esc(u.url)}" target="_blank" rel="noopener" data-act="apply">${btn} ↗</a>${sup}</div>
    </article>`;
  }

  function render(){
    const l = list(), uni = $('sUni').value, lv = $('sLevel').value;
    const total = l.reduce((s, i) => s + i.amt, 0);
    $('sCount').innerHTML = `<b>${l.length}</b> scholarship${l.length === 1 ? '' : 's'}` + (lv ? ` for ${LEVEL[lv]}` : '') + (uni ? ` at ${esc(uni)}` : ' in Nova Scotia');
    $('sList').innerHTML = l.slice(0, shown).map(card).join('') + (l.length > shown ? `<div class="center-cta" style="grid-column:1/-1"><button type="button" class="btn btn-outline" id="sMore">Show more scholarships</button></div>` : '');
    $('sEmpty').hidden = l.length > 0;
    // university summary panel
    const info = $('sUniInfo');
    if (uni){
      const blocks = Object.entries(D.unis).filter(([id, u]) => u.short === uni && D.items.some(i => i.uid === id && (!lv || i.level === lv)));
      info.innerHTML = blocks.map(([id, u]) => {
        const lvl = LEVEL[D.items.find(i => i.uid === id).level];
        return `<div><h3>${esc(u.short)}: ${lvl}</h3><p>${rich(u.how)}</p>${u.no ? `<p class="sch-no">${esc(u.no)}</p>` : ''}<a class="link-arrow" href="${esc(u.url)}" target="_blank" rel="noopener">Official scholarship page ↗</a></div>`;
      }).join('');
      info.hidden = !blocks.length;
    } else info.hidden = true;
    const qs = new URLSearchParams();
    if (lv) qs.set('level', lv); if (uni) qs.set('uni', uni); if ($('sType').value) qs.set('type', $('sType').value); if ($('sQ').value.trim()) qs.set('q', $('sQ').value.trim());
    history.replaceState(null, '', location.pathname + (qs.toString() ? '?' + qs : ''));
  }

  const track = (action, extra) => { if (window.mhTrack) mhTrack('tool_use', Object.assign({tool:'find_my_scholarship', action:action}, extra || {})); };
  const reset = () => { shown = PAGE; render(); };
  $('sLevel').addEventListener('change', () => { fillUnis(); syncTabs(); reset(); track('filter_level'); });
  document.querySelectorAll('.sc-levels button').forEach(b => b.addEventListener('click', () => { $('sLevel').value = b.dataset.level; fillUnis(); syncTabs(); reset(); track('tab_level'); }));
  ['sUni','sType','sSort'].forEach(id => $(id).addEventListener('change', () => { reset(); track('filter_' + id.slice(1).toLowerCase()); }));
  let t; $('sQ').addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { reset(); const q = $('sQ').value.trim(); if (q.length > 2 && window.mhTrack) mhTrack('search', {search_term:q.slice(0,60), area:'scholarships'}); }, 250); });
  $('sList').addEventListener('click', e => {
    if (e.target.id === 'sMore'){ shown += PAGE; render(); return; }
    const a = e.target.closest('[data-act]'); if (a) track('open_' + a.dataset.act);
  });
})();
