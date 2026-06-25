const DB_URL = 'https://bioo-d2474-default-rtdb.asia-southeast1.firebasedatabase.app';

const $ = (id) => document.getElementById(id);
const state = { data: null, audioReady: false };

const defaultData = {
  pin: '300698',
  settings: {
    name: 'Ceypeepung', username: 'ceypeepung', bio: 'Digital creator, streamer, dan cyberpunk storyteller. Semua link penting ada di sini.',
    avatar: 'https://i.ibb.co/6g7P1vH/cyber-avatar.png', banner: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=85',
    verified: true, followers: '128K', views: 0, location: 'Jakarta, Indonesia', status: 'Online',
    title: 'Ceypeepung Bio', description: 'Premium cyberpunk link in bio creator page.', favicon: 'favicon.svg', themeColor: '#00d9ff', accentColor: '#2267ff'
  },
  theme: { type: 'gradient', gradient: 'linear-gradient(135deg,#020612,#031633,#00111d,#06134a)', blur: 0, brightness: 72, overlayOpacity: 88 },
  media: { imageUrl: '', videoUrl: '', audioUrl: '', autoplay: true, loop: true, muted: false, volume: 45 },
  social: [
    { title: 'Instagram', url: 'https://instagram.com', emoji: '◎' }, { title: 'TikTok', url: 'https://tiktok.com', emoji: '♪' },
    { title: 'YouTube', url: 'https://youtube.com', emoji: '▶' }, { title: 'X', url: 'https://x.com', emoji: '𝕏' }
  ],
  links: [
    { id: crypto.randomUUID(), title: 'YouTube Channel', description: 'Subscribe konten terbaru', url: 'https://youtube.com', emoji: '▶️', iconUrl: '', active: true, glow: true, color: '#00d9ff', animation: 'rise' },
    { id: crypto.randomUUID(), title: 'GitHub Project', description: 'Lihat source dan karya digital', url: 'https://github.com', emoji: '⚡', iconUrl: '', active: true, glow: true, color: '#2267ff', animation: 'rise' },
    { id: crypto.randomUUID(), title: 'Business Contact', description: 'Kolaborasi dan partnership', url: 'mailto:hello@example.com', emoji: '💼', iconUrl: '', active: true, glow: true, color: '#24ffc8', animation: 'rise' }
  ],
  analytics: { visitors: 0, views: 0, totalClicks: 0, linkClicks: {}, hits: [] },
  updatedAt: Date.now()
};

async function dbGet(path = '') {
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error('Firebase GET failed');
  return res.json();
}
async function dbPut(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Firebase PUT failed');
  return res.json();
}
async function dbPatch(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, { method: 'PATCH', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Firebase PATCH failed');
  return res.json();
}

function mergeDefaults(data) {
  return {
    ...defaultData,
    ...(data || {}),
    settings: { ...defaultData.settings, ...(data?.settings || {}) },
    theme: { ...defaultData.theme, ...(data?.theme || {}) },
    media: { ...defaultData.media, ...(data?.media || {}) },
    social: data?.social || defaultData.social,
    links: data?.links || defaultData.links,
    analytics: { ...defaultData.analytics, ...(data?.analytics || {}) }
  };
}

async function ensureData() {
  const existing = await dbGet('bio');
  if (!existing) {
    await dbPut('bio', defaultData);
    return defaultData;
  }
  return mergeDefaults(existing);
}

function setMeta(settings) {
  document.title = settings.title || settings.name || 'Link in Bio';
  document.querySelector('meta[name="description"]').content = settings.description || settings.bio || '';
  document.querySelector('meta[property="og:title"]').content = settings.title || settings.name || '';
  document.querySelector('meta[property="og:description"]').content = settings.description || settings.bio || '';
  document.querySelector('meta[property="og:image"]').content = settings.banner || settings.avatar || '';
  document.querySelector('meta[name="theme-color"]').content = settings.themeColor || '#00d9ff';
  document.documentElement.style.setProperty('--primary', settings.themeColor || '#00d9ff');
  document.documentElement.style.setProperty('--accent', settings.accentColor || '#2267ff');
  const icon = document.querySelector('link[rel="icon"]');
  if (settings.favicon) icon.href = settings.favicon;
}

function faviconFor(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=128`;
  } catch { return ''; }
}
function formatNumber(v) {
  if (typeof v === 'string') return v;
  const n = Number(v || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0','') + 'K';
  return String(n);
}

function render(data) {
  state.data = data;
  const s = data.settings;
  setMeta(s);
  $('banner').style.backgroundImage = `linear-gradient(135deg, rgba(0,217,255,.18), rgba(34,103,255,.22)), url('${s.banner}')`;
  $('avatar').src = s.avatar;
  $('displayName').textContent = s.name;
  $('username').textContent = '@' + String(s.username || '').replace(/^@/, '');
  $('bio').textContent = s.bio;
  $('verifiedBadge').classList.toggle('hidden', !s.verified);
  $('followers').textContent = formatNumber(s.followers);
  $('views').textContent = formatNumber(data.analytics?.views ?? s.views);
  $('totalClicks').textContent = formatNumber(data.analytics?.totalClicks);
  $('statusText').textContent = s.status || 'Online';
  $('location').textContent = s.location || '';

  renderBackground(data);
  renderSocial(data.social || []);
  renderLinks((data.links || []).filter(l => l.active !== false));
  renderQR();
  setupAudio(data.media || {});
  $('loader').classList.add('hide');
}

function renderBackground(data) {
  const theme = data.theme || {};
  const media = data.media || {};
  const bgImage = $('bgImage'), bgVideo = $('bgVideo'), gradient = $('gradientLayer');
  document.documentElement.style.setProperty('--bg-blur', `${theme.blur || 0}px`);
  document.documentElement.style.setProperty('--overlay-opacity', `${(theme.overlayOpacity ?? 88) / 100}`);
  bgImage.style.filter = `brightness(${(theme.brightness ?? 72) / 100}) blur(${theme.blur || 0}px)`;
  bgVideo.style.filter = bgImage.style.filter;
  gradient.style.background = theme.gradient || defaultData.theme.gradient;
  bgImage.classList.add('hidden'); bgVideo.classList.add('hidden'); gradient.classList.remove('hidden');
  if (theme.type === 'image' && media.imageUrl) {
    bgImage.src = media.imageUrl; bgImage.classList.remove('hidden'); gradient.classList.add('hidden');
  }
  if (theme.type === 'video' && media.videoUrl) {
    if (bgVideo.src !== media.videoUrl) bgVideo.src = media.videoUrl;
    bgVideo.muted = true; bgVideo.loop = true; bgVideo.autoplay = true; bgVideo.playsInline = true;
    bgVideo.classList.remove('hidden'); gradient.classList.add('hidden'); bgVideo.play().catch(() => {});
  }
}

function renderSocial(items) {
  $('socialGrid').innerHTML = items.filter(i => i.url).map(i => `<a class="social-btn" href="${i.url}" target="_blank" rel="noopener" title="${i.title || ''}">${i.emoji || '↗'}</a>`).join('');
}
function renderLinks(items) {
  $('linksList').innerHTML = items.map((link, idx) => {
    const icon = link.iconUrl || faviconFor(link.url);
    const color = link.color || 'var(--primary)';
    return `<a class="link-card" style="animation-delay:${idx * 70}ms;--link-color:${color};border-color:${color}55;${link.glow ? `box-shadow:0 16px 40px rgba(0,0,0,.22),0 0 24px ${color}33` : ''}" href="${link.url}" target="_blank" rel="noopener" data-id="${link.id}">
      <img class="link-icon" src="${icon}" alt="" loading="lazy" onerror="this.style.display='none'">
      <div><div class="link-title">${link.emoji || ''} ${link.title || 'Untitled'}</div><div class="link-desc">${link.description || ''}</div></div><div class="link-arrow">↗</div>
    </a>`;
  }).join('') || '<div class="card" style="padding:18px;text-align:center;color:var(--muted)">Belum ada link aktif.</div>';
  document.querySelectorAll('.link-card').forEach(a => a.addEventListener('click', () => trackClick(a.dataset.id)));
}
function renderQR() {
  if (!window.QRCode) return setTimeout(renderQR, 120);
  $('qrCode').innerHTML = '';
  new QRCode($('qrCode'), { text: location.href, width: 170, height: 170, colorDark: '#020612', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
}

async function trackView() {
  const now = new Date();
  const hit = { date: now.toISOString(), path: location.pathname, ua: navigator.userAgent.slice(0, 120) };
  const data = state.data || await ensureData();
  const analytics = data.analytics || {};
  const next = { visitors: Number(analytics.visitors || 0) + 1, views: Number(analytics.views || 0) + 1, hits: [...(analytics.hits || []).slice(-99), hit] };
  await dbPatch('bio/analytics', next).catch(console.warn);
}
async function trackClick(id) {
  const data = state.data; if (!data) return;
  const clicks = data.analytics?.linkClicks || {};
  clicks[id] = Number(clicks[id] || 0) + 1;
  await dbPatch('bio/analytics', { totalClicks: Number(data.analytics?.totalClicks || 0) + 1, linkClicks: clicks }).catch(console.warn);
}

function setupAudio(media) {
  const audio = $('bgAudio');
  const btn = $('audioBtn');
  if (!media.audioUrl) { btn.textContent = 'No Audio'; return; }
  if (audio.src !== media.audioUrl) audio.src = media.audioUrl;
  audio.loop = media.loop !== false;
  audio.muted = !!media.muted;
  audio.volume = Math.max(0, Math.min(1, Number(media.volume ?? 45) / 100));
  btn.textContent = audio.paused ? 'Play Audio' : 'Pause Audio';
  const play = () => audio.play().then(() => { state.audioReady = true; btn.textContent = 'Pause Audio'; }).catch(() => {});
  if (media.autoplay && !state.audioReady) play();
  ['touchstart', 'click'].forEach(evt => window.addEventListener(evt, function unlock(){ if (media.autoplay) play(); window.removeEventListener(evt, unlock); }, { once: true }));
  btn.onclick = () => audio.paused ? play() : (audio.pause(), btn.textContent = 'Play Audio');
}

function connectRealtime() {
  const source = new EventSource(`${DB_URL}/bio.json`);
  source.addEventListener('put', e => {
    const payload = JSON.parse(e.data || '{}');
    const next = payload.path === '/' ? payload.data : deepApply(state.data || defaultData, payload.path, payload.data);
    if (next) render(mergeDefaults(next));
  });
  source.addEventListener('patch', e => {
    const payload = JSON.parse(e.data || '{}');
    const next = deepApply(state.data || defaultData, payload.path, payload.data, true);
    render(mergeDefaults(next));
  });
  source.onerror = () => console.warn('Realtime reconnecting...');
}
function deepApply(base, path, value, patch = false) {
  const copy = structuredClone(base || {});
  if (path === '/') return patch ? { ...copy, ...value } : value;
  const keys = path.replace(/^\//,'').split('/');
  let cur = copy;
  while (keys.length > 1) { const k = keys.shift(); cur[k] = cur[k] || {}; cur = cur[k]; }
  const last = keys[0]; cur[last] = patch && typeof value === 'object' && !Array.isArray(value) ? { ...(cur[last] || {}), ...value } : value;
  return copy;
}

function setupUI() {
  $('shareBtn').onclick = async () => {
    const shareData = { title: document.title, text: state.data?.settings?.bio || '', url: location.href };
    if (navigator.share) await navigator.share(shareData).catch(() => {}); else copyLink();
  };
  $('copyBtn').onclick = copyLink;
  document.addEventListener('click', e => {
    const btn = e.target.closest('button, .btn, .admin-btn'); if (!btn) return;
    const r = document.createElement('span'); r.className = 'ripple';
    const rect = btn.getBoundingClientRect(); const size = Math.max(rect.width, rect.height);
    r.style.width = r.style.height = `${size}px`; r.style.left = `${e.clientX - rect.left - size/2}px`; r.style.top = `${e.clientY - rect.top - size/2}px`;
    btn.appendChild(r); setTimeout(() => r.remove(), 700);
  });
  const glow = $('cursorGlow');
  window.addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });
}
function copyLink() { navigator.clipboard.writeText(location.href).then(() => toast('Link berhasil disalin')); }
function toast(text) { const t = $('toast'); t.textContent = text; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); }

function particles() {
  const c = $('particles'), ctx = c.getContext('2d'); let dots = [];
  const resize = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; dots = Array.from({length: Math.min(90, Math.floor(innerWidth/10))}, () => ({ x: Math.random()*c.width, y: Math.random()*c.height, vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35, r: Math.random()*2+0.5 })); };
  const draw = () => { ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle='rgba(0,217,255,.65)'; dots.forEach(d => { d.x+=d.vx; d.y+=d.vy; if(d.x<0||d.x>c.width)d.vx*=-1; if(d.y<0||d.y>c.height)d.vy*=-1; ctx.beginPath(); ctx.arc(d.x,d.y,d.r*devicePixelRatio,0,Math.PI*2); ctx.fill(); }); requestAnimationFrame(draw); };
  addEventListener('resize', resize); resize(); draw();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.warn);
setupUI(); particles();
ensureData().then(data => { render(data); trackView(); connectRealtime(); }).catch(err => { console.error(err); $('loader').classList.add('hide'); toast('Firebase belum bisa diakses.'); });
