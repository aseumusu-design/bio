const DB_URL = 'https://bioo-d2474-default-rtdb.asia-southeast1.firebasedatabase.app';
const $ = (id) => document.getElementById(id);
let bio = null;
let activeTab = 'dashboard';
let loggedIn = false;
let draggedIndex = null;

const defaults = {
  pin: '300698',
  settings: { name:'Ceypeepung', username:'ceypeepung', bio:'Digital creator, streamer, dan cyberpunk storyteller. Semua link penting ada di sini.', avatar:'https://i.ibb.co/6g7P1vH/cyber-avatar.png', banner:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=85', verified:true, followers:'128K', views:0, location:'Jakarta, Indonesia', status:'Online', title:'Ceypeepung Bio', description:'Premium cyberpunk link in bio creator page.', favicon:'favicon.svg', themeColor:'#00d9ff', accentColor:'#2267ff' },
  theme: { type:'gradient', gradient:'linear-gradient(135deg,#020612,#031633,#00111d,#06134a)', blur:0, brightness:72, overlayOpacity:88 },
  media: { imageUrl:'', videoUrl:'', audioUrl:'', autoplay:true, loop:true, muted:false, volume:45 },
  social: [{title:'Instagram',url:'https://instagram.com',emoji:'◎'},{title:'TikTok',url:'https://tiktok.com',emoji:'♪'},{title:'YouTube',url:'https://youtube.com',emoji:'▶'},{title:'X',url:'https://x.com',emoji:'𝕏'}],
  links: [], analytics: { visitors:0, views:0, totalClicks:0, linkClicks:{}, hits:[] }, updatedAt: Date.now()
};

async function dbGet(path='bio') { const r = await fetch(`${DB_URL}/${path}.json`); if(!r.ok) throw Error('GET failed'); return r.json(); }
async function dbPut(path, data) { saving(); const r = await fetch(`${DB_URL}/${path}.json`, {method:'PUT', body:JSON.stringify(data)}); saved(); if(!r.ok) throw Error('PUT failed'); return r.json(); }
async function dbPatch(path, data) { saving(); const r = await fetch(`${DB_URL}/${path}.json`, {method:'PATCH', body:JSON.stringify(data)}); saved(); if(!r.ok) throw Error('PATCH failed'); return r.json(); }
function merge(d) { return { ...defaults, ...(d||{}), settings:{...defaults.settings,...(d?.settings||{})}, theme:{...defaults.theme,...(d?.theme||{})}, media:{...defaults.media,...(d?.media||{})}, social:d?.social||defaults.social, links:d?.links||defaults.links, analytics:{...defaults.analytics,...(d?.analytics||{})} }; }
async function initData() { const d = await dbGet(); if(!d) { await dbPut('bio', defaults); return structuredClone(defaults); } return merge(d); }
function saving(){ $('saveState') && ($('saveState').textContent='Menyimpan realtime...'); }
function saved(){ setTimeout(()=> $('saveState') && ($('saveState').textContent='Realtime autosave aktif'), 350); }
function toast(t){ const el=$('toast'); el.textContent=t; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }
function esc(v=''){ return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

async function login() {
  const input = $('pinInput').value.trim();
  bio = await initData();
  if (input === String(bio.pin || '300698')) {
    loggedIn = true; $('loginScreen').classList.add('hidden'); $('adminApp').classList.remove('hidden'); renderTab(); connectRealtime();
  } else { $('loginMessage').textContent = 'PIN salah.'; }
}

function connectRealtime() {
  const source = new EventSource(`${DB_URL}/bio.json`);
  source.addEventListener('put', e => { if(!loggedIn) return; const p=JSON.parse(e.data||'{}'); bio = merge(p.path==='/' ? p.data : deepApply(bio,p.path,p.data)); renderTab(false); });
  source.addEventListener('patch', e => { if(!loggedIn) return; const p=JSON.parse(e.data||'{}'); bio = merge(deepApply(bio,p.path,p.data,true)); renderTab(false); });
}
function deepApply(base,path,value,patch=false){ const c=structuredClone(base||{}); if(path==='/') return patch?{...c,...value}:value; const keys=path.replace(/^\//,'').split('/'); let cur=c; while(keys.length>1){const k=keys.shift(); cur[k]=cur[k]||{}; cur=cur[k];} const last=keys[0]; cur[last]=patch&&typeof value==='object'&&!Array.isArray(value)?{...(cur[last]||{}),...value}:value; return c; }

function field(path, label, value, type='text', extra='') { return `<div class="field"><label>${label}</label><input data-path="${path}" type="${type}" value="${esc(value)}" ${extra}></div>`; }
function area(path, label, value) { return `<div class="field"><label>${label}</label><textarea data-path="${path}">${esc(value)}</textarea></div>`; }
function check(path, label, value) { return `<label class="switch"><input data-path="${path}" type="checkbox" ${value?'checked':''}> ${label}</label>`; }

function dashboard() {
  const a=bio.analytics||{}; const s=bio.settings||{};
  return `<div class="admin-grid three">
    <div class="admin-card analytics-box"><span>Total Visitor</span><strong>${a.visitors||0}</strong></div>
    <div class="admin-card analytics-box"><span>Total Views</span><strong>${a.views||0}</strong></div>
    <div class="admin-card analytics-box"><span>Total Click</span><strong>${a.totalClicks||0}</strong></div>
  </div><div class="admin-grid two" style="margin-top:14px"><div class="admin-card"><h2>${esc(s.name)}</h2><p class="bio">${esc(s.bio)}</p><div class="inline-actions"><button class="admin-btn primary" data-goto="setting">Edit Setting</button><button class="admin-btn" data-goto="links">Manage Links</button></div></div><iframe class="preview-frame" src="index.html" title="Preview"></iframe></div>`;
}
function setting() {
  const s=bio.settings;
  return `<div class="admin-card"><h2>Setting Website</h2><div class="form-grid two">
  ${field('settings.title','Website Title',s.title)}${field('settings.description','Website Description',s.description)}${field('settings.favicon','Favicon URL',s.favicon)}${field('settings.themeColor','Theme Color',s.themeColor,'color')}${field('settings.accentColor','Accent Color',s.accentColor,'color')}${field('pin','PIN Login',bio.pin,'password')}
  </div></div>`;
}
function profile() {
  const s=bio.settings;
  return `<div class="admin-card"><h2>Profile</h2><div class="form-grid two">
  ${field('settings.name','Nama',s.name)}${field('settings.username','Username',s.username)}${field('settings.avatar','Foto Profil URL ImgBB',s.avatar)}${field('settings.banner','Banner URL',s.banner)}${field('settings.followers','Followers',s.followers)}${field('settings.location','Lokasi',s.location)}${field('settings.status','Status Online',s.status)}${check('settings.verified','Badge Verified',s.verified)}
  </div>${area('settings.bio','Bio',s.bio)}</div><div class="admin-card" style="margin-top:14px"><h2>Social Media</h2><div id="socialEditors">${(bio.social||[]).map(socialEditor).join('')}</div><button class="admin-btn primary" id="addSocial">Tambah Social</button></div>`;
}
function socialEditor(i,idx){ return `<div class="link-editor"><div class="form-grid three">${field(`social.${idx}.title`,'Title',i.title)}${field(`social.${idx}.url`,'URL',i.url)}${field(`social.${idx}.emoji`,'Emoji',i.emoji)}</div><button class="admin-btn danger" data-delete-social="${idx}">Delete Social</button></div>`; }
function links() {
  return `<div class="admin-card"><div class="link-editor-head"><h2>Unlimited Link Manager</h2><button class="admin-btn primary" id="addLink">Tambah Link</button></div><p class="bio">Drag and drop untuk mengubah urutan. Semua link lama tetap tersimpan sampai dihapus permanen.</p><div id="linkEditors">${(bio.links||[]).map(linkEditor).join('')}</div></div>`;
}
function linkEditor(l,idx){ return `<div class="link-editor" draggable="true" data-link-index="${idx}"><div class="link-editor-head"><span class="drag-handle">☰ Link #${idx+1}</span>${check(`links.${idx}.active`,'Aktif',l.active!==false)}</div><div class="form-grid two">${field(`links.${idx}.title`,'Judul',l.title||'')}${field(`links.${idx}.url`,'URL',l.url||'')}${field(`links.${idx}.description`,'Deskripsi',l.description||'')}${field(`links.${idx}.emoji`,'Emoji',l.emoji||'')}${field(`links.${idx}.iconUrl`,'Icon URL kosong = auto favicon',l.iconUrl||'')}${field(`links.${idx}.color`,'Warna Tombol',l.color||'#00d9ff','color')}${field(`links.${idx}.animation`,'Animasi',l.animation||'rise')}${check(`links.${idx}.glow`,'Glow',l.glow!==false)}</div><div class="inline-actions"><a class="admin-btn" href="${esc(l.url||'#')}" target="_blank">Preview</a><button class="admin-btn danger" data-delete-link="${idx}">Delete Permanen</button></div></div>`; }
function theme() { const t=bio.theme; return `<div class="admin-card"><h2>Theme</h2><div class="form-grid two"><div class="field"><label>Background Type</label><select data-path="theme.type"><option value="gradient" ${t.type==='gradient'?'selected':''}>Gradient</option><option value="image" ${t.type==='image'?'selected':''}>Image URL</option><option value="video" ${t.type==='video'?'selected':''}>Video URL</option></select></div>${field('theme.gradient','Animated Gradient CSS',t.gradient)}${field('theme.blur','Blur',t.blur,'range','min="0" max="18"')}${field('theme.brightness','Brightness',t.brightness,'range','min="25" max="120"')}${field('theme.overlayOpacity','Overlay Opacity',t.overlayOpacity,'range','min="0" max="100"')}</div></div>`; }
function background(){ const m=bio.media; return `<div class="admin-card"><h2>Background Premium</h2><div class="form-grid">${field('media.imageUrl','Image URL HD',m.imageUrl)}${field('media.videoUrl','Video URL HD MP4/WebM',m.videoUrl)}</div><p class="bio">Video user page memakai fullscreen, object-fit cover, preload auto, autoplay, loop, muted, playsinline, dan responsive.</p></div>`; }
function media(){ const m=bio.media; return `<div class="admin-card"><h2>Media Audio</h2><div class="form-grid two">${field('media.audioUrl','Audio URL',m.audioUrl)}${field('media.volume','Volume',m.volume,'range','min="0" max="100"')}${check('media.autoplay','Autoplay',m.autoplay)}${check('media.loop','Loop',m.loop)}${check('media.muted','Mute',m.muted)}</div></div>`; }
function analytics(){ const a=bio.analytics||{}; const rows=Object.entries(a.linkClicks||{}).map(([id,c])=>`<tr><td>${esc((bio.links||[]).find(l=>l.id===id)?.title||id)}</td><td>${c}</td></tr>`).join(''); const hits=(a.hits||[]).slice(-20).reverse().map(h=>`<tr><td>${esc(h.date)}</td><td>${esc(h.path)}</td></tr>`).join(''); return `<div class="admin-grid three"><div class="admin-card analytics-box"><span>Total Visitor</span><strong>${a.visitors||0}</strong></div><div class="admin-card analytics-box"><span>Views</span><strong>${a.views||0}</strong></div><div class="admin-card analytics-box"><span>Total Click</span><strong>${a.totalClicks||0}</strong></div></div><div class="admin-grid two" style="margin-top:14px"><div class="admin-card"><h2>Per Link Click</h2><table>${rows||'<tr><td>Belum ada klik</td></tr>'}</table></div><div class="admin-card"><h2>Hit Counter Tanggal</h2><table>${hits||'<tr><td>Belum ada visitor</td></tr>'}</table></div></div>`; }
function backup(){ return `<div class="admin-card"><h2>Backup</h2><p class="bio">Export, import, reset database, download backup, dan restore backup JSON.</p><div class="inline-actions"><button class="admin-btn primary" id="exportJson">Export JSON</button><button class="admin-btn" id="downloadBackup">Download Backup</button><label class="admin-btn">Import JSON <input id="importJson" type="file" accept="application/json" hidden></label><button class="admin-btn danger" id="resetDb">Reset Database</button></div><textarea id="backupText" style="margin-top:14px;width:100%;min-height:260px" class="pin-input">${esc(JSON.stringify(bio,null,2))}</textarea><button class="admin-btn primary" id="restoreText">Restore Backup</button></div>`; }
function database(){ return `<div class="admin-card"><h2>Database</h2><div class="form-grid"><div class="field"><label>Firebase Realtime Database URL</label><input readonly value="${DB_URL}"></div><div class="field"><label>Firebase Config / REST Mode</label><textarea readonly>{\n  databaseURL: '${DB_URL}',\n  mode: 'REST + EventSource realtime',\n  auth: 'PIN stored in Firebase, no Firebase Auth',\n  localStorage: false\n}</textarea></div></div></div>`; }

const views = { dashboard, setting, profile, links, theme, background, media, analytics, backup, database };
function renderTab(updateTitle=true){ if(!bio) return; if(updateTitle) $('adminTitle').textContent = activeTab[0].toUpperCase()+activeTab.slice(1); $('tabContent').innerHTML = views[activeTab](); bindInputs(); bindSpecial(); }
function bindInputs(){ document.querySelectorAll('[data-path]').forEach(el=>{ el.onchange=el.oninput=debounce(async()=>{ const val = el.type==='checkbox'?el.checked:el.value; setPath(bio, el.dataset.path, val); await dbPut('bio', {...bio, updatedAt:Date.now()}); }, 450); }); }
function setPath(obj,path,val){ const parts=path.split('.'); let cur=obj; while(parts.length>1){ const p=parts.shift(); cur[p]=cur[p]??(Number.isInteger(+parts[0])?[]:{}); cur=cur[p]; } cur[parts[0]]=val; }
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

function bindSpecial(){
  document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>switchTab(b.dataset.goto));
  $('addLink') && ($('addLink').onclick=async()=>{ bio.links.push({id:crypto.randomUUID(),title:'Link Baru',description:'Deskripsi link',url:'https://example.com',emoji:'🔗',iconUrl:'',active:true,glow:true,color:'#00d9ff',animation:'rise'}); await dbPut('bio/links', bio.links); renderTab(); });
  document.querySelectorAll('[data-delete-link]').forEach(b=>b.onclick=async()=>{ const i=+b.dataset.deleteLink; if(confirm('Hapus permanen link ini dari Firebase?')){ bio.links.splice(i,1); await dbPut('bio/links', bio.links); renderTab(); toast('Link dihapus permanen'); } });
  $('addSocial') && ($('addSocial').onclick=async()=>{ bio.social.push({title:'Social',url:'https://example.com',emoji:'↗'}); await dbPut('bio/social', bio.social); renderTab(); });
  document.querySelectorAll('[data-delete-social]').forEach(b=>b.onclick=async()=>{ bio.social.splice(+b.dataset.deleteSocial,1); await dbPut('bio/social', bio.social); renderTab(); });
  document.querySelectorAll('.link-editor[draggable="true"]').forEach(el=>{ el.ondragstart=()=>{draggedIndex=+el.dataset.linkIndex; el.classList.add('dragging')}; el.ondragend=()=>el.classList.remove('dragging'); el.ondragover=e=>e.preventDefault(); el.ondrop=async()=>{ const target=+el.dataset.linkIndex; if(draggedIndex===null||target===draggedIndex)return; const [item]=bio.links.splice(draggedIndex,1); bio.links.splice(target,0,item); draggedIndex=null; await dbPut('bio/links', bio.links); renderTab(); }; });
  $('exportJson') && ($('exportJson').onclick=()=>{ $('backupText').value=JSON.stringify(bio,null,2); toast('JSON siap diexport'); });
  $('downloadBackup') && ($('downloadBackup').onclick=()=>download(`bio-backup-${Date.now()}.json`, JSON.stringify(bio,null,2)));
  $('importJson') && ($('importJson').onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{$('backupText').value=r.result;}; r.readAsText(f); });
  $('restoreText') && ($('restoreText').onclick=async()=>{ try{ const data=JSON.parse($('backupText').value); bio=merge(data); await dbPut('bio', bio); renderTab(); toast('Backup direstore'); }catch{ toast('JSON tidak valid'); } });
  $('resetDb') && ($('resetDb').onclick=async()=>{ if(confirm('Reset seluruh database ke default?')){ bio=structuredClone(defaults); await dbPut('bio', bio); renderTab(); toast('Database direset'); } });
}
function download(name,text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
function switchTab(tab){ activeTab=tab; document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab)); renderTab(); }

function setupUI(){ $('loginBtn').onclick=login; $('pinInput').onkeydown=e=>{ if(e.key==='Enter') login(); }; $('logoutBtn').onclick=()=>location.reload(); $('previewBtn').onclick=()=>open('index.html','_blank'); document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab)); document.addEventListener('click', e=>{ const btn=e.target.closest('button,.admin-btn'); if(!btn)return; const r=document.createElement('span'); r.className='ripple'; const rect=btn.getBoundingClientRect(), size=Math.max(rect.width,rect.height); r.style.width=r.style.height=size+'px'; r.style.left=e.clientX-rect.left-size/2+'px'; r.style.top=e.clientY-rect.top-size/2+'px'; btn.appendChild(r); setTimeout(()=>r.remove(),700); }); const glow=$('cursorGlow'); addEventListener('pointermove',e=>{ glow.style.left=e.clientX+'px'; glow.style.top=e.clientY+'px'; },{passive:true}); particles(); }
function particles(){ const c=$('particles'),ctx=c.getContext('2d'); let dots=[]; const resize=()=>{ c.width=innerWidth*devicePixelRatio; c.height=innerHeight*devicePixelRatio; dots=Array.from({length:Math.min(80,Math.floor(innerWidth/12))},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.32,vy:(Math.random()-.5)*.32,r:Math.random()*2+.5}));}; const draw=()=>{ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='rgba(0,217,255,.6)';dots.forEach(d=>{d.x+=d.vx;d.y+=d.vy;if(d.x<0||d.x>c.width)d.vx*=-1;if(d.y<0||d.y>c.height)d.vy*=-1;ctx.beginPath();ctx.arc(d.x,d.y,d.r*devicePixelRatio,0,Math.PI*2);ctx.fill();});requestAnimationFrame(draw)}; addEventListener('resize',resize); resize(); draw(); }

setupUI();
