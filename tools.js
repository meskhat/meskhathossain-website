/* Student tools — everything stays in the visitor's browser (localStorage). */
(function(){
  const store = {
    get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } },
    set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
    del(k){ try { localStorage.removeItem(k); } catch(e){} }
  };
  const T = (tool, action) => { if (window.mhTrack) mhTrack('tool_use', {tool: tool, action: action}); };
  const once = {};
  const cad = n => 'CA$' + Math.round(n).toLocaleString('en-CA');
  const bdt = n => '৳' + Math.round(n).toLocaleString('en-IN');

  /* ===== 1. Budget calculator ===== */
  const form = document.getElementById('budgetForm');
  if (form){
    const KEY = 'mh_budget_v1', MIN_SINGLE = 23448;
    const monthlyKeys = ['rent','food','transit','utilities','phone','insurance','other'];
    const saved = store.get(KEY, {});
    Object.entries(saved).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v; });
    const num = k => Math.max(0, parseFloat(form.elements[k].value) || 0);
    function calc(){
      const monthly = monthlyKeys.reduce((s,k) => s + num(k), 0);
      const yearly = monthly * 12, tuition = num('tuition'), total = yearly + tuition, rate = num('rate');
      document.getElementById('rMonthly').textContent = cad(monthly);
      document.getElementById('rYearly').textContent = cad(yearly);
      document.getElementById('rTuition').textContent = cad(tuition);
      document.getElementById('rTotal').textContent = cad(total);
      document.getElementById('rTotalBdt').textContent = rate ? '≈ ' + bdt(total * rate) + ' at ' + rate + ' BDT/CAD' : '';
      const c = document.getElementById('cmpText'), box = document.getElementById('irccCompare');
      box.classList.remove('ok','low');
      if (!monthly) c.textContent = 'Fill in your monthly costs to compare.';
      else if (yearly >= MIN_SINGLE){ c.textContent = 'Your yearly living estimate (' + cad(yearly) + ') is at or above the IRCC minimum for one person.'; box.classList.add('ok'); }
      else { c.textContent = 'Your yearly living estimate (' + cad(yearly) + ') is below the IRCC minimum. For a single applicant you still need to show at least ' + cad(MIN_SINGLE) + ' for living costs.'; box.classList.add('low'); }
      const data = {}; [...monthlyKeys,'tuition','rate'].forEach(k => { if (form.elements[k].value) data[k] = form.elements[k].value; });
      store.set(KEY, data);
    }
    form.addEventListener('input', () => { calc(); if (!once.b){ once.b = 1; T('budget_calculator','start'); } });
    form.addEventListener('reset', () => setTimeout(() => { store.del(KEY); document.getElementById('rateInfo').textContent = 'Enter your own rate, or load the latest rate from a public exchange-rate service.'; calc(); }, 0));
    document.getElementById('getRate').addEventListener('click', async e => {
      const btn = e.currentTarget, info = document.getElementById('rateInfo');
      btn.disabled = true; btn.textContent = 'Loading…';
      try {
        const r = await fetch('https://open.er-api.com/v6/latest/CAD'); const j = await r.json();
        if (j.result !== 'success' || !j.rates || !j.rates.BDT) throw new Error('no rate');
        form.elements.rate.value = j.rates.BDT.toFixed(2); T('budget_calculator','live_rate');
        const when = new Date(j.time_last_update_utc);
        info.innerHTML = 'Live rate: 1 CAD = ' + j.rates.BDT.toFixed(2) + ' BDT · source: <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a> · updated ' + when.toLocaleString('en-CA', {dateStyle:'medium', timeStyle:'short'}) + ' (local time). Banks and transfer services use their own rates.';
        calc();
      } catch(err){ info.textContent = 'Couldn\'t load a live rate right now. Please enter a rate yourself.'; }
      btn.disabled = false; btn.textContent = 'Use live rate';
    });
    calc();
  }

  /* ===== 2. Document checklist ===== */
  const list = document.getElementById('clList');
  if (list){
    const KEY = 'mh_checklist_v1';
    const GROUPS = [
      {t:'Required documents', items:[
        ['loa','Letter of acceptance from a Designated Learning Institution (DLI)'],
        ['pal','Provincial or territorial attestation letter (PAL/TAL), needed in most cases'],
        ['passport','Valid passport (information page) for you and any family coming with you'],
        ['photos','Recent passport-size photos'],
        ['funds','Proof of funds: tuition + living costs + travel']
      ]},
      {t:'Recommended & situational', items:[
        ['loe','Letter of explanation: why this program, why Canada'],
        ['medical','Medical exam, if it applies to you'],
        ['police','Police certificate, if requested'],
        ['custodian','Custodian documents, if you are under 17'],
        ['visaoffice','Extra documents from your local visa office instructions']
      ]},
      {t:'Before you apply', items:[
        ['dli','Confirmed your school is on the DLI list'],
        ['english','English test results that meet your program\'s requirements'],
        ['copies','Scanned copies of every document saved in the cloud'],
        ['account','IRCC secure account ready for your online application']
      ]}
    ];
    const state = store.get(KEY, {});
    list.innerHTML = GROUPS.map(g => `<div class="cl-group"><h3>${g.t}</h3>${g.items.map(([id,txt]) =>
      `<label class="cl-item"><input type="checkbox" data-id="${id}" ${state[id] ? 'checked' : ''}><span class="box" aria-hidden="true"></span><span>${txt}</span></label>`).join('')}</div>`).join('');
    const total = GROUPS.reduce((s,g) => s + g.items.length, 0);
    function update(){
      const done = [...list.querySelectorAll('input:checked')].length, pct = Math.round(done / total * 100);
      document.getElementById('clBar').style.width = pct + '%';
      document.getElementById('clPct').textContent = pct + '% · ' + done + '/' + total;
    }
    list.addEventListener('change', e => { if (e.target.dataset.id){ if (!once.c){ once.c = 1; T('document_checklist','tick'); } state[e.target.dataset.id] = e.target.checked; store.set(KEY, state); update(); } });
    document.getElementById('clReset').addEventListener('click', () => { list.querySelectorAll('input').forEach(i => i.checked = false); Object.keys(state).forEach(k => delete state[k]); store.del(KEY); update(); });
    document.getElementById('clPrint').addEventListener('click', () => { T('document_checklist','print'); document.body.classList.add('print-checklist'); window.print(); setTimeout(() => document.body.classList.remove('print-checklist'), 500); });
    update();
  }

  /* ===== 3. Planning timeline ===== */
  const tl = document.getElementById('tlList');
  if (tl){
    const KEY = 'mh_timeline_v1';
    const STEPS = [
      ['research','Research programs and schools', 12],
      ['requirements','Check admission requirements', 11],
      ['english','Book and take your English test', 10],
      ['documents','Gather academic documents', 9],
      ['apply','Apply to schools', 8],
      ['offers','Review offers and accept one', 6],
      ['funds','Prepare financial documents', 5],
      ['permit','Apply for your study permit', 4],
      ['travel','Book travel and prepare to arrive', 1]
    ];
    const st = store.get(KEY, {start:'', dates:{}, done:{}});
    const startInput = document.getElementById('tlStart');
    startInput.value = st.start || '';
    const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {year:'numeric', month:'short', day:'numeric'});
    function render(){
      const today = new Date(); today.setHours(0,0,0,0);
      tl.innerHTML = STEPS.map(([id, label], i) => {
        const d = st.dates[id] || '', done = !!st.done[id];
        let tag = '';
        if (d && !done){
          const days = Math.round((new Date(d + 'T00:00:00') - today) / 86400000);
          tag = days < 0 ? `<span class="tl-tag late">${-days} days overdue</span>` : `<span class="tl-tag">${days} days left</span>`;
        }
        if (done) tag = '<span class="tl-tag ok">Done</span>';
        return `<li class="tl-item${done ? ' is-done' : ''}">
          <span class="tl-dot">${i + 1}</span>
          <div class="tl-body"><b>${label}</b>${d ? `<small>Target: ${fmtDate(d)}</small>` : '<small>No date set</small>'}</div>
          <div class="tl-ctrl">${tag}<input type="date" aria-label="Target date for ${label}" data-date="${id}" value="${d}"><label class="tl-done"><input type="checkbox" data-done="${id}" ${done ? 'checked' : ''}> Done</label></div>
        </li>`;
      }).join('');
    }
    tl.addEventListener('change', e => {
      if (e.target.dataset.date){ st.dates[e.target.dataset.date] = e.target.value; }
      if (e.target.dataset.done){ st.done[e.target.dataset.done] = e.target.checked; }
      store.set(KEY, st); render();
    });
    startInput.addEventListener('change', () => { st.start = startInput.value; store.set(KEY, st); });
    document.getElementById('tlSuggest').addEventListener('click', () => {
      if (!startInput.value){ startInput.focus(); startInput.reportValidity && startInput.setCustomValidity('Choose your start month first'); startInput.reportValidity(); startInput.setCustomValidity(''); return; }
      const [y, m] = startInput.value.split('-').map(Number);
      STEPS.forEach(([id,, monthsBefore]) => {
        const d = new Date(y, m - 1 - monthsBefore, 1);
        st.dates[id] = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-01';
      });
      st.start = startInput.value; store.set(KEY, st); render(); T('planning_timeline','suggest_dates');
    });
    document.getElementById('tlReset').addEventListener('click', () => { st.start=''; st.dates={}; st.done={}; startInput.value=''; store.del(KEY); render(); });
    render();
  }
})();
