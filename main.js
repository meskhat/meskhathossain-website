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

function fmt(n){
  if (n >= 1e6) return (n/1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/,'') + 'K';
  return String(n);
}

document.addEventListener('DOMContentLoaded', () => {
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

  /* video filters */
  const chips = document.querySelectorAll('.chip[data-f]');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.toggle('active', x === c));
    const f = c.dataset.f;
    document.querySelectorAll('.vcard[data-f]').forEach(v => v.classList.toggle('hide', !(f === 'all' || v.dataset.f.split(' ').includes(f))));
  }));

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
