/* Meskhat Hossain — shared script */

/* ===== Follower counts: edit these numbers to update the whole site ===== */
const SOCIAL = {
  updated: "Nov 2026",
  youtube:   { count: 32100, handle: "@TheHumanChanger",  url: "https://www.youtube.com/@TheHumanChanger" },
  facebook:  { count: 32000, handle: "Meskhat Hossain",   url: "https://www.facebook.com/meskhat.hossain" },
  fbpage:    { count: 965,   handle: "Human Changer",     url: "https://www.facebook.com/Thehumanchanger" },
  instagram: { count: 0,     handle: "@meskhat_hossain",  url: "https://www.instagram.com/meskhat_hossain" } // set count when known
};
/* Lifetime video views (YouTube channel total from the channel's About panel) */
const VIEWS = { youtube: 1630314 };
/* Email signups go to a Google Form owned by Meskhat (responses tab in Google Forms) */
const SIGNUP = {
  action: "https://docs.google.com/forms/d/e/1FAIpQLSdC6CJ3BdZR1Lgg-RRCWydsUkFGwePIz0-CtBipruFhTls6MA/formResponse",
  email: "entry.352128405",
  name: "entry.470374742",
  download: "/canada-student-checklist.pdf"
};
/* Paste your Gumroad / Lemon Squeezy product link here when the store is ready */
const GUIDE_URL = "";
/* Facebook views, last 90 days (Creator Dashboard: profile 5,207 + Human Changer page 96) */
const FB90 = { views: 5303, period: "Aug 14 – Nov 11, 2026" };

/* ===== Blog articles: add new posts here (newest first) ===== */
const POSTS = [
  {slug:"canada-immigration-levels-plan-2027-2029.html", title:"What Canada's new immigration plan means for students", cat:"IRCC news", date:"2026-11-12", updated:"2026-11-12", mins:6, cover:"c3", coverText:"Levels plan<br>2027–2029", excerpt:"Up to 150,000 new students a year, 380,000 new PRs, and the November 2026 Express Entry change."},
  {slug:"canada-student-work-hours.html", title:"How many hours can international students work in Canada?", cat:"Work", date:"2026-11-12", updated:"2026-11-12", mins:5, cover:"c2", coverText:"The 24-hour<br>work rule", excerpt:"Off-campus work limits during classes and breaks, and how to stay within your permit conditions."},
  {slug:"canada-student-proof-of-funds-2026.html", title:"Proof of funds for a Canadian study permit in 2026–27", cat:"Money", date:"2026-11-12", updated:"2026-11-12", mins:6, cover:"c1", coverText:"How much money<br>do you need?", excerpt:"The new IRCC living-cost amounts, what they cover, and how to plan your budget from Bangladesh."}
];

/* ===== Analytics helper (GA4 via Google tag; respects consent) ===== */
window.mhTrack = function(name, params){ try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch(e){} };

function fmt(n){
  if (n >= 1e6) return (n/1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/,'') + 'K';
  return String(n);
}

document.addEventListener('DOMContentLoaded', () => {
  /* ===== Cookie consent banner ===== */
  let choice = null; try { choice = localStorage.getItem('mh_consent'); } catch(e){}
  const setConsent = v => {
    try { localStorage.setItem('mh_consent', v); } catch(e){}
    if (typeof gtag === 'function') gtag('consent', 'update', {analytics_storage: v});
    const b = document.getElementById('consentBar'); if (b) b.remove();
  };
  const showBanner = () => {
    if (document.getElementById('consentBar')) return;
    const bar = document.createElement('div'); bar.id = 'consentBar'; bar.className = 'consent'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Cookie choice');
    bar.innerHTML = '<p>I use Google Analytics cookies to see which guides help students most. No ads, no selling data. <a href="/privacy.html">Privacy</a></p><div class="consent-btns"><button type="button" class="btn btn-outline" data-c="denied">Decline</button><button type="button" class="btn btn-solid" data-c="granted">Accept</button></div>';
    bar.addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (c) setConsent(c.dataset.c); });
    document.body.appendChild(bar);
  };
  if (!choice) setTimeout(showBanner, 900);
  const pr = document.getElementById('privacyReset');
  if (pr) pr.addEventListener('click', () => { try { localStorage.removeItem('mh_consent'); } catch(e){} showBanner(); });

  /* header + mobile menu */
  const hdr = document.querySelector('header.site');
  if (hdr) addEventListener('scroll', () => hdr.classList.toggle('scrolled', scrollY > 10), {passive:true});
  const menuBtn = document.getElementById('menuBtn'), links = document.getElementById('navLinks');
  if (menuBtn && links){
    menuBtn.addEventListener('click', () => { const o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* social numbers */
  let total = 0;
  Object.keys(SOCIAL).forEach(k => {
    const s = SOCIAL[k]; if (typeof s !== 'object') return;
    total += s.count || 0;
    document.querySelectorAll(`[data-social="${k}"]`).forEach(el => {
      if (s.count) { el.dataset.count = s.count; el.dataset.fmt = '1'; el.textContent = fmt(s.count); }
      else { el.textContent = 'Follow'; el.classList.add('small'); }
    });
  });
  document.querySelectorAll('[data-social="total"]').forEach(el => { el.dataset.count = total; el.dataset.fmt = '1'; el.dataset.plus = '1'; el.textContent = fmt(total) + '+'; });
  document.querySelectorAll('[data-social="updated"]').forEach(el => el.textContent = SOCIAL.updated);
  const totalViews = Object.values(VIEWS).reduce((a, b) => a + b, 0);
  document.querySelectorAll('[data-views="total"]').forEach(el => { el.dataset.count = totalViews; el.dataset.fmt = '1'; el.dataset.plus = '1'; el.textContent = fmt(totalViews) + '+'; });
  document.querySelectorAll('[data-views="fb90"]').forEach(el => { el.dataset.count = FB90.views; el.dataset.fmt = '1'; el.dataset.plus = '1'; el.textContent = fmt(FB90.views) + '+'; });
  document.querySelectorAll('[data-views="fb90period"]').forEach(el => el.textContent = FB90.period);

  /* count-up + reveal */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el){
    const end = +el.dataset.count, plus = el.dataset.plus ? '+' : '', sx = el.dataset.suffix || '';
    const show = v => el.dataset.fmt ? fmt(v) + plus : Math.round(v) + sx;
    if (reduce || !end) { el.textContent = show(end); return; }
    const t0 = performance.now(), dur = 1500;
    (function tick(t){ const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = show(Math.round(end * e)); if (p < 1) requestAnimationFrame(tick); })(t0);
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(e.target);
  }), {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* live IRCC news (official Government of Canada news feed) */
  const box = document.getElementById('irccNews');
  if (box){
    const n = +box.dataset.items || 5;
    const url = 'https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&type=newsreleases&sort=publishedDate&orderBy=desc&pick=' + n + '&format=json';
    const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    fetch(url).then(r => r.json()).then(j => {
      const items = (j.feed && j.feed.entry) || [];
      if (!items.length) throw new Error('empty');
      box.innerHTML = items.map(x => {
        const d = new Date(x.publishedDate);
        const safe = /^https:\/\/www\.canada\.ca\//.test(x.link) ? x.link : 'https://www.canada.ca/en/immigration-refugees-citizenship/news.html';
        return `<a class="news-item" href="${safe}" target="_blank" rel="noopener"><time datetime="${esc(x.publishedDate)}">${d.toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'})}</time><h4>${esc(x.title)}</h4></a>`;
      }).join('');
    }).catch(() => {
      box.innerHTML = '<p class="muted" style="padding:16px 0">Live news couldn\'t load right now. <a class="link-arrow" href="https://www.canada.ca/en/immigration-refugees-citizenship/news.html" target="_blank" rel="noopener">Read the latest on Canada.ca <span class="arrow">→</span></a></p>';
    });
  }

  /* ===== Blog index: search + category filter ===== */
  const blogGrid = document.getElementById('blogGrid');
  if (blogGrid){
    const dfmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {year:'numeric', month:'short', day:'numeric'});
    if (!blogGrid.querySelector('.pcard')) blogGrid.innerHTML = POSTS.map(p => `
      <a class="pcard" data-cat="${p.cat}" href="/${p.slug}">
        <div class="post-cover ${p.cover}"><span>${p.coverText}</span></div>
        <div class="meta"><span class="tag">${p.cat} · ${p.mins} min read</span><h3>${p.title}</h3><p class="ex">${p.excerpt}</p>
        <span class="post-dates">Published ${dfmt(p.date)}${p.updated !== p.date ? ' · Updated ' + dfmt(p.updated) : ''}</span><span class="more">Read article →</span></div>
      </a>`).join('');
    const cats = ['All', ...new Set(POSTS.map(p => p.cat))];
    const fbar = document.getElementById('blogFilters');
    fbar.innerHTML = cats.map((c,i) => `<button class="chip${i ? '' : ' active'}" data-bcat="${c}">${c}</button>`).join('');
    const q = document.getElementById('blogSearch'); let cat = 'All';
    const apply = () => {
      const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean); let n = 0;
      blogGrid.querySelectorAll('.pcard').forEach(card => {
        const t = card.textContent.toLowerCase();
        const ok = (cat === 'All' || card.dataset.cat === cat) && words.every(w => t.includes(w));
        card.style.display = ok ? '' : 'none'; if (ok) n++;
      });
      document.getElementById('blogEmpty').hidden = n > 0;
    };
    let st; q.addEventListener('input', () => { apply(); clearTimeout(st); if (q.value.trim().length > 2) st = setTimeout(() => mhTrack('search', {search_term: q.value.trim().slice(0, 60), area: 'blog'}), 1200); });
    fbar.addEventListener('click', e => { const b = e.target.closest('[data-bcat]'); if (!b) return; cat = b.dataset.bcat; fbar.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === b)); apply(); });
  }

  /* ===== Article enhancements: progress, TOC, dates, share, related ===== */
  const art = document.querySelector('article.article');
  if (art){
    const slug = location.pathname.split('/').pop();
    const post = POSTS.find(p => p.slug === slug);
    // reading progress
    const bar = document.createElement('div'); bar.className = 'read-progress'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
    const upd = () => { const r = art.getBoundingClientRect(); const total = r.height - innerHeight; bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, total > 0 ? -r.top / total : 1)) + ')'; };
    addEventListener('scroll', upd, {passive:true}); upd();
    // table of contents from h2s
    const hs = [...art.querySelectorAll('h2')];
    const byline = art.querySelector('.byline');
    if (hs.length >= 3 && byline){
      hs.forEach((h,i) => { if (!h.id) h.id = 's' + (i+1) + '-' + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40); });
      const toc = document.createElement('nav'); toc.className = 'toc'; toc.setAttribute('aria-label','On this page');
      toc.innerHTML = '<b>On this page</b><ol>' + hs.map(h => `<li><a href="#${h.id}">${h.textContent}</a></li>`).join('') + '</ol>';
      byline.after(toc);
    }
    // last checked line
    if (post && byline){
      const v = document.createElement('p'); v.className = 'verified-line';
      v.innerHTML = '✓ Official rules in this article were last checked against Canada.ca on <time datetime="' + post.updated + '">' + new Date(post.updated + 'T00:00:00').toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'}) + '</time>.';
      byline.after(v);
    }
    // share + related at the end
    const end = art.querySelector('p:last-of-type');
    const url = encodeURIComponent(location.href.split('#')[0]), title = encodeURIComponent(document.title);
    const share = document.createElement('div'); share.className = 'share';
    share.innerHTML = '<b>Share this guide</b><a href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" target="_blank" rel="noopener">Facebook</a><a href="https://wa.me/?text=' + title + '%20' + url + '" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="copy-link">Copy link</button>';
    share.querySelector('.copy-link').addEventListener('click', e => { navigator.clipboard && navigator.clipboard.writeText(location.href.split('#')[0]).then(() => { e.target.textContent = 'Link copied ✓'; setTimeout(() => e.target.textContent = 'Copy link', 2000); }); });
    const related = POSTS.filter(p => p.slug !== slug).slice(0, 2);
    const rel = document.createElement('section'); rel.className = 'related';
    rel.innerHTML = '<h2>Keep reading</h2><div class="related-grid">' + related.map(p => `<a class="pcard" href="/${p.slug}"><div class="post-cover ${p.cover}"><span>${p.coverText}</span></div><div class="meta"><span class="tag">${p.cat} · ${p.mins} min read</span><h3>${p.title}</h3></div></a>`).join('') +
      '<a class="related-tool" href="/tools.html"><span class="tag">Free tool</span><h3>Plan your budget, documents and timeline</h3><span class="more">Open student tools →</span></a></div>';
    if (end){ end.before(share); end.before(rel); } else { art.append(share, rel); }
  }

  /* video filters */
  const chips = document.querySelectorAll('.chip[data-f]');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.toggle('active', x === c));
    const f = c.dataset.f;
    document.querySelectorAll('.vcard[data-f]').forEach(v => v.classList.toggle('hide', !(f === 'all' || v.dataset.f.split(' ').includes(f))));
  }));

  /* email signup → Google Form, then reveal the download */
  document.querySelectorAll('form.signup-form').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const email = f.querySelector('input[type=email]').value.trim();
      const name = (f.querySelector('input[name=name]') || {}).value || '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
      const body = new URLSearchParams(); body.append(SIGNUP.email, email); body.append(SIGNUP.name, name);
      const btn = f.querySelector('button'); if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      mhTrack('sign_up', {method: 'checklist_form', page_path: location.pathname});
      fetch(SIGNUP.action, {method:'POST', mode:'no-cors', body}).catch(() => {}).finally(() => {
        f.hidden = true;
        const ok = f.parentElement.querySelector('.signup-ok'); if (ok) ok.hidden = false;
      });
    });
  });

  /* guide buy buttons */
  document.querySelectorAll('[data-buy]').forEach(a => {
    if (GUIDE_URL) { a.href = GUIDE_URL; a.target = '_blank'; a.rel = 'noopener'; }
    else { if (a.dataset.buy !== 'local') a.href = '/free-checklist.html#signup'; a.querySelector('.buy-label') && (a.querySelector('.buy-label').textContent = 'Join the launch list'); }
  });
  document.querySelectorAll('[data-guide-status]').forEach(el => el.textContent = GUIDE_URL ? 'Available now · instant PDF download' : 'Launching soon · join the list for the launch price');

  /* contact form → opens the visitor's email app */
  const form = document.getElementById('contactForm');
  if (form){
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      const subject = `[${d.get('topic')}] Message from ${d.get('name')}`;
      const body = `${d.get('message')}\n\n— ${d.get('name')}\n${d.get('email')}`;
      location.href = `mailto:meskhathossain@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const ok = document.getElementById('formOk'); if (ok) ok.hidden = false;
    });
  }
});
