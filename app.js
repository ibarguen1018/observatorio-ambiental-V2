/* =========================================================
   OBSERVATORIO AMBIENTAL - Prototipo frontend (estático)
   Roles: admin (Administrador) / user (Usuario)
   ========================================================= */

const state = { role: 'ciudadano', name: 'María Fernanda Gómez', email: 'ciudadano@correo.com' };

const currentRoute = (window.location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html$/, '');
const loginAliases = ['login', 'loguin'];

if (loginAliases.includes(currentRoute)) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-screen').hidden = false;
    document.getElementById('app').hidden = true;
  });
}

/* Visor Comparativo / Explorador de Microdata / Indicadores ODS:
   vistas públicas de datos relevantes, sin necesidad de iniciar sesión */
document.addEventListener('DOMContentLoaded', () => {
  function wireModal(triggerId, modalId, closeId, loginBtnId){
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    if (!trigger || !modal) return;
    const close = () => { modal.hidden = true; };
    trigger.addEventListener('click', () => { modal.hidden = false; });
    document.getElementById(closeId)?.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.getElementById(loginBtnId)?.addEventListener('click', () => {
      close();
      document.getElementById('login-email')?.focus();
    });
  }
  wireModal('lsc-comparativo', 'cmp-modal',   'cmp-modal-close',   'cmp-modal-login');
  wireModal('lsc-microdata',   'micro-modal', 'micro-modal-close', 'micro-modal-login');
  wireModal('lsc-ods',         'ods-modal',   'ods-modal-close',   'ods-modal-login');
  // "Explorar todos los indicadores" abre el mismo resumen del Visor Comparativo
  document.getElementById('lsc-explore-all')?.addEventListener('click', () => {
    document.getElementById('cmp-modal').hidden = false;
  });
});

/* ---------------- MÓDULOS / NAVEGACIÓN ---------------- */
const modules = [
 {id:'dashboard',label:'Dashboard',icon:'⌂',title:'Observatorio Ambiental',sub:'Panorama general del estado ambiental de Santiago de Cali.'},
 {id:'geovisor',label:'Geovisor',icon:'⌖',title:'Geovisor',sub:'Mapa de Santiago de Cali integrado con la red de estaciones IoT del recurso hídrico y ruido, en tiempo real.'},
 {id:'indicadores',label:'Indicadores',icon:'▥',title:'Indicadores',sub:'Monitorea el comportamiento ambiental del territorio a partir de indicadores clave.'},
 {id:'analitica',label:'Analítica',icon:'⌁',title:'Analítica',sub:'Explora, analiza y genera conocimiento a partir de los datos ambientales del territorio.'},
 {id:'gestion',label:'Recurso Hídrico',icon:'☑',title:'Recurso Hídrico',sub:'Registra y consulta visitas técnicas, permisos, concesiones y hallazgos sobre el recurso hídrico.',tag:'PILOTO'},
 {id:'reportes',label:'Reportes',icon:'▤',title:'Reportes',sub:'Genera, consulta y exporta reportes de información ambiental.'},
 {id:'catalogo',label:'Catálogo de Información',icon:'◉',title:'Catálogo de Información',sub:'Consulta, explora y descarga los conjuntos de datos ambientales disponibles.'},
 {id:'consulta',label:'Consulta Ciudadana',icon:'♙',title:'Consulta Ciudadana',sub:'Explora y consulta la información ambiental de tu ciudad.'},
 {id:'admin',label:'Administración de contenido',icon:'⚙',title:'Administración de contenido',sub:'Gestiona textos, noticias, banners y observatorios comunitarios del portal público.',adminOnly:true}
];
const ROLE_LABEL = { ciudadano:'Ciudadano', dagma:'Usuario DAGMA' };

/* ================= LOGIN ================= */
const roleSelect = document.getElementById('role-select');
const roleLabel = document.getElementById('role-label');
roleSelect.addEventListener('click', e=>{
  const card = e.target.closest('.role-card'); if(!card) return;
  roleSelect.querySelectorAll('.role-card').forEach(c=>c.classList.toggle('active', c===card));
  const role = card.dataset.role;
  roleLabel.textContent = ROLE_LABEL[role];
  const email = document.getElementById('login-email');
  email.value = role==='dagma' ? 'juan.rojas@dagma.gov.co' : 'ciudadano@correo.com';
});

document.getElementById('login-form').addEventListener('submit', e=>{
  e.preventDefault();
  const role = roleSelect.querySelector('.role-card.active').dataset.role;
  const email = document.getElementById('login-email').value || 'usuario@correo.com';
  state.role = role;
  state.email = email;
  state.name = role==='dagma' ? 'Juan Rojas' : 'María Fernanda Gómez';
  enterApp();
});

function enterApp(){
  document.getElementById('login-screen').hidden = true;
  const app = document.getElementById('app');
  app.hidden = false;
  document.body.classList.add('app-active');
  app.classList.remove('role-dagma','role-ciudadano');
  app.classList.add(state.role==='dagma' ? 'role-dagma':'role-ciudadano');
  // Usuario DAGMA entra directo al módulo de Recurso Hídrico; el Ciudadano al inicio.
  load(location.hash.slice(1) || (state.role==='dagma' ? 'gestion' : 'home'));
  cargarDatosReales(); // RF-10: intenta datos reales del CEMUA/IDESC; si no hay API disponible, no cambia nada (ver comentario de la función)
}

function logout(){
  document.getElementById('app').hidden = true;
  document.body.classList.remove('app-active');
  document.getElementById('login-screen').hidden = false;
  location.hash = '';
}

document.addEventListener('click', e=>{
  const dropdown = document.getElementById('geo-search-dropdown');
  if(dropdown && !dropdown.hidden && !e.target.closest('#geo-search-dropdown') && !e.target.closest('#geo-rail-search')){
    dropdown.hidden = true;
  }
  const homeResults = document.getElementById('home-search-results');
  if(homeResults && !homeResults.hidden && !e.target.closest('.m-search-box')){
    homeResults.hidden = true;
  }
});
document.getElementById('sheet-zona')?.addEventListener('click', e=>{ if(e.target.id==='sheet-zona') e.currentTarget.hidden = true; });
document.getElementById('sheet-alertas')?.addEventListener('click', e=>{ if(e.target.id==='sheet-alertas') e.currentTarget.hidden = true; });

/* ---------------- INICIO (home tipo app bancaria) ---------------- */
function visibleModules(){
  return modules.filter(m => !m.adminOnly || state.role==='dagma');
}

function renderHomeHeader(){
  const initials = state.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const hasAlerts = getActiveAlerts(state.zona).length>0;
  return `
  <div class="m-top">
    <button class="m-avatar-btn" id="btn-profile"><span class="m-avatar">${initials}</span> ›</button>
    <div class="m-greeting">Hola, ${state.name.split(' ')[0].toUpperCase()}</div>
    <div class="m-icons">
      <button id="btn-help" title="Ayuda">?</button>
      <button id="btn-bell" title="Notificaciones">🔔${hasAlerts?'<span class="dot"></span>':''}</button>
    </div>
  </div>`;
}

function renderInnerHeader(m){
  return `
    <button class="m-back" id="btn-back-home" title="Volver al inicio">‹</button>
    <div><div class="m-title">${m.icon} ${m.label}</div><div class="m-subtitle">${state.role==='dagma'?'Usuario DAGMA':'Ciudadano'} · ${m.tag||''}</div></div>`;
}

function renderHeader(id){
  const header = document.getElementById('m-header');
  if(id==='home'){
    header.className = 'm-header';
    header.innerHTML = renderHomeHeader();
    document.getElementById('btn-profile')?.addEventListener('click', ()=>{
      if(confirm('¿Cerrar sesión de '+state.name+'?')) logout();
    });
    document.getElementById('btn-bell')?.addEventListener('click', ()=>{
      renderAlertasSheet();
      document.getElementById('sheet-alertas').hidden = false;
    });
  } else {
    const m = modules.find(x=>x.id===id);
    header.className = 'm-header simple';
    header.innerHTML = renderInnerHeader(m);
    document.getElementById('btn-back-home')?.addEventListener('click', ()=> load('home'));
  }
}

function renderBottomNav(activeId){
  const items = [
    {id:'home', ico:'⌂', label:'Inicio'},
    {id:'geovisor', ico:'⌖', label:'Geovisor'},
    {id:'gestion', ico:'≈', label:'Recurso Hídrico'},
    {id:'mas', ico:'▤', label:'Más'}
  ];
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = items.map(it=>`<button class="bn-item ${it.id===activeId?'active':''}" data-bn="${it.id}"><span class="bn-ico">${it.ico}</span><span>${it.label}</span></button>`).join('');
  nav.querySelectorAll('[data-bn]').forEach(b=>{
    b.addEventListener('click', ()=>{
      if(b.dataset.bn==='mas') openSheetMas(); else load(b.dataset.bn);
    });
  });
}

function openSheetMas(){
  const list = document.getElementById('sheet-mas-list');
  const rest = visibleModules().filter(m=>!['geovisor','gestion'].includes(m.id));
  list.innerHTML = rest.map(m=>`
    <div class="sheet-item" data-go="${m.id}">
      <span class="si-ico">${m.icon}</span>
      <div><b>${m.label}</b><span>${m.sub}</span></div>
    </div>`).join('');
  list.querySelectorAll('[data-go]').forEach(it=>{
    it.addEventListener('click', ()=>{
      document.getElementById('sheet-mas').hidden = true;
      load(it.dataset.go);
    });
  });
  document.getElementById('sheet-mas').hidden = false;
}
document.getElementById('sheet-mas').addEventListener('click', e=>{
  if(e.target.id==='sheet-mas') e.currentTarget.hidden = true;
});

function renderHome(){
  const rest = visibleModules();
  const zr = zonaResumen(state.zona);
  const estCfg = ESTADOS[zr.estado] || ESTADOS.bueno;
  const icaTxt = zr.ica===null ? '—' : zr.ica;
  const ruidoTxt = zr.ruido===null ? '—' : `${zr.ruido} dB`;
  return `
  <div class="m-search">
    <div class="m-search-box">
      <input id="home-search-input" class="m-search-input" autocomplete="off" placeholder="⌕ Busca una estación, un trámite o un tema">
      <div id="home-search-results" class="m-search-results" hidden></div>
    </div>
  </div>

  <div class="m-section" style="padding-top:2px">
    <div class="m-section-head"><h2>Mis módulos</h2><button class="m-pill-btn" data-nav="catalogo">◉ Datos abiertos</button></div>
  </div>
  <div class="m-section" style="padding-top:0;padding-bottom:0">
    <div class="m-section-head" style="margin-bottom:8px">
      <h3 class="section-title" style="margin:0">${state.zona==='Toda la ciudad' ? 'Así está Cali hoy' : 'Así está tu zona hoy'}</h3>
      <button class="m-pill-btn sm" id="btn-zona">📍 ${state.zona}</button>
    </div>
  </div>
  <div class="m-cards-scroll">
    <div class="m-summary-card c-green"><div class="msc-top"><span>≈ Calidad del agua</span></div><div class="msc-value">${icaTxt}</div><div class="msc-label">ICA promedio · ${estCfg.label}</div></div>
    <div class="m-summary-card c-blue"><div class="msc-top"><span>☑ Visitas registradas</span></div><div class="msc-value">${visitasRecursoHidrico.length + 1024}</div><div class="msc-label">Recurso hídrico · este mes</div></div>
    <div class="m-summary-card c-amber"><div class="msc-top"><span>♪ Ruido ambiental</span></div><div class="msc-value">${ruidoTxt}</div><div class="msc-label">Promedio · ${estCfg.label}</div></div>
  </div>

  <div class="m-minimap-card">
    <div class="m-minimap-head"><h3 class="section-title" style="margin:0">⌖ Mapa de estaciones${state.zona==='Toda la ciudad' ? '' : ' · '+state.zona}</h3></div>
    <div id="home-mini-map" class="m-minimap"></div>
    <div class="m-minimap-foot">
      <span class="tiny">${zr.totalEstaciones} estación(es) · ${zr.estacionesActivas} activa(s)</span>
      <button class="card-link" style="margin:0;padding:0;border:0;background:none" data-nav="geovisor">Ver mapa completo ›</button>
    </div>
  </div>

  <div class="m-services">
    <h3 class="section-title" style="padding:2px 6px 10px">Servicios destacados</h3>
    <div class="m-services-grid">
      ${rest.map(m=>`
        <button class="m-service" data-nav="${m.id}">
          <span class="ms-ico">${m.icon}</span>
          ${m.tag?`<span class="ms-tag">${m.tag}</span>`:''}
          <span>${m.label}</span>
        </button>`).join('')}
    </div>
  </div>

  <div class="m-section">
    <h3 class="section-title" style="margin-bottom:10px">Le puede interesar</h3>
  </div>
  <div class="m-chips">
    ${contenidoRelevante()}
  </div>
  <button class="m-fab" title="Ayuda">💬</button>`;
}

function load(id){
  if(id==='home'){
    renderHeader('home');
    document.getElementById('content').innerHTML = renderHome();
    renderBottomNav('home');
    history.replaceState(null,'','#home');
    window.scrollTo({top:0,behavior:'smooth'});
    wireModuleInteractions();
    maybeNotifyCritical();
    return;
  }
  const visible = visibleModules();
  let m = visible.find(x=>x.id===id) || visible[0];
  renderHeader(m.id);
  document.getElementById('content').innerHTML = `<div class="m-inner">${renderers[m.id]()}</div>`;
  renderBottomNav(m.id==='geovisor'||m.id==='gestion' ? m.id : null);
  history.replaceState(null,'','#'+m.id);
  window.scrollTo({top:0,behavior:'smooth'});
  wireModuleInteractions();
}

/* ================= HELPERS DE UI ================= */
function kpi(icon,bubbleClass,title,value,sub,trend){
  const trendHtml = trend ? `<span class="${trend[0]==='↑'?'up':'down'}">${trend}</span>` : '';
  return `<div class="card kpi">
    <div class="kpi-top"><div class="bubble ${bubbleClass||''}">${icon}</div>
      <div><h3>${title}</h3><div class="metric-row"><span class="metric">${value}</span></div></div>
    </div>
    <div class="kpi-foot"><span>${sub}</span>${trendHtml}</div>
  </div>`;
}

function table(headers,rows,publicActions,adminActions){
  const hasActions = publicActions || adminActions;
  return `<table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}${hasActions?'<th></th>':''}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c)=>`<td>${c}</td>`).join('')}${hasActions?`<td class="row-actions">${publicActions?`<span>${publicActions}</span>`:''}${adminActions?`<span data-admin-only>${adminActions}</span>`:''}</td>`:''}</tr>`).join('')}</tbody></table>`;
}

function pill(text,cls){return `<span class="pill ${cls||''}">${text}</span>`}

/* --- gráfico de líneas SVG --- */
function svgMultiLine(series, opts){
  opts = opts||{}; const w=opts.w||620,h=opts.h||150,max=opts.max||100;
  const n = series[0].values.length;
  const stepX = w/(n-1);
  const paths = series.map(s=>{
    const pts = s.values.map((v,i)=>`${(i*stepX).toFixed(1)},${(h-(v/max*h)).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`+
      s.values.map((v,i)=>`<circle cx="${(i*stepX).toFixed(1)}" cy="${(h-(v/max*h)).toFixed(1)}" r="2.6" fill="${s.color}"/>`).join('');
  }).join('');
  // grid lines
  const grid = [0,0.25,0.5,0.75,1].map(f=>`<line x1="0" y1="${(h*f).toFixed(1)}" x2="${w}" y2="${(h*f).toFixed(1)}" stroke="#edf1ee" stroke-width="1"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${paths}</svg>`;
}

function lineCard(series,labels,max){
  return `<div class="linechart-wrap">${svgMultiLine(series,{max:max||100})}</div>
    <div class="chart-axis">${labels.map(l=>`<span>${l}</span>`).join('')}</div>
    <div class="legend-inline">${series.map(s=>`<span><i class="dotlg" style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`;
}

/* --- barras verticales --- */
function fakeBars(values,labels,cls){
  return `<div class="fake-bars ${cls||''}">${values.map(v=>`<i style="height:${v}%"></i>`).join('')}</div>
    <div class="bar-labels">${labels.map(l=>`<span>${l}</span>`).join('')}</div>`;
}

/* --- barras horizontales --- */
function hbars(rows){
  const max = Math.max(...rows.map(r=>r.v));
  return rows.map(r=>`<div class="hbar-row"><span class="lbl">${r.l}</span><div class="bar"><span style="width:${(r.v/max*100).toFixed(0)}%;background:${r.c||'var(--green)'}"></span></div><span class="val">${r.v}</span></div>`).join('');
}

/* --- donut --- */
function donut(segments,centerBig,centerSmall){
  let acc=0;
  const stops = segments.map(s=>{
    const start=acc, end=acc+s.pct; acc=end;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ');
  return `<div class="donut-wrap">
    <div style="position:relative">
      <div class="donut" style="background:conic-gradient(${stops})"></div>
      <div class="donut-center"><b>${centerBig}</b><span>${centerSmall}</span></div>
    </div>
    <div class="donut-legend">${segments.map(s=>`<div class="row"><i class="dotlg" style="background:${s.color}"></i>${s.label}<b>${s.value}</b></div>`).join('')}</div>
  </div>`;
}

/* --- anillo de 4 indicadores estilo semáforo (estaciones IoT) --- */
function quadRing(items){
  const color = s => s==='good' ? 'var(--green)' : s==='warn' ? 'var(--amber)' : 'var(--danger)';
  const stops = items.map((it,i)=>`${color(it.status)} ${i*25}% ${(i+1)*25}%`).join(', ');
  const pos = ['top','right','bottom','left'];
  const labels = items.map((it,i)=>`<div class="quadring-lbl ${pos[i]}"><b style="color:${color(it.status)}">${it.value}</b><span class="tiny">${it.label}</span></div>`).join('');
  return `<div class="quadring"><div class="quadring-ring" style="background:conic-gradient(${stops})"></div><div class="quadring-hole"></div>${labels}</div>`;
}

/* --- radar chart --- */
function radar(axes,seriesList,size){
  size = size||220;
  const padX=64,padY=30; // extra room so edge labels don't clip
  const w=size+padX*2, h=size+padY*2, cx=w/2, cy=h/2, r=size*0.36;
  const n = axes.length;
  const pt=(i,val)=>{ // val 0-100
    const ang = (Math.PI*2*i/n) - Math.PI/2;
    const rad = r*(val/100);
    return [cx+rad*Math.cos(ang), cy+rad*Math.sin(ang)];
  };
  const rings=[25,50,75,100].map(pct=>{
    const pts = axes.map((_,i)=>pt(i,pct).join(',')).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#e5eae6" stroke-width="1"/>`;
  }).join('');
  const spokes = axes.map((_,i)=>{const [x,y]=pt(i,100);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e5eae6" stroke-width="1"/>`}).join('');
  const labels = axes.map((a,i)=>{
    const [x,y]=pt(i,124);
    const ang = (Math.PI*2*i/n) - Math.PI/2;
    const cosA = Math.cos(ang);
    const anchor = cosA>0.25 ? 'start' : (cosA<-0.25 ? 'end' : 'middle');
    return `<text x="${x}" y="${y}" font-size="8.5" fill="#647069" text-anchor="${anchor}">${a}</text>`;
  }).join('');
  const shapes = seriesList.map(s=>{
    const pts = s.values.map((v,i)=>pt(i,v).join(',')).join(' ');
    return `<polygon points="${pts}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2" stroke-dasharray="${s.dash||''}"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="radar">${rings}${spokes}${shapes}${labels}</svg>`;
}

/* --- bloque de mapa reutilizable --- */
function mapBlock(opts){
  opts=opts||{};
  const dots = (opts.dots||[]).map(d=>`<span class="dot ${d.c||''}" style="left:${d.x}%;top:${d.y}%"></span>`).join('');
  const labels = (opts.labels||[]).map(l=>`<span class="map-label" style="left:${l.x}%;top:${l.y}%">${l.t}</span>`).join('');
  const legend = opts.legend ? `<div class="legend-box"><div class="lgtitle">${opts.legend.title}</div>${opts.legend.rows.map(r=>`<div class="lgrow"><span class="dot ${r.c||''}" style="position:static"></span>${r.t}</div>`).join('')}</div>` : '';
  return `<div class="map ${opts.small?'small':''}">${legend}${dots}${labels}
    <div class="map-controls"><button>+</button><button>−</button></div>
    ${opts.cta?`<div class="map-cta"><button class="btn solid" style="background:#fff;color:var(--green)">${opts.cta}</button></div>`:''}
  </div>`;
}

/* ============================================================
   RENDERERS DE MÓDULOS
   ============================================================ */

function dashboard(){
  return `
  <div class="grid kpis6">
    ${kpi('❤','','MEDICIONES REALIZADAS','2.486','Este mes vs. mes anterior','↑ 12%')}
    ${kpi('✓','blue','PETICIONES (PQRS)','1.352','Este mes vs. mes anterior','↓ 8%')}
    ${kpi('☺','','VISITAS IVC','1.028','Este mes vs. mes anterior','↑ 15%')}
    ${kpi('⚠','red','ALERTAS ACTIVAS','43','Hoy','')}
    ${kpi('~','purple','EMISIÓN / RUIDO AMBIENTAL','27','Este mes vs. mes anterior','↑ 5%')}
    ${kpi('◍','blue','ESTUDIOS DE CARACTERIZACIÓN','126','Este mes','')}
  </div>

  <div class="grid dash-mid" style="margin-top:12px">
    <div class="card">
      <h3 class="section-title">COMPORTAMIENTO AMBIENTAL <span class="info">ⓘ</span></h3>
      <p class="sub">Evolución de los principales temas ambientales</p>
      <div class="tabgroup">
        <div class="tabx active">Recurso hídrico</div><div class="tabx">Visitas IVC</div><div class="tabx">PQRS / Peticiones</div><div class="tabx">Ruido ambiental</div>
      </div>
      <p class="tiny" style="margin-bottom:6px">Índice de afectación del recurso hídrico superficial</p>
      ${lineCard([{name:'Índice',color:'var(--green)',values:[28,42,38,55,68,52]}],['Dic 2024','Ene 2025','Feb 2025','Mar 2025','Abr 2025','May 2025'])}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <div><div class="metric">52%</div><span class="tiny">Moderado</span></div>
        <span class="up">↑ 8% vs. mes anterior</span>
      </div>
      <div class="card-link">Ver más indicadores y análisis detallados ›</div>
    </div>

    <div class="card">
      <h3 class="section-title">PANORAMA TERRITORIAL <span class="info">ⓘ</span></h3>
      <p class="sub">Resumen del estado ambiental por territorio</p>
      ${mapBlock({
        legend:{title:'Convenciones',rows:[
          {t:'Puntos de calor (atención de visitas)',c:''},
          {t:'Visitas IVC',c:'green'},
          {t:'Peticiones (PQRS)',c:'blue'},
          {t:'Vertimientos',c:'purple'},
          {t:'Puntos de monitoreo',c:'tri'},
          {t:'Pozos',c:'yellow'}
        ]},
        dots:[{x:60,y:22,c:'green'},{x:74,y:30,c:'yellow'},{x:44,y:40,c:'blue'},{x:66,y:44,c:'green'},{x:35,y:55,c:'purple'},{x:52,y:62,c:'blue'},{x:70,y:65,c:'green'},{x:30,y:70,c:'tri'}],
        cta:'Ver en Geovisor ↗'
      })}
    </div>

    <div class="card">
      <div class="module-head" style="margin-bottom:8px"><h3 class="section-title">ALERTAS ACTIVAS <span class="info">ⓘ</span></h3><span class="tiny" style="color:var(--green);font-weight:700;cursor:pointer">Ver todas</span></div>
      <div class="alerts">
        ${alertRow('red','⚠','Incumplimiento de niveles máximos permisibles de ruido (Emisión)','3 establecimientos','Crítica','red')}
        ${alertRow('amber','~','Incumplimiento de niveles máximos permisibles de ruido (Ruido ambiental)','2 zonas','Alta','amber')}
        ${alertRow('blue','◍','Afectación al recurso hídrico superficial','5 puntos críticos','Media','blue')}
        ${alertRow('blue','◍','Volumen concedido vs. autoconsumo reportado','7 usuarios','Media','blue')}
        ${alertRow('green','▤','Vencimiento próximo de permisos y concesiones','12 registros','Media','blue')}
      </div>
      <div class="card-link">Ver todas las alertas y seguimiento ›</div>
      <p class="tiny" style="margin-top:8px">Las alertas incluyen seguimiento de IVC, caudales, vigencias, consumos y permisos.</p>
    </div>
  </div>

  <div class="grid quick">
    ${quickCard('☺','OBSERVATORIOS COMUNITARIOS','Consulta datos y reportes de los observatorios comunitarios.')}
    ${quickCard('☑','COMITÉ DE OPERACIONES','Consulta estadísticas y datos del comité de operaciones.')}
    ${quickCard('▥','BIOTECA','Accede a documentos, estudios, publicaciones y material ambiental.')}
    ${quickCard('▤','REPORTES','Genera y consulta reportes personalizados y oficiales.')}
    ${quickCard('⌂','ANTECEDENTES AMBIENTALES DEL PREDIO','Consulta el historial y antecedentes ambientales de un predio.')}
    ${quickCard('▯','APLICACIÓN MÓVIL','Trabajo en campo: registro de visitas, hallazgos y mediciones.','Próximamente')}
  </div>`;
}
function alertRow(icoCls,ico,text,sub,sev,pillCls){
  return `<div class="alert"><span class="aico ${icoCls}">${ico}</span><div><b>${text}</b><div class="tiny">${sub}</div></div><span class="pill ${pillCls}">${sev}</span></div>`;
}
function quickCard(ico,title,desc,tag){
  return `<div class="card"><div class="bubble">${ico}</div><h4>${title}</h4><p>${desc}</p><div class="card-link">${tag||'Ir al módulo ›'}</div></div>`;
}

/* ---------------- GEOVISOR ---------------- */
/* Estados de semáforo de las estaciones IoT (mismo criterio para ruido / aire / agua) */
const ESTADOS = {
  bueno:    { color: '#2ecc71', label: 'Bueno' },
  moderado: { color: '#f1c40f', label: 'Moderado' },
  alto:     { color: '#e67e22', label: 'Alto' },
  critico:  { color: '#e74c3c', label: 'Crítico' },
  inactivo: { color: '#95a5a6', label: 'Fuera de línea' }
};
/* En producción este arreglo se reemplaza por la respuesta de la API
   del Centro de Monitoreo Unificado Ambiental (CEMUA): fetch('https://api.dagma.gov.co/estaciones') */
const geoStations = [
  { id:1,  nombre:'Ecoparque Río Pance',              lat:3.3230, lng:-76.5980, estado:'bueno',    pm25:6.1,  pm10:9.4,  ruido:48.2, ica:82, comuna:'Pance' },
  { id:2,  nombre:'Club Farallones',                  lat:3.2990, lng:-76.5750, estado:'bueno',    pm25:7.8,  pm10:11.2, ruido:51.0, ica:79, comuna:'Pance' },
  { id:3,  nombre:'Vereda La Buitrera',                lat:3.3400, lng:-76.6030, estado:'moderado', pm25:14.5, pm10:22.1, ruido:58.4, ica:68, comuna:'La Buitrera' },
  { id:4,  nombre:'Carrera 125 - La Vitrera',          lat:3.3340, lng:-76.5700, estado:'bueno',    pm25:8.9,  pm10:13.0, ruido:53.1, ica:75, comuna:'La Vitrera' },
  { id:5,  nombre:'Ciudad Pacífico',                   lat:3.3560, lng:-76.5470, estado:'moderado', pm25:18.2, pm10:27.6, ruido:61.7, ica:63, comuna:'Comuna 22' },
  { id:6,  nombre:'Hacienda Cataluña',                 lat:3.3480, lng:-76.5560, estado:'bueno',    pm25:9.3,  pm10:14.4, ruido:52.9, ica:77, comuna:'Comuna 22' },
  { id:7,  nombre:'Universidad ICESI',                 lat:3.3390, lng:-76.5320, estado:'alto',     pm25:24.7, pm10:35.9, ruido:68.3, ica:55, comuna:'Comuna 22' },
  { id:8,  nombre:'Colegio Ntra. Sra. del Rosario',    lat:3.3745, lng:-76.5330, estado:'critico',  pm25:32.4, pm10:44.8, ruido:74.9, ica:41, comuna:'Comuna 19' },
  { id:9,  nombre:'Club Campestre de Cali',            lat:3.3800, lng:-76.5560, estado:'bueno',    pm25:7.0,  pm10:10.8, ruido:49.5, ica:81, comuna:'Comuna 17' },
  { id:10, nombre:'Cerro El Morro',                    lat:3.3830, lng:-76.5680, estado:'bueno',    pm25:5.4,  pm10:8.1,  ruido:45.0, ica:85, comuna:'Comuna 1' },
  { id:11, nombre:'Alto del Rosario',                  lat:3.3900, lng:-76.5750, estado:'moderado', pm25:15.1, pm10:23.0, ruido:57.2, ica:66, comuna:'Comuna 1' },
  { id:12, nombre:'Universidad del Valle - Meléndez',  lat:3.3760, lng:-76.5390, estado:'alto',     pm25:26.9, pm10:38.2, ruido:66.4, ica:52, comuna:'Comuna 18' },
  { id:13, nombre:'Antiguo Basurero de Navarro',       lat:3.3820, lng:-76.4970, estado:'critico',  pm25:38.6, pm10:52.3, ruido:71.5, ica:33, comuna:'Navarro' },
  { id:14, nombre:'Estación Villacarmelo',             lat:3.3120, lng:-76.5250, estado:'inactivo', pm25:null, pm10:null, ruido:null, ica:null, comuna:'Villacarmelo' }
];
const CALI_CENTER = [3.3520, -76.5450];
let geoMap = null, geoMarkers = [];

/* =========================================================
   MEJORAS PANTALLA DE INICIO — ROL CIUDADANO (RF-05 a RF-10)
   Ver: Requerimientos_Mejora_Home_Ciudadano.pdf, Etapas 2 y 3.
   Nota: la comuna/corregimiento asignada a cada estación en
   geoStations es ilustrativa para este prototipo (no proviene
   de una capa geográfica real de límites comunales).
   ========================================================= */

/* ---- RF-08: personalización por comuna/barrio (mock con localStorage,
   tal como lo define la sección 2 del PDF para la Etapa 3) ---- */
const ZONAS = ['Toda la ciudad','Comuna 1','Comuna 17','Comuna 18','Comuna 19','Comuna 22','La Buitrera','La Vitrera','Navarro','Pance','Villacarmelo'];
state.zona = (function(){
  try { return localStorage.getItem('oa_zona') || 'Toda la ciudad'; } catch(e){ return 'Toda la ciudad'; }
})();

function setZona(z){
  state.zona = z;
  try { localStorage.setItem('oa_zona', z); } catch(e){ /* localStorage no disponible: la selección solo dura la sesión */ }
  pushNotifiedOnce = false;
  const sheet = document.getElementById('sheet-zona');
  if(sheet) sheet.hidden = true;
  if(location.hash === '#home') load('home');
}

function haversineKm(lat1,lng1,lat2,lng2){
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

function detectarZonaPorUbicacion(){
  const btn = document.getElementById('zona-geoloc');
  if(!navigator.geolocation){ alert('Este navegador no soporta geolocalización.'); return; }
  if(btn) btn.textContent = '⌖ Detectando tu ubicación…';
  navigator.geolocation.getCurrentPosition(pos=>{
    const {latitude,longitude} = pos.coords;
    let closest = geoStations[0], min = Infinity;
    geoStations.forEach(s=>{
      const d = haversineKm(latitude,longitude,s.lat,s.lng);
      if(d<min){ min=d; closest=s; }
    });
    setZona(closest.comuna);
  }, ()=>{
    if(btn) btn.textContent = '⌖ Usar mi ubicación';
    alert('No fue posible obtener tu ubicación. Puedes elegir tu zona manualmente en la lista.');
  }, { timeout:8000 });
}

function renderZonaSheet(){
  const list = document.getElementById('sheet-zona-list');
  if(list) list.innerHTML = ZONAS.map(z=>`
    <div class="sheet-item" data-zona="${z}" style="cursor:pointer">
      <span class="si-ico">${z===state.zona?'✓':'📍'}</span>
      <div><b>${z}</b>${z==='Toda la ciudad'?'<span>Promedio general de la ciudad</span>':`<span>${stationsInZona(z).length} estación(es) de monitoreo</span>`}</div>
    </div>`).join('');
  list?.querySelectorAll('[data-zona]').forEach(it=>{
    it.addEventListener('click', ()=> setZona(it.dataset.zona));
  });
  const geolocBtn = document.getElementById('zona-geoloc');
  if(geolocBtn){ geolocBtn.textContent = '⌖ Usar mi ubicación'; geolocBtn.onclick = detectarZonaPorUbicacion; }
}
function stationsInZona(zona){
  return (!zona || zona==='Toda la ciudad') ? geoStations : geoStations.filter(s=>s.comuna===zona);
}

const SEVERIDAD_ORDEN = { bueno:0, moderado:1, alto:2, critico:3 };
function zonaResumen(zona){
  const list = stationsInZona(zona);
  const activas = list.filter(s=>s.estado!=='inactivo');
  const avg = key => activas.length ? Math.round(activas.reduce((a,s)=>a+s[key],0)/activas.length) : null;
  const peor = activas.reduce((w,s)=> (SEVERIDAD_ORDEN[s.estado]>SEVERIDAD_ORDEN[w?w.estado:'bueno']) ? s : w, null);
  return {
    ica: avg('ica'), ruido: avg('ruido'), pm25: avg('pm25'),
    estado: peor ? peor.estado : 'bueno',
    totalEstaciones: list.length, estacionesActivas: activas.length
  };
}

/* ---- Fuente única de alertas activas: alimenta el mini-mapa (RF-05),
   "Le puede interesar" (RF-07) y las notificaciones (RF-09) ---- */
function getActiveAlerts(zonaFiltro){
  const alerts = [];
  stationsInZona(zonaFiltro).forEach(s=>{
    if(s.estado==='critico') alerts.push({ sev:3, icon:'⚠', title:`Estación en estado crítico: ${s.nombre}`, sub:`${s.comuna} · PM2.5 ${s.pm25} µg/m³`, nav:'geovisor', stationId:s.id });
    else if(s.estado==='inactivo') alerts.push({ sev:1, icon:'◌', title:`Estación fuera de línea: ${s.nombre}`, sub:s.comuna, nav:'geovisor', stationId:s.id });
  });
  expedientesRecursoHidrico.forEach(e=>{
    const v = estadoVigencia(e.vigencia);
    if(v.label==='Vencido') alerts.push({ sev:3, icon:'▤', title:`Permiso vencido: ${e.tipo}`, sub:`${e.titular} · ${e.comuna}`, nav:'gestion' });
    else if(v.label==='Por vencer') alerts.push({ sev:2, icon:'▤', title:`Permiso próximo a vencer: ${e.tipo}`, sub:`${e.titular} · vence ${e.vigencia}`, nav:'gestion' });
  });
  return alerts.sort((a,b)=>b.sev-a.sev);
}

/* ---- RF-05: vista previa del Geovisor en el home ---- */
let homeMiniMap = null;
function initHomeMiniMap(){
  const el = document.getElementById('home-mini-map');
  if(!el || typeof L==='undefined') return;
  if(homeMiniMap){ homeMiniMap.remove(); homeMiniMap=null; }
  const list = stationsInZona(state.zona);
  const center = list.length ? [list.reduce((a,s)=>a+s.lat,0)/list.length, list.reduce((a,s)=>a+s.lng,0)/list.length] : CALI_CENTER;
  homeMiniMap = L.map(el, { zoomControl:false, attributionControl:false, dragging:!L.Browser.mobile, scrollWheelZoom:false }).setView(center, list.length>1?13:14);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom:19 }).addTo(homeMiniMap);
  list.forEach(s=>{
    const icon = L.divIcon({ className:'', html:`<div class="estacion-marker" style="width:26px;height:26px;font-size:10px;background:${(ESTADOS[s.estado]||ESTADOS.inactivo).color}">${s.id}</div>`, iconSize:[26,26], iconAnchor:[13,13] });
    L.marker([s.lat,s.lng],{icon,title:s.nombre}).addTo(homeMiniMap).bindPopup(geoPopupContent(s));
  });
  setTimeout(()=>{ if(homeMiniMap) homeMiniMap.invalidateSize(); }, 80);
}

/* ---- RF-06: buscador en el home (estaciones, trámites y módulos) ---- */
const TRAMITES_HOME = [
  { label:'Solicitar concesión de agua', nav:'gestion' },
  { label:'Permiso de vertimientos', nav:'gestion' },
  { label:'Radicar denuncia o PQRS ambiental', nav:'consulta' },
  { label:'Descargar boletín ambiental', nav:'reportes' },
  { label:'Consultar catálogo de datos abiertos', nav:'catalogo' }
];
function homeSearchIndex(){
  const mods = visibleModules().map(m=>({ tipo:'Módulo', icon:m.icon, label:m.label, nav:m.id }));
  const trams = TRAMITES_HOME.map(t=>({ tipo:'Trámite', icon:'▤', label:t.label, nav:t.nav }));
  const est = geoStations.map((s,i)=>({ tipo:'Estación', icon:'⌖', label:s.nombre, station:i }));
  return [...mods, ...trams, ...est];
}
function wireHomeSearch(){
  const input = document.getElementById('home-search-input');
  const results = document.getElementById('home-search-results');
  if(!input || !results) return;
  const index = homeSearchIndex();
  let matches = [];
  const render = q=>{
    const term = q.trim().toLowerCase();
    if(!term){ results.hidden = true; results.innerHTML=''; return; }
    matches = index.filter(it=>it.label.toLowerCase().includes(term)).slice(0,7);
    results.innerHTML = matches.length ? matches.map((it,i)=>`
      <div class="m-search-item" data-i="${i}"><span>${it.icon}</span><span>${it.label}</span><span class="msi-tag">${it.tipo}</span></div>
    `).join('') : `<div class="m-search-item" style="cursor:default">Sin resultados para "${q}"</div>`;
    results.hidden = false;
    results.querySelectorAll('[data-i]').forEach(row=>{
      row.addEventListener('click', ()=>{
        const it = matches[Number(row.dataset.i)];
        results.hidden = true; input.value='';
        if(it.station!==undefined){ load('geovisor'); setTimeout(()=>selectGeoStation(it.station),150); }
        else load(it.nav);
      });
    });
  };
  input.addEventListener('input', ()=>render(input.value));
  input.addEventListener('focus', ()=>{ if(input.value) render(input.value); });
}

/* ---- RF-07: "Le puede interesar" dinámico, priorizado según alertas activas ---- */
function contenidoRelevante(){
  const alerts = getActiveAlerts(state.zona);
  if(!alerts.length){
    return `
    <button class="m-chip solid" data-nav="consulta">Denuncias ambientales</button>
    <button class="m-chip" data-nav="reportes">Boletín ambiental</button>
    <button class="m-chip" data-nav="indicadores">Preguntas frecuentes</button>`;
  }
  return alerts.slice(0,3).map((a,i)=>`<button class="m-chip ${i===0?'solid':''}" data-nav="${a.nav}">${a.icon} ${a.title}</button>`).join('');
}

/* ---- RF-09: notificaciones ----
   IMPORTANTE — límite real de esta implementación: esto usa la Notification API
   nativa del navegador (permiso + notificación local mientras la pestaña sigue
   abierta). NO es Web Push real: eso requiere backend + service worker + claves
   VAPID, que la sección 2 del PDF ubica explícitamente como "meta de evolución,
   no se simula en el prototipo estático". Como el requerimiento RF-09 pide
   sustituir el punto rojo simulado por algo real, esta es la aproximación más
   honesta posible sin esa infraestructura: el punto ahora refleja alertas reales
   calculadas de los datos (no un adorno fijo), y si el usuario da permiso,
   dispara una notificación real del sistema operativo. */
let pushNotifiedOnce = false;
function maybeNotifyCritical(){
  if(pushNotifiedOnce || !('Notification' in window) || Notification.permission!=='granted') return;
  const critica = getActiveAlerts(state.zona).find(a=>a.sev===3);
  if(critica){
    pushNotifiedOnce = true;
    try { new Notification('Observatorio Ambiental', { body: critica.title }); } catch(e){ /* algunos navegadores exigen un service worker para notificaciones; se omite en silencio */ }
  }
}
function renderAlertasSheet(){
  const alerts = getActiveAlerts(state.zona);
  const list = document.getElementById('sheet-alertas-list');
  const status = document.getElementById('alertas-push-status');
  const btn = document.getElementById('alertas-push-btn');
  if(list) list.innerHTML = alerts.length ? alerts.map(a=>`
    <div class="sheet-item" ${a.nav?`data-go="${a.nav}"`:''} style="cursor:${a.nav?'pointer':'default'}">
      <span class="si-ico">${a.icon}</span>
      <div><b>${a.title}</b><span>${a.sub||''}</span></div>
    </div>`).join('') : `<p class="tiny" style="padding:10px 4px">No tienes alertas activas por ahora.</p>`;
  list?.querySelectorAll('[data-go]').forEach(it=>{
    it.addEventListener('click', ()=>{ document.getElementById('sheet-alertas').hidden = true; load(it.dataset.go); });
  });
  if(!('Notification' in window)){
    if(status) status.textContent = 'Tu navegador no soporta notificaciones.';
    if(btn) btn.hidden = true;
  } else if(Notification.permission==='granted'){
    if(status) status.textContent = '✓ Notificaciones activadas en este dispositivo.';
    if(btn) btn.hidden = true;
  } else if(Notification.permission==='denied'){
    if(status) status.textContent = 'Bloqueaste las notificaciones para este sitio; actívalas desde los ajustes del navegador.';
    if(btn) btn.hidden = true;
  } else {
    if(status) status.textContent = 'Recibe un aviso cuando una estación de tu zona pase a estado crítico.';
    if(btn){
      btn.hidden = false;
      btn.onclick = ()=> Notification.requestPermission().then(()=>{ pushNotifiedOnce=false; renderAlertasSheet(); maybeNotifyCritical(); });
    }
  }
}

/* ---- RF-10: integración con datos reales del CEMUA / IDESC, con degradación segura ----
   LÍMITE REAL: no existe todavía una URL de API confirmada, con CORS habilitado y
   accesible desde este prototipo estático — el propio PDF (sección 2) ubica esta
   integración en la fase de "evolución a producción", fuera del alcance del
   prototipo actual. Lo que sí se puede construir ahora, y es lo que hace este
   bloque, es la capa de integración lista para consumir la API real apenas exista:
   intenta el fetch documentado y, si falla (sin backend, sin red, CORS, etc.),
   conserva los datos de referencia locales sin romper la experiencia. */
const API_ESTACIONES_URL = 'https://api.dagma.gov.co/estaciones';
const API_VISITAS_URL = 'https://api.dagma.gov.co/recurso-hidrico/visitas';
async function fetchConFallback(url, fallbackValue){
  try {
    const ctrl = typeof AbortController!=='undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(()=>ctrl.abort(), 4000) : null;
    const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
    if(t) clearTimeout(t);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    if(!Array.isArray(data) || !data.length) throw new Error('Respuesta vacía');
    return data;
  } catch(err){
    console.info('[CEMUA/IDESC] API real no disponible todavía, se mantienen los datos de referencia locales:', err.message);
    return fallbackValue;
  }
}
async function cargarDatosReales(){
  const estacionesReales = await fetchConFallback(API_ESTACIONES_URL, null);
  if(estacionesReales){ geoStations.length = 0; geoStations.push(...estacionesReales); }
  const visitasReales = await fetchConFallback(API_VISITAS_URL, null);
  if(visitasReales){ visitasRecursoHidrico.length = 0; visitasRecursoHidrico.push(...visitasReales); }
  if((estacionesReales || visitasReales) && location.hash==='#home') load('home');
}

function geoPopupContent(s){
  const cfg = ESTADOS[s.estado] || ESTADOS.inactivo;
  const dato = (v,u) => (v===null||v===undefined) ? '— sin datos —' : `${v} ${u}`;
  return `<div class="popup-estacion">
    <h4>${s.nombre}</h4>
    <div class="direccion">Estación de monitoreo · ID ${s.id}</div>
    <div class="fila-dato"><span>PM 2.5</span><b>${dato(s.pm25,'µg/m³')}</b></div>
    <div class="fila-dato"><span>PM 10</span><b>${dato(s.pm10,'µg/m³')}</b></div>
    <div class="fila-dato"><span>Ruido</span><b>${dato(s.ruido,'dB')}</b></div>
    <div class="fila-dato"><span>ICA (agua)</span><b>${dato(s.ica,'')}</b></div>
    <span class="estado-pill" style="background:${cfg.color}">${cfg.label}</span>
  </div>`;
}
function geovisor(){
  return `
  <div class="card geo-map-card">
    <div class="geo-map-wrap">
      <div id="geo-leaflet-map" class="geo-leaflet"></div>
      <div class="geo-map-rail">
        <button title="Capas y hallazgos" id="geo-rail-layers">☰</button>
        <button title="Información" id="geo-rail-info">ⓘ</button>
        <button title="Buscar estación" id="geo-rail-search">⌕</button>
      </div>
      <div class="geo-search-dropdown" id="geo-search-dropdown" hidden></div>

      <div class="geo-drawer" id="geo-drawer">
        <div class="geo-drawer-head">
          <h3 class="section-title">Capas y hallazgos</h3>
          <button class="geo-popup-close" id="geo-drawer-close">✕</button>
        </div>
        <div class="geo-drawer-body">
          <div class="layers-group"><h5>Capas principales</h5>
            ${layerRow('Perímetro urbano y rural',1)}${layerRow('Límite comunas y corregimientos',1)}${layerRow('Áreas de actividad',1)}
          </div>
          <div class="layers-group"><h5>Recurso hídrico</h5>
            ${layerRow('Ríos principales',1)}${layerRow('Tributarios',1)}${layerRow('Cuerpos lénticos',0)}${layerRow('Fuentes hídricas',0)}${layerRow('Tramos PORH',0)}${layerRow('Franjas protectoras',0)}
          </div>
          <div class="layers-group"><h5>Puntos de interés</h5>
            ${layerRow('Visitas IVC',1)}${layerRow('Peticiones (PQRS)',1)}${layerRow('Vertimientos',1)}${layerRow('Estaciones IoT de monitoreo',1)}${layerRow('Calidad del aire (PM2.5 / PM10)',1)}${layerRow('Pozos',0)}
          </div>
          <p class="tiny" style="margin:6px 0 14px">El estado de cada estación IoT se muestra en la leyenda del mapa, abajo a la izquierda.</p>
          <h5 style="font-size:10px;color:var(--muted);margin:0 0 4px">Hallazgos georreferenciados</h5>
          ${finding('Vertimiento sin permiso','Río Cañaveralejo · Comuna 22 · 12/05/2025','Pendiente','amber')}
          ${finding('Ocupación de cauce','Quebrada La Chorrera · Comuna 18 · 10/05/2025','Atendido','')}
          ${finding('Descarga al alcantarillado','Comuna 15 · 08/05/2025','En verificación','blue')}
          <div class="filters" style="margin-top:12px"><button class="btn">⇩ Descargar capas</button><button class="btn solid">⇧ Exportar selección</button></div>
          <p class="tiny" style="margin-top:8px">Formatos: SHP, KML, GeoJSON. Información oficial del DAGMA y entidades aliadas.</p>
        </div>
      </div>
    </div>
  </div>`;
}
function initGeoMap(){
  const el = document.getElementById('geo-leaflet-map');
  if(!el || typeof L === 'undefined') return;
  if(geoMap){ geoMap.remove(); geoMap = null; }
  geoMap = L.map(el, {zoomControl:false}).setView(CALI_CENTER, 12);
  /* Esri en vez de tile.openstreetmap.org: sus servidores bloquean (403)
     apps externas que no cumplan su política de uso, ya lo confirmamos. */
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> — Esri, HERE, Garmin, FAO, NOAA, USGS'
  }).addTo(geoMap);
  L.control.zoom({position:'bottomright'}).addTo(geoMap);

  const Leyenda = L.control({position:'bottomleft'});
  Leyenda.onAdd = function(){
    const div = L.DomUtil.create('div','leyenda');
    div.innerHTML = `<b>Estado de la estación</b>${Object.values(ESTADOS).map(e=>`<div class="fila"><span class="punto" style="background:${e.color}"></span>${e.label}</div>`).join('')}`;
    return div;
  };
  Leyenda.addTo(geoMap);

  geoMarkers = geoStations.map(s=>{
    const cfg = ESTADOS[s.estado] || ESTADOS.inactivo;
    const icon = L.divIcon({
      className: '',
      html: `<div class="estacion-marker" style="background:${cfg.color}">${s.id}</div>`,
      iconSize: [34,34],
      iconAnchor: [17,17],
      popupAnchor: [0,-14]
    });
    const marker = L.marker([s.lat, s.lng], {icon, title:s.nombre}).addTo(geoMap);
    marker.bindPopup(geoPopupContent(s));
    return marker;
  });
  setTimeout(()=>{ if(geoMap) geoMap.invalidateSize(); }, 80);

  const railLayers = document.getElementById('geo-rail-layers');
  const drawer = document.getElementById('geo-drawer');
  const drawerClose = document.getElementById('geo-drawer-close');
  if(railLayers && drawer){
    railLayers.addEventListener('click', e=>{
      e.stopPropagation();
      drawer.classList.toggle('open');
    });
  }
  if(drawerClose && drawer) drawerClose.addEventListener('click', ()=> drawer.classList.remove('open'));

  const railSearch = document.getElementById('geo-rail-search');
  const dropdown = document.getElementById('geo-search-dropdown');
  if(railSearch && dropdown){
    dropdown.innerHTML = geoStations.map((s,i)=>{
      const cfg = ESTADOS[s.estado] || ESTADOS.inactivo;
      return `<div class="geo-search-item" data-i="${i}"><span class="dotnum" style="background:${cfg.color}">${s.id}</span><span>${s.nombre}</span></div>`;
    }).join('');
    railSearch.addEventListener('click', e=>{
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });
    dropdown.addEventListener('click', e=>{
      const item = e.target.closest('.geo-search-item');
      if(!item) return;
      selectGeoStation(Number(item.dataset.i));
      dropdown.hidden = true;
    });
  }

  selectGeoStation(7); /* Colegio Ntra. Sra. del Rosario, seleccionada por defecto */
}
function selectGeoStation(i){
  const s = geoStations[i];
  const marker = geoMarkers[i];
  if(!s || !marker || !geoMap) return;
  geoMap.flyTo([s.lat, s.lng], 14, {duration:0.8});
  marker.openPopup();
}
function layerRow(text,checked){return `<div class="row"><span class="check">${checked?'☑':'☐'}</span><span>${text}</span></div>`}
function legendRow(cls,text){return `<div class="row"><span class="dot ${cls}" style="position:static"></span><span>${text}</span></div>`}
function finding(title,sub,status,cls){return `<div class="alert"><span class="aico amber">⚑</span><div><b>${title}</b><div class="tiny">${sub}</div></div><span class="pill ${cls}">${status}</span></div>`}

/* ---------------- INDICADORES ---------------- */
function indicadores(){
  return `
  <p class="tiny" style="margin:-4px 0 10px">Inspirado en el Sistema Integrado de Información Estadística Distrital (SIED) de Cali — elige una vía de entrada a los datos del Observatorio.</p>
  <div class="grid three" style="margin-bottom:16px">
    <div class="card" data-nav="analitica" style="cursor:pointer">
      <div class="ico-circle">⌁</div>
      <h3 class="section-title">Visor Comparativo</h3>
      <p class="tiny">Compara múltiples indicadores y territorios de forma interactiva.</p>
      <div class="card-link">Explorar ›</div>
    </div>
    <div class="card" data-nav="catalogo" style="cursor:pointer">
      <div class="ico-circle">◉</div>
      <h3 class="section-title">Explorador de Microdata</h3>
      <p class="tiny">Accede a los conjuntos de datos desagregados y descárgalos para tu propio análisis.</p>
      <div class="card-link">Explorar ›</div>
    </div>
    <div class="card" data-nav="indicadores" style="cursor:pointer">
      <div class="ico-circle">▥</div>
      <h3 class="section-title">Indicadores ODS</h3>
      <p class="tiny">Consulta los indicadores ambientales clave y su relación con los Objetivos de Desarrollo Sostenible.</p>
      <div class="card-link">Ver indicadores ›</div>
    </div>
  </div>

  <div class="module-head">
    <div class="searchbox" style="flex:1"><input placeholder="⌕ Buscar indicador..."></div>
    <div class="filters">
      ${filterField('Tema','Todos')}${filterField('Subtema','Todos')}${filterField('Territorio','Todos')}${filterField('Periodo','Ene 2024 - May 2025')}
      <button class="btn">↺ Limpiar filtros</button>
    </div>
  </div>

  <div class="grid three">
    ${indKpi('☺','ATENCIÓN DE VISITAS / PQRS POR RÍOS, COMUNAS, BARRIOS','65','Moderado','estable')}
    ${indKpi('⌖','% DE AFECTACIÓN DE LAS FRANJAS PROTECTORAS','38%','Bueno','mejora')}
    ${indKpi('♻','COBERTURA VEGETAL','52%','Estable','estable')}
  </div>

  <div class="grid two" style="margin-top:12px">
    <div class="card">
      <h3 class="section-title">TENDENCIA DE INDICADORES <span class="info">ⓘ</span></h3>
      <div class="tabs"><div class="tab active">Comparativo de tiempo</div><div class="tab">Comportamiento histórico</div></div>
      <p class="tiny" style="margin-bottom:8px">Series de tiempo por intervalos seleccionables (1 día, 7 días, 1 mes, 3 meses, 6 meses, 1 año).</p>
      ${lineCard([
        {name:'Cobertura vegetal (%)',color:'var(--green)',values:[62,66,70,68,74,72,76,78,80,79,84,82]},
        {name:'Afectación de franjas (%)',color:'var(--blue)',values:[40,44,42,48,45,50,47,52,49,54,50,56]},
        {name:'Calidad del agua (Índice ICA)',color:'var(--purple)',values:[38,42,36,40,44,38,42,46,40,44,42,48]},
        {name:'Atención de PQRS / visitas',color:'var(--amber)',values:[20,24,22,26,24,28,26,30,28,32,30,34]}
      ],['Ene 2024','Mar 2024','May 2024','Jul 2024','Sep 2024','Nov 2024','Ene 2025','Mar 2025','May 2025'])}
      <button class="btn" style="width:100%;margin-top:10px">📈 Ver series completas</button>
    </div>
    <div class="card">
      <h3 class="section-title">IDENTIFICACIÓN DEL PUNTO DE MEDICIÓN <span class="info">ⓘ</span></h3>
      <p class="tiny" style="background:#f3f6f4;padding:9px;border-radius:8px;margin-bottom:10px">ⓘ Seleccione un punto en el mapa o en el listado para consultar el detalle del indicador en el tiempo.</p>
      ${infoRow('Código del punto','PM-CA-0156')}${infoRow('Nombre del sitio','Río Cañaveralejo - Comuna 22')}
      ${infoRow('Tipo de elemento','Punto de monitoreo')}${infoRow('Entidad responsable','DAGMA')}
      ${infoRow('Coordenadas','3.402500, -76.520300')}${infoRow('Fecha de última medición','08/05/2025')}
      ${infoRow('Estado', pill('Activo'))}
      <button class="btn" style="width:100%;margin-top:10px">Ver ficha completa ↗</button>
    </div>
  </div>

  <div class="grid two" style="margin-top:12px">
    <div class="card">
      <h3 class="section-title">INDICADORES DISPONIBLES <span class="info">ⓘ</span></h3>
      ${table(['Indicador','Tema','Último valor','Tendencia','Estado'],[
        ['● Cobertura vegetal (%)','Biodiversidad','52%','↗','<span class="pill">Estable</span>'],
        ['● Afectación de franjas protectoras (%)','Recurso hídrico','38%','↗','<span class="pill">Bueno</span>'],
        ['● Calidad del agua (ICA)','Recurso hídrico','72','↝','<span class="pill amber">Moderado</span>'],
        ['● Atención de PQRS / visitas','Gestión','65','↝','<span class="pill amber">Moderado</span>'],
        ['● Ruido ambiental (dB)','Atmosférico','58','↗','<span class="pill">Bueno</span>']
      ])}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver todos los indicadores</button>
    </div>
    <div class="card">
      <h3 class="section-title">METAS E INDICADORES CLAVE <span class="info">ⓘ</span></h3>
      <div class="radar-wrap">
        ${radar(['Cobertura vegetal (%)','Afectación de franjas (%)','Calidad del agua (ICA)','Atención de PQRS / visitas','Ruido ambiental (dB)'],[
          {values:[80,70,72,65,58],fill:'rgba(14,124,66,.18)',stroke:'var(--green)'},
          {values:[100,100,100,100,100],fill:'none',stroke:'#c8d2cb',dash:'3 3'}
        ])}
      </div>
      <div class="legend-inline" style="justify-content:center"><span><i class="dotlg" style="background:var(--green)"></i>Valor actual</span><span><i class="dotlg" style="background:#c8d2cb"></i>Meta</span></div>
    </div>
  </div>`;
}
function indKpi(ico,title,value,estado,tendencia){
  return `<div class="card kpi">
    <div class="kpi-top"><div class="bubble">${ico}</div><h3>${title}</h3></div>
    <div class="metric-row"><span class="metric">${value}</span></div>
    <div class="kpi-foot"><span>${estado}</span><span class="tiny">● Tendencia ${tendencia}</span></div>
  </div>`;
}
function filterField(label,value){return `<div class="filter">${label}<br><b>${value}</b></div>`}
function infoRow(label,value){return `<div class="list-item"><span class="tiny">${label}</span><b>${value}</b></div>`}

/* ---------------- ANALÍTICA ---------------- */
function analitica(){
  return `
  <div class="module-head">
    <div class="filters">${filterField('Variable','Todas')}${filterField('Territorio','Todos')}${filterField('Periodo','Ene 2024 - May 2025')}<button class="btn solid">Aplicar</button></div>
    <button class="btn">↺ Limpiar filtros</button>
  </div>
  <div class="tabs"><div class="tab active">Tendencias</div><div class="tab">Comparación territorial</div><div class="tab">Cruce de variables</div></div>

  <div class="grid four">
    ${kpi('☺','','QUEJAS VS. VISITAS IVC','1.352','Quejas (PQRS) · 1.028 Visitas IVC','+ 324 ↑')}
    ${kpi('❤','purple','MEDICIONES CON EXCEDENCIAS','18%','236 de 1.312 · vs. periodo anterior','↑ 5 pp')}
    ${kpi('◍','blue','CAUDAL CONCEDIDO VS. AUTOREPORTE','2.45 / 1.87','Concedido / autoreporte real (m³/s)','Cumplimiento 76%')}
    ${kpi('~','amber','ÁREA DE ACT. ECONÓMICA VS. NMP RUIDO','23','Zonas en incumplimiento','↑ 3 zonas')}
  </div>

  <div class="grid three" style="margin-top:12px">
    <div class="card">
      <div class="module-head" style="margin-bottom:6px"><h3 class="section-title">COMPARACIÓN DE VARIABLES</h3><span class="tiny">Barras agrupadas</span></div>
      <p class="tiny" style="margin-bottom:8px">Comparación de variables principales</p>
      ${fakeBars([48,66,82,58,78,45],['Visitas IVC','PQRS (Quejas)','Vertimientos','Ruido ambiental (dB)','Mediciones con excedencias (%)',''])}
      <p class="tiny" style="margin-top:8px">Los valores representan totales o promedios según la variable seleccionada.</p>
      <button class="btn" style="width:100%;margin-top:8px">▦ Ver tabla de datos</button>
    </div>
    <div class="card">
      <div class="module-head" style="margin-bottom:6px"><h3 class="section-title">COMPARACIÓN TERRITORIAL</h3><span class="tiny">Visitas IVC</span></div>
      <p class="tiny" style="margin-bottom:8px">Resultado por territorio según variable seleccionada</p>
      ${mapBlock({
        legend:{title:'Comuna 22',rows:[{t:'Visitas IVC: 82',c:''},{t:'PQRS: 67',c:''},{t:'Vertimientos: 12',c:''},{t:'Cumplimiento: 72%',c:''}]},
        dots:[]
      })}
      <button class="btn" style="width:100%;margin-top:8px">📊 Ver ranking territorial</button>
    </div>
    <div class="card">
      <div class="module-head" style="margin-bottom:6px"><h3 class="section-title">VISITAS POR COMUNA POR PERIODO</h3><span class="tiny">Línea</span></div>
      <p class="tiny" style="margin-bottom:8px">Número de visitas IVC</p>
      ${lineCard([
        {name:'Comuna 1',color:'var(--green)',values:[42,55,60,58,64,70,66,74]},
        {name:'Comuna 5',color:'var(--blue)',values:[30,36,40,44,42,48,46,52]},
        {name:'Comuna 18',color:'var(--purple)',values:[24,30,28,34,32,38,36,40]},
        {name:'Comuna 22',color:'var(--amber)',values:[18,22,20,26,24,28,26,30]},
        {name:'Otros',color:'#9aa79f',values:[10,12,14,12,16,14,18,16]}
      ],['Ene 2024','Mar 2024','May 2024','Jul 2024','Sep 2024','Nov 2024','Ene 2025','May 2025'])}
    </div>
  </div>

  <div class="grid three" style="margin-top:12px">
    <div class="card" style="grid-column:span 1">
      <div class="module-head" style="margin-bottom:6px"><h3 class="section-title">ANÁLISIS DE QUEJAS POR COMUNA</h3></div>
      <p class="tiny" style="margin-bottom:6px">Selecciona variable y periodo para ver el detalle.</p>
      <div class="filters" style="margin-bottom:10px">${filterField('Variable','Quejas (PQRS)')}${filterField('Periodo','Ene 2024 - May 2025')}</div>
      ${hbars([{l:'Comuna 22',v:186},{l:'Comuna 18',v:142},{l:'Comuna 13',v:98},{l:'Comuna 7',v:87},{l:'Comuna 1',v:76},{l:'Otras comunas',v:115}])}
    </div>
    <div class="card">
      <h3 class="section-title">HALLAZGOS DESTACADOS</h3>
      <ul style="margin:10px 0;padding-left:16px;font-size:11px;color:#33413a;line-height:1.9">
        <li>La Comuna 22 concentra el 24% del total de quejas.</li>
        <li>Las quejas por ruido ambiental aumentaron 15% vs. el periodo anterior.</li>
        <li>Vertimientos irregulares reportados en 12 comunas.</li>
      </ul>
      <div class="card-link">Ver análisis detallado ›</div>
    </div>
    <div class="card">
      <h3 class="section-title">GENERAR REPORTE ANALÍTICO</h3>
      <p class="tiny" style="margin:8px 0 14px">Crea informes personalizados con los análisis y visualizaciones actuales.</p>
      <button class="btn solid" style="width:100%">▤ Generar reporte</button>
    </div>
  </div>`;
}

/* ---------------- GESTIÓN Y SEGUIMIENTO AMBIENTAL ---------------- */
/* ---------------- RECURSO HÍDRICO: REGISTRO Y HISTÓRICO DE VISITAS ---------------- */
/* Estado de vista interno del módulo: 'main' | 'registrar' | 'historico' */
let gestionView = 'main';
let visitaFeedback = null; // mensaje de éxito tras registrar/editar

/* ---- Catálogos reutilizados del propio módulo (expedientes, técnicos, hallazgos) ---- */
/* ---- Utilidades de fecha para vigencias y alertas ---- */
function addDaysStr(days){
  const d = new Date(); d.setDate(d.getDate()+days);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function parseDDMMYYYY(str){
  if(!str) return null;
  const [dd,mm,yyyy] = str.split('/').map(Number);
  if(!dd||!mm||!yyyy) return null;
  return new Date(yyyy,mm-1,dd);
}
function estadoVigencia(fechaStr){
  const f = parseDDMMYYYY(fechaStr);
  if(!f) return { label:'Suspendido', cls:'grey', dias:null };
  const dias = Math.round((f - new Date(new Date().toDateString())) / 86400000);
  if(dias < 0) return { label:'Vencido', cls:'red', dias };
  if(dias <= 60) return { label:'Por vencer', cls:'amber', dias };
  return { label:'Vigente', cls:'', dias };
}

const riosRecursoHidrico = ['Río Cali','Río Cañaveralejo','Río Meléndez','Río Lili','Río Pance','Río Aguacatal','Río Cauca'];
const tramosRecursoHidrico = ['Tramo 1 - Cabecera','Tramo 2 - Medio','Tramo 3 - Desembocadura','Tramo urbano','Tramo rural'];
const tiposCuerpoAgua = ['Río','Quebrada','Humedal','Derivación'];

const expedientesRecursoHidrico = [
  { exp:'EXP-2025-0456', tipo:'Concesión de agua superficial', titular:'Acueducto Rural La Elvira', nit:'900.111.222-3', comuna:'La Elvira', predio:'Bocatoma acueducto rural', caudalConcesionado:'12 L/s', vigencia:addDaysStr(25) },
  { exp:'EXP-2025-0321', tipo:'Permiso de vertimientos', titular:'Industria Textil S.A.S.', nit:'900.333.444-5', comuna:'Yumbo', predio:'Planta de tratamiento industrial', caudalConcesionado:'8 L/s', vigencia:addDaysStr(400) },
  { exp:'EXP-2025-0187', tipo:'Ocupación de cauce', titular:'Constructora del Valle S.A.', nit:'900.555.666-7', comuna:'Pance', predio:'Proyecto urbanístico Ríos de Pance', caudalConcesionado:'—', vigencia:addDaysStr(-10) },
  { exp:'EXP-2024-0412', tipo:'Concesión de agua subterránea', titular:'Hacienda El Paraíso', nit:'900.777.888-9', comuna:'Jamundí', predio:'Pozo profundo Hacienda El Paraíso', caudalConcesionado:'5 L/s', vigencia:addDaysStr(200) },
  { exp:'EXP-2024-0298', tipo:'Permiso de prospección', titular:'Minera Andina S.A.', nit:'900.999.000-1', comuna:'Montebello', predio:'Zona de exploración Montebello', caudalConcesionado:'—', vigencia:null }
];
const tecnicosRecursoHidrico = ['Juan Pablo Rojas','Sofía Cardona','Carlos Andrés Méndez','Paula Andrea Ortiz'];
const categoriasHallazgo = ['Vertimientos sin permiso','Ocupación de cauce','Inadecuado manejo de residuos','Uso no autorizado del recurso hídrico','Intervención de rondas hídricas','Otro'];

/* En producción esto se reemplaza por GET/POST/PUT contra la API del
   Centro de Monitoreo Unificado Ambiental (CEMUA): /api/recurso-hidrico/visitas */
let visitasRecursoHidrico = [
  { id:1, expediente:'EXP-2025-0456', titular:'Acueducto Rural La Elvira', nit:'900.111.222-3', tipoExp:'Concesión de agua superficial', comuna:'La Elvira', predio:'Bocatoma acueducto rural',
    fecha:'12/05/2025', hora:'08:30 a. m.', numeroActa:'ACT-2025-0891', tipoVisita:'Seguimiento', tecnico:'Juan Pablo Rojas', apoyo:'', resultado:'Conforme', motivo:'Seguimiento rutinario a la concesión vigente.',
    rio:'Río Cañaveralejo', tramo:'Tramo 1 - Cabecera', tipoCuerpoAgua:'Río', nombreCuerpoAgua:'Río Cañaveralejo', lat:'3.4025', lng:'-76.5203', corregimiento:'', barrio:'', vereda:'', direccion:'',
    medidaPreventiva:false, vertimientoPresenta:false, vertimientoTipo:'', cumpleFP:true, caudalMedido:'11.4 L/s',
    hallazgos:[], seguimiento:false, obs:'Sin novedades. Caudal dentro de los rangos esperados.' },
  { id:2, expediente:'EXP-2025-0187', titular:'Constructora del Valle S.A.', nit:'900.555.666-7', tipoExp:'Ocupación de cauce', comuna:'Pance', predio:'Proyecto urbanístico Ríos de Pance',
    fecha:'11/05/2025', hora:'02:10 p. m.', numeroActa:'ACT-2025-0902', tipoVisita:'Inspección PQRS', tecnico:'Sofía Cardona', apoyo:'Paula Andrea Ortiz', resultado:'Requiere acciones', motivo:'Atención a PQRS por posible ocupación de cauce sin permiso.',
    rio:'Río Pance', tramo:'Tramo rural', tipoCuerpoAgua:'Río', nombreCuerpoAgua:'Río Pance', lat:'3.3230', lng:'-76.5980', corregimiento:'Pance', barrio:'', vereda:'', direccion:'',
    medidaPreventiva:true, vertimientoPresenta:false, vertimientoTipo:'', cumpleFP:false, caudalMedido:'',
    hallazgos:[{categoria:'Ocupación de cauce', descripcion:'Se evidenció relleno parcial de la ronda hídrica.', requiereAccion:true, compromiso:'Retirar material de relleno', fechaLimite:'30/05/2025'}],
    seguimiento:true, tipoSeguimiento:'Visita', fechaSeguimiento:'10/06/2025', tecnicoSeguimiento:'Sofía Cardona', actividadSeguimiento:'Verificar retiro del material de relleno.',
    obs:'Se verificó ocupación de cauce reportada. Hallazgo registrado.' },
  { id:3, expediente:'EXP-2025-0456', titular:'Acueducto Rural La Elvira', nit:'900.111.222-3', tipoExp:'Concesión de agua superficial', comuna:'La Elvira', predio:'Bocatoma acueducto rural',
    fecha:'09/05/2025', hora:'09:45 a. m.', numeroActa:'ACT-2025-0876', tipoVisita:'Control', tecnico:'Juan Pablo Rojas', apoyo:'', resultado:'Conforme', motivo:'Control de volumen concedido vs. autoreporte.',
    rio:'Río Cañaveralejo', tramo:'Tramo 1 - Cabecera', tipoCuerpoAgua:'Río', nombreCuerpoAgua:'Río Cañaveralejo', lat:'3.4025', lng:'-76.5203', corregimiento:'', barrio:'', vereda:'', direccion:'',
    medidaPreventiva:false, vertimientoPresenta:false, vertimientoTipo:'', cumpleFP:true, caudalMedido:'12.1 L/s',
    hallazgos:[], seguimiento:false, obs:'Concesión vigente, volumen concedido acorde al autoreporte.' },
  { id:4, expediente:'EXP-2025-0321', titular:'Industria Textil S.A.S.', nit:'900.333.444-5', tipoExp:'Permiso de vertimientos', comuna:'Yumbo', predio:'Planta de tratamiento industrial',
    fecha:'07/05/2025', hora:'11:20 a. m.', numeroActa:'ACT-2025-0850', tipoVisita:'Seguimiento', tecnico:'Carlos Andrés Méndez', apoyo:'', resultado:'Conforme con observaciones', motivo:'Recorrido de rutina sobre el punto de vertimiento autorizado.',
    rio:'Río Cauca', tramo:'Tramo urbano', tipoCuerpoAgua:'Río', nombreCuerpoAgua:'Río Cauca', lat:'3.5730', lng:'-76.4970', corregimiento:'', barrio:'', vereda:'', direccion:'',
    medidaPreventiva:false, vertimientoPresenta:true, vertimientoTipo:'Industrial tratado', cumpleFP:true, caudalMedido:'',
    hallazgos:[], seguimiento:false, obs:'Recorrido de rutina, calidad del agua moderada.' }
];

/* ---- Estado del wizard "Registrar / Editar visita" ---- */
let visitaWizardStep = 0;
let visitaEditingId = null;   // null = nueva visita; id = editando una existente
let visitaDraft = null;       // datos capturados entre pasos
const WIZARD_STEPS = ['Expediente','Visita','Ubicación','Hallazgos','Seguimiento','Cierre'];

function nuevoDraft(){
  return {
    expediente:'', titular:'', nit:'', tipoExp:'', comuna:'', predio:'',
    fecha:new Date().toISOString().slice(0,10), hora:'09:00', numeroActa:'', tipoVisita:'Seguimiento', tecnico:tecnicosRecursoHidrico[0], apoyo:'', resultado:'Conforme', motivo:'',
    rio:'', tramo:'', tipoCuerpoAgua:'Río', nombreCuerpoAgua:'', corregimiento:'', barrio:'', vereda:'', direccion:'', lat:'', lng:'',
    hallazgos:[], seguimiento:false, tipoSeguimiento:'Visita', fechaSeguimiento:'', tecnicoSeguimiento:tecnicosRecursoHidrico[0], actividadSeguimiento:'',
    medidaPreventiva:false, vertimientoPresenta:false, vertimientoTipo:'', cumpleFP:true, caudalMedido:'',
    obs:''
  };
}

function rhActionsRow(){
  return `<div class="rh-actions">
    <div class="rh-action-btn solid" data-rh="registrar" data-admin-only><span class="rab-ico">📝</span><b>Registrar visita</b></div>
    <div class="rh-action-btn" data-rh="historico"><span class="rab-ico">📜</span><b>Consultar histórico de visitas</b></div>
  </div>`;
}

/* ================= WIZARD: capturar valores del paso actual en el DOM ================= */
function capturarPasoActual(){
  if(!visitaDraft) return;
  const val = id => document.getElementById(id)?.value;
  const checked = id => document.getElementById(id)?.checked;
  switch(visitaWizardStep){
    case 0:
      visitaDraft.expediente = val('vw-expediente') ?? visitaDraft.expediente;
      visitaDraft.titular = val('vw-titular') ?? visitaDraft.titular;
      visitaDraft.nit = val('vw-nit') ?? visitaDraft.nit;
      visitaDraft.tipoExp = val('vw-tipoexp') ?? visitaDraft.tipoExp;
      visitaDraft.comuna = val('vw-comuna') ?? visitaDraft.comuna;
      visitaDraft.predio = val('vw-predio') ?? visitaDraft.predio;
      break;
    case 1:
      visitaDraft.fecha = val('vw-fecha') ?? visitaDraft.fecha;
      visitaDraft.hora = val('vw-hora') ?? visitaDraft.hora;
      visitaDraft.numeroActa = val('vw-acta') ?? visitaDraft.numeroActa;
      visitaDraft.tipoVisita = val('vw-tipovisita') ?? visitaDraft.tipoVisita;
      visitaDraft.tecnico = val('vw-tecnico') ?? visitaDraft.tecnico;
      visitaDraft.apoyo = val('vw-apoyo') ?? visitaDraft.apoyo;
      visitaDraft.resultado = val('vw-resultado') ?? visitaDraft.resultado;
      visitaDraft.motivo = val('vw-motivo') ?? visitaDraft.motivo;
      break;
    case 2:
      visitaDraft.rio = val('vw-rio') ?? visitaDraft.rio;
      visitaDraft.tramo = val('vw-tramo') ?? visitaDraft.tramo;
      visitaDraft.tipoCuerpoAgua = val('vw-tipocuerpo') ?? visitaDraft.tipoCuerpoAgua;
      visitaDraft.nombreCuerpoAgua = val('vw-nombrecuerpo') ?? visitaDraft.nombreCuerpoAgua;
      visitaDraft.corregimiento = val('vw-corregimiento') ?? visitaDraft.corregimiento;
      visitaDraft.barrio = val('vw-barrio') ?? visitaDraft.barrio;
      visitaDraft.vereda = val('vw-vereda') ?? visitaDraft.vereda;
      visitaDraft.direccion = val('vw-direccion') ?? visitaDraft.direccion;
      visitaDraft.lat = val('vw-lat') ?? visitaDraft.lat;
      visitaDraft.lng = val('vw-lng') ?? visitaDraft.lng;
      break;
    case 3: {
      const hayHallazgos = document.getElementById('vw-hall-si')?.checked;
      if(!hayHallazgos){ visitaDraft.hallazgos = []; break; }
      const cards = document.querySelectorAll('#hallazgos-list .hz-card');
      visitaDraft.hallazgos = [...cards].map((c,i)=>({
        categoria: c.querySelector(`#hz-categoria-${i}`)?.value || categoriasHallazgo[0],
        descripcion: c.querySelector(`#hz-desc-${i}`)?.value || '',
        requiereAccion: c.querySelector(`#hz-accion-${i}-si`)?.checked ?? true,
        compromiso: c.querySelector(`#hz-compromiso-${i}`)?.value || '',
        fechaLimite: c.querySelector(`#hz-fecha-${i}`)?.value || ''
      }));
      break;
    }
    case 4:
      visitaDraft.seguimiento = checked('vw-seg-si') ?? visitaDraft.seguimiento;
      if(visitaDraft.seguimiento){
        visitaDraft.tipoSeguimiento = val('vw-tiposeg') ?? visitaDraft.tipoSeguimiento;
        visitaDraft.fechaSeguimiento = val('vw-fechaseg') ?? visitaDraft.fechaSeguimiento;
        visitaDraft.tecnicoSeguimiento = val('vw-tecseg') ?? visitaDraft.tecnicoSeguimiento;
        visitaDraft.actividadSeguimiento = val('vw-actseg') ?? visitaDraft.actividadSeguimiento;
      }
      break;
    case 5:
      visitaDraft.medidaPreventiva = checked('vw-medprev-si') ?? visitaDraft.medidaPreventiva;
      visitaDraft.vertimientoPresenta = checked('vw-vert-si') ?? visitaDraft.vertimientoPresenta;
      visitaDraft.vertimientoTipo = val('vw-verttipo') ?? visitaDraft.vertimientoTipo;
      visitaDraft.cumpleFP = checked('vw-fp-si') ?? visitaDraft.cumpleFP;
      visitaDraft.caudalMedido = val('vw-caudalmedido') ?? visitaDraft.caudalMedido;
      visitaDraft.obs = val('vw-obsfinal') ?? visitaDraft.obs;
      break;
  }
}

function irAPaso(destino){
  capturarPasoActual();
  visitaWizardStep = Math.max(0, Math.min(WIZARD_STEPS.length-1, destino));
  load('gestion');
}

function agregarHallazgo(){
  capturarPasoActual();
  visitaDraft.hallazgos.push({categoria:categoriasHallazgo[0],descripcion:'',requiereAccion:true,compromiso:'',fechaLimite:''});
  load('gestion');
}
function eliminarHallazgo(i){
  capturarPasoActual();
  visitaDraft.hallazgos.splice(i,1);
  load('gestion');
}

function iniciarNuevaVisita(){
  visitaEditingId = null;
  visitaDraft = nuevoDraft();
  visitaWizardStep = 0;
  gestionView = 'registrar';
}
function iniciarEdicionVisita(id){
  const v = visitasRecursoHidrico.find(x=>x.id===id);
  if(!v) return;
  visitaEditingId = id;
  visitaDraft = JSON.parse(JSON.stringify(v)); // copia editable independiente
  visitaWizardStep = 0;
  gestionView = 'registrar';
  load('gestion');
}

function stepperHtml(){
  return `<div class="vw-steps">
    ${WIZARD_STEPS.map((s,i)=>`
      <span class="vw-dot ${i<=visitaWizardStep?'on':''}" title="${s}">${i+1}</span>
      ${i<WIZARD_STEPS.length-1?`<span class="vw-bar ${i<visitaWizardStep?'on':''}"></span>`:''}
    `).join('')}
  </div>
  <p class="tiny" style="text-align:center;margin:-8px 0 16px;color:var(--green);font-weight:700">${WIZARD_STEPS[visitaWizardStep]} · Paso ${visitaWizardStep+1} de ${WIZARD_STEPS.length}</p>`;
}

function opt(list,current){
  return list.map(v=>`<option ${v===current?'selected':''}>${v}</option>`).join('');
}
function toISO(fecha){
  if(!fecha) return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha; // ya está en formato ISO
  const m = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}
function toISOTime(hora){
  if(!hora) return '';
  if(/^\d{2}:\d{2}$/.test(hora)) return hora; // ya está en formato 24h
  const m = hora.match(/^(\d{1,2}):(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?)/i);
  if(!m) return '';
  let h = parseInt(m[1],10);
  const isPM = /p/i.test(m[3]);
  if(isPM && h<12) h+=12;
  if(!isPM && h===12) h=0;
  return `${String(h).padStart(2,'0')}:${m[2]}`;
}

function renderRegistrarVisita(){
  if(state.role!=='dagma'){
    gestionView='historico';
    return renderHistoricoVisitas();
  }
  if(!visitaDraft) visitaDraft = nuevoDraft();
  const d = visitaDraft;
  const step = visitaWizardStep;

  let body = '';
  if(step===0){
    body = `
    <h3 class="section-title" style="margin-bottom:3px">${visitaEditingId?'✎ Editar':'📝 Registrar'} visita · Expediente</h3>
    <p class="tiny" style="margin-bottom:14px">Selecciona el expediente sobre el que se realiza la visita. Los datos se autocompletan, pero puedes editarlos si es necesario.</p>
    <label class="field">Expediente
      <select id="vw-expediente" onchange="
        const e = expedientesRecursoHidrico.find(x=>x.exp===this.value);
        if(e){document.getElementById('vw-titular').value=e.titular;document.getElementById('vw-nit').value=e.nit;document.getElementById('vw-tipoexp').value=e.tipo;document.getElementById('vw-comuna').value=e.comuna;document.getElementById('vw-predio').value=e.predio;}
      ">
        <option value="">Selecciona un expediente...</option>
        ${expedientesRecursoHidrico.map(e=>`<option value="${e.exp}" ${e.exp===d.expediente?'selected':''}>${e.exp} · ${e.titular}</option>`).join('')}
      </select>
    </label>
    <label class="field">Titular / Razón social<input id="vw-titular" value="${d.titular}" placeholder="Nombre del titular"></label>
    <label class="field">NIT / Identificación<input id="vw-nit" value="${d.nit}" placeholder="900.000.000-0"></label>
    <label class="field">Tipo de expediente<input id="vw-tipoexp" value="${d.tipoExp}" placeholder="Concesión, permiso, ocupación de cauce..."></label>
    <label class="field">Comuna / territorio<input id="vw-comuna" value="${d.comuna}" placeholder="Comuna o corregimiento"></label>
    <label class="field">Predio / punto<input id="vw-predio" value="${d.predio}" placeholder="Nombre del predio o punto de monitoreo"></label>`;
  } else if(step===1){
    body = `
    <h3 class="section-title" style="margin-bottom:3px">📝 Información de la visita</h3>
    <p class="tiny" style="margin-bottom:14px">${d.expediente?`Expediente ${d.expediente} · ${d.titular}`:'Sin expediente asociado'}</p>
    <label class="field">Fecha de la visita<input type="date" id="vw-fecha" value="${toISO(d.fecha)}" required></label>
    <label class="field">Hora<input type="time" id="vw-hora" value="${toISOTime(d.hora)}" required></label>
    <label class="field">Número de acta<input id="vw-acta" value="${d.numeroActa}" placeholder="ACT-2026-000000"></label>
    <label class="field">Tipo de visita
      <select id="vw-tipovisita">${opt(['Seguimiento','Inicial','Control','Por requerimiento','Inspección PQRS'],d.tipoVisita)}</select>
    </label>
    <label class="field">Técnico responsable
      <select id="vw-tecnico">${opt(tecnicosRecursoHidrico,d.tecnico)}</select>
    </label>
    <label class="field">Personal de apoyo<input id="vw-apoyo" value="${d.apoyo}" placeholder="Nombres separados por coma (opcional)"></label>
    <label class="field">Resultado
      <select id="vw-resultado">${opt(['Conforme','Conforme con observaciones','Requiere acciones','Requiere seguimiento'],d.resultado)}</select>
    </label>
    <label class="field">Motivo de la visita<textarea id="vw-motivo" placeholder="Describe el objetivo de la visita...">${d.motivo}</textarea></label>`;
  } else if(step===2){
    body = `
    <h3 class="section-title" style="margin-bottom:3px">📍 Ubicación y georreferenciación</h3>
    <p class="tiny" style="margin-bottom:14px">Estandariza el punto exacto de la visita para que pueda geoprocesarse correctamente en el Geovisor.</p>
    <label class="field">Corriente / río<select id="vw-rio">${opt(riosRecursoHidrico,d.rio||riosRecursoHidrico[0])}</select></label>
    <label class="field">Tramo<select id="vw-tramo">${opt(tramosRecursoHidrico,d.tramo||tramosRecursoHidrico[0])}</select></label>
    <label class="field">Tipo de cuerpo de agua<select id="vw-tipocuerpo">${opt(tiposCuerpoAgua,d.tipoCuerpoAgua)}</select></label>
    <label class="field">Nombre del cuerpo de agua<input id="vw-nombrecuerpo" value="${d.nombreCuerpoAgua}" placeholder="Ej. Charco Azul"></label>
    <label class="field">Corregimiento<input id="vw-corregimiento" value="${d.corregimiento}" placeholder="Si aplica"></label>
    <label class="field">Barrio<input id="vw-barrio" value="${d.barrio}" placeholder="Si aplica"></label>
    <label class="field">Vereda<input id="vw-vereda" value="${d.vereda}" placeholder="Si aplica"></label>
    <label class="field">Dirección<input id="vw-direccion" value="${d.direccion}" placeholder="Dirección o referencia de ubicación"></label>
    <div class="grid twoeq">
      <label class="field">Latitud<input id="vw-lat" value="${d.lat}" placeholder="3.4025"></label>
      <label class="field">Longitud<input id="vw-lng" value="${d.lng}" placeholder="-76.5203"></label>
    </div>
    <button type="button" class="btn" style="width:100%" onclick="
      if(!navigator.geolocation){alert('Este navegador no soporta geolocalización.');return;}
      navigator.geolocation.getCurrentPosition(
        pos=>{document.getElementById('vw-lat').value=pos.coords.latitude.toFixed(5);document.getElementById('vw-lng').value=pos.coords.longitude.toFixed(5);},
        ()=>alert('No se pudo obtener tu ubicación. Ingrésala manualmente.')
      );
    ">⌖ Usar mi ubicación actual</button>`;
  } else if(step===3){
    const hay = d.hallazgos.length>0;
    body = `
    <h3 class="section-title" style="margin-bottom:3px">🚩 Hallazgos y compromisos</h3>
    <label class="field">¿Se encontraron hallazgos?
      <div class="vw-choice">
        <label><input type="radio" id="vw-hall-si" name="vw-hall" ${hay?'checked':''} onclick="visitaDraft.hallazgos.length||agregarHallazgo();"> Sí</label>
        <label><input type="radio" id="vw-hall-no" name="vw-hall" ${!hay?'checked':''} onclick="visitaDraft.hallazgos=[];load('gestion');"> No</label>
      </div>
    </label>
    <div id="hallazgos-list">
      ${d.hallazgos.map((h,i)=>`
        <div class="card hz-card">
          <div class="cardhead"><b>Hallazgo #${i+1}</b><button type="button" class="link" onclick="eliminarHallazgo(${i})">Eliminar</button></div>
          <label class="field">Categoría<select id="hz-categoria-${i}">${opt(categoriasHallazgo,h.categoria)}</select></label>
          <label class="field">Descripción<textarea id="hz-desc-${i}" placeholder="Describe el hallazgo...">${h.descripcion}</textarea></label>
          <label class="field">¿Requiere acción?
            <div class="vw-choice">
              <label><input type="radio" id="hz-accion-${i}-si" name="hz-accion-${i}" ${h.requiereAccion?'checked':''}> Sí</label>
              <label><input type="radio" id="hz-accion-${i}-no" name="hz-accion-${i}" ${!h.requiereAccion?'checked':''}> No</label>
            </div>
          </label>
          <label class="field">Compromiso<input id="hz-compromiso-${i}" value="${h.compromiso}" placeholder="Acción requerida"></label>
          <label class="field">Fecha límite<input type="date" id="hz-fecha-${i}" value="${toISO(h.fechaLimite)}"></label>
        </div>`).join('')}
    </div>
    ${hay?`<button type="button" class="add" onclick="agregarHallazgo()">＋ Agregar hallazgo</button>`:''}`;
  } else if(step===4){
    body = `
    <h3 class="section-title" style="margin-bottom:3px">📅 Seguimiento</h3>
    <label class="field">¿Esta visita requiere seguimiento?
      <div class="vw-choice">
        <label><input type="radio" id="vw-seg-si" name="vw-seg" ${d.seguimiento?'checked':''} onclick="visitaDraft.seguimiento=true;load('gestion');"> Sí</label>
        <label><input type="radio" id="vw-seg-no" name="vw-seg" ${!d.seguimiento?'checked':''} onclick="visitaDraft.seguimiento=false;load('gestion');"> No</label>
      </div>
    </label>
    ${d.seguimiento?`
      <label class="field">Tipo de seguimiento<select id="vw-tiposeg">${opt(['Visita','Revisión documental','Llamada'],d.tipoSeguimiento)}</select></label>
      <label class="field">Fecha programada<input type="date" id="vw-fechaseg" value="${toISO(d.fechaSeguimiento)}"></label>
      <label class="field">Responsable<select id="vw-tecseg">${opt(tecnicosRecursoHidrico,d.tecnicoSeguimiento)}</select></label>
      <label class="field">Actividad requerida<textarea id="vw-actseg" placeholder="Describe la actividad de seguimiento...">${d.actividadSeguimiento}</textarea></label>
    `:''}`;
  } else if(step===5){
    const expSel = expedientesRecursoHidrico.find(e=>e.exp===d.expediente);
    body = `
    <h3 class="section-title" style="margin-bottom:3px">📎 Checklist, evidencias y cierre</h3>
    <label class="field">¿Aplica medida preventiva?
      <div class="vw-choice">
        <label><input type="radio" id="vw-medprev-si" name="vw-medprev" ${d.medidaPreventiva?'checked':''}> Sí (se deriva a jurídica)</label>
        <label><input type="radio" id="vw-medprev-no" name="vw-medprev" ${!d.medidaPreventiva?'checked':''}> No aplica</label>
      </div>
    </label>
    <label class="field">¿Presenta vertimientos?
      <div class="vw-choice">
        <label><input type="radio" id="vw-vert-si" name="vw-vert" ${d.vertimientoPresenta?'checked':''} onclick="visitaDraft.vertimientoPresenta=true;load('gestion');"> Sí</label>
        <label><input type="radio" id="vw-vert-no" name="vw-vert" ${!d.vertimientoPresenta?'checked':''} onclick="visitaDraft.vertimientoPresenta=false;load('gestion');"> No</label>
      </div>
    </label>
    ${d.vertimientoPresenta?`<label class="field">Tipo de vertimiento<input id="vw-verttipo" value="${d.vertimientoTipo}" placeholder="Doméstico, industrial tratado, industrial sin tratar..."></label>`:''}
    <label class="field">¿Cumple la Franja Protectora (FP)?
      <div class="vw-choice">
        <label><input type="radio" id="vw-fp-si" name="vw-fp" ${d.cumpleFP?'checked':''}> Sí cumple</label>
        <label><input type="radio" id="vw-fp-no" name="vw-fp" ${!d.cumpleFP?'checked':''}> No cumple</label>
      </div>
    </label>
    <label class="field">Caudal medido en la visita
      <input id="vw-caudalmedido" value="${d.caudalMedido}" placeholder="Ej. 11.4 L/s">
    </label>
    ${expSel?`<p class="tiny" style="margin:-8px 0 14px">Caudal concesionado para este expediente: <b>${expSel.caudalConcesionado}</b></p>`:''}
    <label class="field">Evidencia fotográfica
      <div class="upload-box">📷 Toca para adjuntar fotos, actas o documentos (opcional en este prototipo)</div>
    </label>
    <label class="field">Observaciones finales<textarea id="vw-obsfinal" placeholder="Agrega información adicional...">${d.obs}</textarea></label>
    <div class="card" style="margin-top:14px">
      <b style="font-size:12.5px">Resumen de la visita</b>
      <p class="tiny" style="margin:6px 0 2px">${d.tipoVisita} · ${d.fecha ? d.fecha.split('-').reverse().join('/') : ''} · Acta ${d.numeroActa||'—'}</p>
      <p class="tiny" style="margin:2px 0">Expediente: ${d.expediente||'—'} · ${d.titular||'—'}</p>
      <p class="tiny" style="margin:2px 0">Ubicación: ${d.rio||'—'} · ${d.tramo||'—'} · ${d.nombreCuerpoAgua||'—'}</p>
      <p class="tiny" style="margin:2px 0">Resultado: ${d.resultado}</p>
      <p class="tiny" style="margin:2px 0">Hallazgos: ${d.hallazgos.length} · Medida preventiva: ${d.medidaPreventiva?'Sí':'No'} · FP: ${d.cumpleFP?'Cumple':'No cumple'}</p>
      <p class="tiny" style="margin:2px 0">Seguimiento: ${d.seguimiento?`Sí · ${d.fechaSeguimiento? d.fechaSeguimiento.split('-').reverse().join('/'):'(sin fecha)'}`:'No'}</p>
    </div>`;
  }

  return `
  <button class="m-back-link" data-rh="main" onclick="visitaDraft=null">‹ Cancelar y volver a Recurso Hídrico</button>
  ${stepperHtml()}
  <form class="visita-form card" id="visita-form" onsubmit="return false">${body}</form>
  <div class="vw-nav">
    <button type="button" class="btn" id="vw-prev" ${step===0?'style="visibility:hidden"':''} onclick="irAPaso(${step-1})">‹ Anterior</button>
    <button type="button" class="btn" id="vw-draft" onclick="capturarPasoActual();visitaFeedback='Borrador guardado (no se ha enviado la visita).';load('gestion');">Guardar borrador</button>
    <button type="button" class="btn solid" id="vw-next" onclick="${step===WIZARD_STEPS.length-1?'finalizarVisita()':`irAPaso(${step+1})`}">${step===WIZARD_STEPS.length-1?'✓ Finalizar visita':'Siguiente ›'}</button>
  </div>`;
}

function finalizarVisita(){
  capturarPasoActual();
  const d = visitaDraft;
  const fechaFmt = d.fecha ? d.fecha.split('-').reverse().join('/') : '';
  let horaFmt = d.hora;
  if(d.hora){
    let [h,mn] = d.hora.split(':').map(Number);
    const suf = h>=12 ? 'p. m.' : 'a. m.';
    h = h%12; if(h===0) h=12;
    horaFmt = `${h}:${String(mn).padStart(2,'0')} ${suf}`;
  }
  const hallazgosFmt = d.hallazgos.map(h=>({...h, fechaLimite: h.fechaLimite ? h.fechaLimite.split('-').reverse().join('/') : ''}));
  const registro = {
    expediente:d.expediente, titular:d.titular, nit:d.nit, tipoExp:d.tipoExp, comuna:d.comuna, predio:d.predio,
    fecha:fechaFmt, hora:horaFmt, numeroActa:d.numeroActa, tipoVisita:d.tipoVisita, tecnico:d.tecnico, apoyo:d.apoyo, resultado:d.resultado, motivo:d.motivo,
    rio:d.rio, tramo:d.tramo, tipoCuerpoAgua:d.tipoCuerpoAgua, nombreCuerpoAgua:d.nombreCuerpoAgua,
    corregimiento:d.corregimiento, barrio:d.barrio, vereda:d.vereda, direccion:d.direccion, lat:d.lat, lng:d.lng,
    hallazgos:hallazgosFmt, seguimiento:d.seguimiento,
    tipoSeguimiento:d.tipoSeguimiento, fechaSeguimiento: d.fechaSeguimiento ? d.fechaSeguimiento.split('-').reverse().join('/') : '',
    tecnicoSeguimiento:d.tecnicoSeguimiento, actividadSeguimiento:d.actividadSeguimiento,
    medidaPreventiva:d.medidaPreventiva, vertimientoPresenta:d.vertimientoPresenta, vertimientoTipo:d.vertimientoTipo, cumpleFP:d.cumpleFP, caudalMedido:d.caudalMedido,
    obs:d.obs
  };
  if(visitaEditingId){
    const idx = visitasRecursoHidrico.findIndex(v=>v.id===visitaEditingId);
    if(idx>-1) visitasRecursoHidrico[idx] = {...visitasRecursoHidrico[idx], ...registro};
    visitaFeedback = `Visita VIS-${visitaEditingId} actualizada correctamente.`;
  } else {
    const nid = visitasRecursoHidrico.length ? Math.max(...visitasRecursoHidrico.map(v=>v.id))+1 : 1;
    visitasRecursoHidrico.push({ id:nid, ...registro });
    visitaFeedback = `Visita registrada correctamente (VIS-${new Date().getFullYear()}-${String(nid).padStart(6,'0')}). Ya aparece en el histórico.`;
  }
  visitaDraft = null;
  visitaEditingId = null;
  gestionView = 'historico';
  load('gestion');
}

function renderHistoricoVisitas(){
  const rows = [...visitasRecursoHidrico].sort((a,b)=>b.id-a.id);
  return `
  <button class="m-back-link" data-rh="main">‹ Volver a Recurso Hídrico</button>
  <h3 class="section-title" style="margin-bottom:3px">📜 Histórico de visitas</h3>
  <p class="tiny" style="margin-bottom:14px">${rows.length} visitas registradas sobre el recurso hídrico.</p>
  ${rows.map(v=>`
    <div class="visita-item">
      <div class="vi-top"><b>${v.titular||v.predio||'Visita técnica'}</b><span class="pill ${v.resultado==='Requiere acciones'?'amber':''}">${v.resultado||'Completada'}</span></div>
      <div class="vi-meta">${v.fecha} · ${v.hora} · ${v.tipoVisita}${v.numeroActa?` · Acta ${v.numeroActa}`:''}<br>${v.comuna||''}${v.expediente?` · ${v.expediente}`:''} · Técnico: ${v.tecnico}${v.apoyo?` (apoyo: ${v.apoyo})`:''}</div>
      ${v.rio?`<div class="vi-meta">📍 ${v.rio} · ${v.tramo||''} · ${v.nombreCuerpoAgua||''}${v.lat?` (${v.lat}, ${v.lng})`:''}</div>`:''}
      ${v.caudalMedido?`<p class="tiny" style="margin-top:4px">💧 Caudal medido: ${v.caudalMedido}</p>`:''}
      ${v.medidaPreventiva||v.vertimientoPresenta||v.cumpleFP===false?`<p class="tiny" style="margin-top:4px">${v.medidaPreventiva?'⚖️ Medida preventiva aplicada · ':''}${v.vertimientoPresenta?`💦 Vertimiento: ${v.vertimientoTipo||'sin especificar'} · `:''}${v.cumpleFP===false?'🚫 No cumple Franja Protectora':''}</p>`:''}
      ${v.hallazgos&&v.hallazgos.length?`<p class="tiny" style="margin-top:6px">🚩 ${v.hallazgos.length} hallazgo(s) registrado(s)</p>`:''}
      ${v.seguimiento?`<p class="tiny" style="margin-top:2px">📅 Seguimiento programado: ${v.fechaSeguimiento||'sin fecha'}</p>`:''}
      <p class="tiny" style="margin-top:6px">${v.obs||v.motivo||''}</p>
      <button type="button" class="m-back-link" style="margin:8px 0 0" data-admin-only onclick="iniciarEdicionVisita(${v.id})">✎ Editar visita</button>
    </div>`).join('')}
  <button class="rh-action-btn solid" style="width:100%;flex-direction:row;justify-content:center;gap:8px" data-rh="registrar" data-admin-only><span class="rab-ico" style="width:28px;height:28px;font-size:14px">📝</span><b>Registrar nueva visita</b></button>`;
}

function gestion(){
  if(gestionView==='registrar') return renderRegistrarVisita();
  if(gestionView==='historico'){
    const feedback = visitaFeedback ? `<div class="form-success">✅ ${visitaFeedback}</div>` : '';
    visitaFeedback = null;
    return feedback + renderHistoricoVisitas();
  }
  return `
  ${rhActionsRow()}
  <div class="readonly-banner">ⓘ Este módulo es de solo consulta. El registro y la edición de expedientes, hallazgos y permisos se realizan en el Centro de Monitoreo Unificado Ambiental (CEMUA); el Observatorio consulta esta información mediante servicios/API.</div>
  <p class="tiny" style="margin:-6px 0 14px">Módulo piloto: seguimiento priorizado al <b>recurso hídrico</b> (detalle de actividad sobre cuerpos de agua superficial y alertas de recorridos, seguimientos, controles e inspecciones).</p>
  <div class="grid kpis6">
    ${kpi('☑','','EXPEDIENTES Y CONCESIONES DE AGUA','1.248','vs. periodo anterior','↑ 12%')}
    ${kpi('◍','blue','CONCESIONES DE AGUA VIGENTES','892','vs. periodo anterior','↑ 8%')}
    ${kpi('☺','','VISITAS IVC AL RECURSO HÍDRICO',String(visitasRecursoHidrico.length+1024),'vs. periodo anterior','↑ 15%')}
    ${kpi('⚑','red','HALLAZGOS SOBRE RECURSO HÍDRICO','276','vs. periodo anterior','↑ 18%')}
    ${kpi('~','purple','PUNTOS DE VERTIMIENTO MONITOREADOS','342','vs. periodo anterior','↑ 9%')}
    ${kpi('▣','amber','PERMISOS DE AGUA POR VENCER (30 DÍAS)','34','vs. periodo anterior','↑ 22%')}
  </div>

  <div class="tabs" style="margin-top:14px">
    <div class="tab active">Concesiones y permisos de agua</div><div class="tab">Visitas e inspecciones (IVC)</div><div class="tab">Hallazgos</div>
    <div class="tab">Puntos de vertimiento</div><div class="tab">Ocupación de cauce</div><div class="tab">Franjas protectoras</div>
  </div>

  <div class="module-head">
    <div class="searchbox" style="flex:1;max-width:340px"><input placeholder="⌕ Buscar expediente, titular, número o ubicación..."></div>
    <div class="filters">${filterField('Estado','Todos')}${filterField('Tipo','Todos')}${filterField('Territorio','Todos')}<button class="btn">▽ Filtros</button></div>
  </div>

  <div class="grid two">
    <div class="card">
      <h3 class="section-title">CONCESIONES Y PERMISOS DE AGUA</h3>
      ${table(['Expediente','Tipo','Titular','Ubicación','Estado','Vigencia'],
        expedientesRecursoHidrico.map(e=>{
          const ev = estadoVigencia(e.vigencia);
          return [e.exp, e.tipo, e.titular, e.comuna, `<span class="pill ${ev.cls}">${ev.label}</span>`, e.vigencia||'—'];
        })
      ,'👁')}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver todos los expedientes</button>
    </div>

    <div>
      <div class="card" style="margin-bottom:12px">
        <h3 class="section-title">RECURSO HÍDRICO EN EL TERRITORIO <span class="info">ⓘ</span></h3>
        ${mapBlock({
          legend:{title:'Convenciones',rows:[{t:'Concesión de agua superficial',c:'blue'},{t:'Concesión de agua subterránea',c:'green'},{t:'Permiso de vertimientos',c:'purple'},{t:'Ocupación de cauce',c:'amber'},{t:'Prospección / Exploración',c:'red'}]},
          dots:[{x:45,y:20,c:'blue'},{x:60,y:25,c:'green'},{x:35,y:35,c:'blue'},{x:70,y:30,c:'purple'},{x:50,y:42,c:'blue'},{x:55,y:48,c:'green'},{x:40,y:52,c:'blue'},{x:65,y:55,c:'blue'},{x:30,y:60,c:'red'},{x:75,y:60,c:'amber'}],
          cta:'Ver en Geovisor ↗'
        })}
      </div>
      <div class="card">
        <h3 class="section-title">ALERTAS Y VENCIMIENTOS</h3>
        ${expedientesRecursoHidrico
          .map(e=>({e,ev:estadoVigencia(e.vigencia)}))
          .filter(x=>x.ev.dias!==null && x.ev.dias<=60)
          .sort((a,b)=>a.ev.dias-b.ev.dias)
          .map(x=>finding(
            `${x.e.tipo} por ${x.ev.dias<0?'vencer (vencido)':'vencer'}`,
            `${x.e.titular} · ${x.ev.dias<0?`Venció hace ${Math.abs(x.ev.dias)} días`:`Vence en ${x.ev.dias} días`} (${x.e.vigencia})`,
            x.ev.dias<0?'Crítica':'Alta', x.ev.dias<0?'red':'amber'
          )).join('') || '<p class="tiny">No hay concesiones próximas a vencer.</p>'}
        ${finding('Hallazgo sin plan de acción','Comuna 18 - Río Meléndez · Registrado hace 20 días','Media','blue')}
        <button class="btn" style="width:100%;margin-top:8px">Ver todas las alertas y vencimientos ›</button>
      </div>
    </div>
  </div>

  <div class="grid four" style="margin-top:12px">
    <div class="card">
      <h3 class="section-title">VISITAS IVC AL RECURSO HÍDRICO</h3>
      ${donut([{label:'Cumplidas',value:'742 (72%)',pct:72,color:'var(--green)'},{label:'En proceso',value:'198 (19%)',pct:19,color:'var(--amber)'},{label:'No cumplidas',value:'88 (9%)',pct:9,color:'var(--danger)'}],'1.028','Total visitas')}
      <button class="btn" style="width:100%;margin-top:10px" data-rh="historico">▦ Ver todas las visitas</button>
    </div>
    <div class="card">
      <h3 class="section-title">HALLAZGOS MÁS RECURRENTES</h3>
      ${hbars([{l:'Vertimientos sin permiso',v:78},{l:'Ocupación de cauce',v:56},{l:'Inadec. manejo residuos',v:42},{l:'Uso no autorizado',v:38},{l:'Intervención rondas',v:32}])}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver todos los hallazgos</button>
    </div>
    <div class="card">
      <h3 class="section-title">PUNTOS DE VERTIMIENTO</h3>
      ${infoRow('● Activos','214')}${infoRow('○ Inactivos','78')}${infoRow('◐ En seguimiento','50')}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver en Geovisor ↗</button>
    </div>
    <div class="card">
      <h3 class="section-title">DOCUMENTOS Y EVIDENCIAS</h3>
      ${infoRow('Evidencias cargadas este mes','256')}${infoRow('Informes generados','38')}${infoRow('Documentos automáticos','21')}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver documentos ↗</button>
    </div>
  </div>

  <h3 class="section-title" style="margin-top:16px">SEGUIMIENTO DEL RECURSO HÍDRICO <span class="info">ⓘ</span></h3>
  <p class="tiny" style="margin-bottom:10px">Información priorizada para el módulo piloto, con base en las estaciones y sensores IoT ya instalados por el DAGMA (piezómetros y estaciones meteorológicas).</p>
  <div class="grid three">
    <div class="card">
      <h3 class="section-title">ESTACIONES Y SENSORES IoT</h3>
      <p class="tiny" style="margin-bottom:8px">Piezómetros y estaciones meteorológicas con transmisión activa sobre cuerpos de agua superficial y subterránea.</p>
      ${infoRow('Piezómetros activos','18')}${infoRow('Estaciones meteorológicas','6')}${infoRow('Última transmisión','12/05/2025 07:50 a. m.')}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver en Geovisor ↗</button>
    </div>
    <div class="card">
      <h3 class="section-title">CAUDAL CONCEDIDO VS. AUTOREPORTE</h3>
      <p class="tiny" style="margin-bottom:8px">Cumplimiento del caudal autorizado frente al autoreportado por los usuarios concesionarios.</p>
      <div class="metric-row"><span class="metric">76%</span></div>
      <p class="tiny">2.45 m³/s concedidos · 1.87 m³/s autoreportados</p>
      <button class="btn" style="width:100%;margin-top:10px">📊 Ver análisis en Analítica ↗</button>
    </div>
    <div class="card">
      <h3 class="section-title">CALIDAD DEL AGUA (ICA) POR CUENCA</h3>
      ${hbars([{l:'Río Cali',v:78,c:'var(--green)'},{l:'Río Cañaveralejo',v:65,c:'var(--amber)'},{l:'Río Meléndez',v:72,c:'var(--green)'},{l:'Río Lili',v:58,c:'var(--amber)'},{l:'Río Pance',v:84,c:'var(--green)'}])}
      <p class="tiny" style="margin-top:8px">Escala ICA: 🟢 Buena (70-100) · 🟡 Aceptable (40-70) · 🔴 Mala (0-40)</p>
    </div>
  </div>`;
}

/* ---------------- REPORTES ---------------- */
function reportes(){
  return `
  <div class="grid two">
    <div class="card">
      <h3 class="section-title">CONFIGURAR REPORTE</h3>
      <label class="field">Tipo de reporte<select><option>Control IVC - Visitas y Vertimientos</option><option>Gestión ambiental</option><option>Calidad del agua</option></select></label>
      <div class="grid twoeq">
        <label class="field">Desde<input type="date" value="2024-01-01"></label>
        <label class="field">Hasta<input type="date" value="2025-05-12"></label>
      </div>
      <label class="field">Territorio<select><option>Todos los territorios</option><option>Comuna 22</option><option>Comuna 18</option></select></label>
      <label class="field">Temas<select><option>Visitas IVC, Vertimientos, Calidad del agua</option></select></label>
      <p class="tiny" style="background:#f3f6f4;padding:9px;border-radius:8px;margin-bottom:12px">ⓘ La idea del informe gerencial o ejecutivo es que se obtenga en tiempo real información detallada y precisa, relevante, que esté a la orden de directivos, entes, equipo de trabajo.</p>
      <button class="btn solid" style="width:100%">▤ Generar reporte</button>
    </div>

    <div>
      <div class="card">
        <div class="module-head" style="margin-bottom:6px"><h3 class="section-title">VISTA PREVIA DEL REPORTE</h3><span class="tiny up">● En tiempo real</span></div>
        <div class="grid twoeq">
          ${kpi('☺','','VISITAS IVC REALIZADAS','1.028','vs. periodo anterior','↑ 15%')}
          ${kpi('◍','blue','VERTIMIENTOS IDENTIFICADOS','243','vs. periodo anterior','↑ 8%')}
        </div>
        <div class="grid twoeq" style="margin-top:12px">
          ${kpi('✓','','VISITAS ATENDIDAS','876','vs. periodo anterior','↑ 12%')}
          ${kpi('⏱','amber','CUMPLIMIENTO GLOBAL','72%','vs. periodo anterior','↑ 6 pp')}
        </div>
      </div>
      <div class="grid twoeq" style="margin-top:12px">
        <div class="card">
          <h3 class="section-title">VISITAS POR COMUNA</h3>
          <p class="tiny" style="margin-bottom:8px">Total de visitas IVC</p>
          ${fakeBars([51,71,53,77,100,40],['Comuna 1','Comuna 5','Comuna 13','Comuna 18','Comuna 22','Otras'])}
        </div>
        <div class="card">
          <h3 class="section-title">RESULTADOS DE MEDICIONES</h3>
          ${donut([{label:'Cumple',value:'124 (51%)',pct:51,color:'var(--green)'},{label:'No cumple',value:'87 (36%)',pct:36,color:'var(--blue)'},{label:'En evaluación',value:'32 (13%)',pct:13,color:'var(--amber)'}],'243','Mediciones')}
        </div>
      </div>
    </div>
  </div>

  <div class="grid two" style="margin-top:12px">
    <div class="card">
      <h3 class="section-title">INDICADORES ICAU (Índice de Calidad del Agua)</h3>
      ${lineCard([
        {name:'Buena (70-100)',color:'var(--green)',values:[74,78,72,80,76,82,78,84,80,86,82,88]},
        {name:'Aceptable (40-70)',color:'var(--amber)',values:[52,55,50,58,54,60,56,62,58,64,60,66]},
        {name:'Mala (0-40)',color:'var(--danger)',values:[22,25,20,28,24,30,26,32,28,34,30,36]}
      ],['Ene 2024','Feb 2024','Mar 2024','Abr 2024','May 2024','Jun 2024','Jul 2024','Ago 2024','Sep 2024','Oct 2024','Nov 2024','Dic 2024'])}
    </div>
    <div class="card">
      <h3 class="section-title">INFORME GERENCIAL</h3>
      <p class="tiny" style="margin:8px 0 16px">Informe ejecutivo con la información clave para la toma de decisiones. Incluye análisis, comparativos, indicadores y recomendaciones.</p>
      <button class="btn solid" style="width:100%">▤ Ver informe gerencial</button>
    </div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3 class="section-title">REPORTES RECIENTES</h3>
    ${table(['Nombre del reporte','Tipo','Periodo','Fecha de generación','Estado'],[
      ['Informe gerencial IVC - Mayo 2025','Gerencial / Ejecutivo','May 2025','12/05/2025 08:30 a. m.','<span class="pill">Completado</span>'],
      ['Control de vertimientos - Tramos PORH','Control IVC','Abr 2025','05/05/2025 03:15 p. m.','<span class="pill">Completado</span>'],
      ['Visitas IVC por comuna - Q1 2025','Operativo','Ene - Mar 2025','02/05/2025 11:20 a. m.','<span class="pill">Completado</span>'],
      ['Reporte técnico de calidad del agua','Técnico','Abr 2025','30/04/2025 09:45 a. m.','<span class="pill">Completado</span>'],
      ['Seguimiento vertimientos - PORH','Seguimiento','Mar 2025','28/04/2025 04:10 p. m.','<span class="pill">Completado</span>']
    ],'👁 ⇩','⋮')}
    <button class="btn" style="width:100%;margin-top:10px">▦ Ver todos los reportes</button>
  </div>

  <div class="grid three" style="margin-top:12px">
    ${quickCard('▣','PROGRAMAR REPORTE REPETITIVO','Automatiza la generación periódica de reportes.')}
    ${quickCard('▤','PLANTILLAS DE REPORTES','Selecciona plantillas predefinidas por tipo de informe.')}
    ${quickCard('⌁','CRUCE DE VARIABLES PERSONALIZADO','Combina variables para análisis específicos.')}
  </div>`;
}

/* ---------------- CATÁLOGO ---------------- */
function catalogo(){
  return `
  <div class="module-head">
    <div class="searchbox" style="flex:1"><input placeholder="⌕ Buscar conjunto de datos..."></div>
    <button class="btn">☰ Búsqueda avanzada</button>
  </div>
  <div class="filters" style="margin-bottom:14px">${filterField('Tema','Todos')}${filterField('Tipo de dato','Todos')}${filterField('Fuente','Todas')}${filterField('Formato','Todos')}${filterField('Fecha de actualización','Todas')}</div>

  <div class="card" style="margin-bottom:12px;background:var(--pale);border-color:#cfe6d7">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
      <div><h3 class="section-title" style="color:var(--green)">Integración con la IDESC - Mapa de Ruido</h3><p class="tiny">Los datos de ruido ambiental están integrados con la Infraestructura de Datos Espaciales Santiago de Cali - IDESC.</p></div>
      <div style="font-weight:800;color:var(--green);font-size:14px;white-space:nowrap">◈ IDESC</div>
    </div>
  </div>

  <div class="grid three">
    <div class="card">
      <h3 class="section-title">CATEGORÍAS</h3>
      ${['Recurso hídrico|124','Calidad del aire|98','Aire y atmósfera|76','Ruido ambiental|45','Residuos sólidos|38','Biodiversidad|62','Gestión del territorio|53','Rondas hídricas y protección|31'].map(x=>{const [t,n]=x.split('|');return `<div class="alert"><span class="aico blue">▤</span><b>${t}</b><span class="pill">${n}</span></div>`}).join('')}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver todas las categorías</button>
    </div>
    <div class="card">
      <div class="module-head" style="margin-bottom:4px"><h3 class="section-title">CONJUNTOS DE DATOS</h3><span class="tiny">124 resultados</span></div>
      ${dataset('◍','Puntos de monitoreo de calidad del agua superficial','Ubicación geográfica de los puntos de monitoreo y resultados de calidad del agua.','12/05/2025','CSV',['Recurso hídrico','Calidad del agua'])}
      ${dataset('~','Red hídrica - Cuencas y cuerpos de agua','Delimitación de cuencas hidrográficas y cuerpos de agua superficiales.','09/05/2025','SHP',['Recurso hídrico','Hidrografía'])}
      ${dataset('♪','Mapa de ruido ambiental - Santiago de Cali','Niveles de presión sonora (dB) por zona y periodo del día.','07/05/2025','GeoTIFF',['Ruido ambiental','IDESC'])}
      ${dataset('♻','Cobertura vegetal y uso del suelo','Cobertura vegetal y uso actual del suelo en el área urbana y rural.','06/05/2025','SHP',['Biodiversidad','Uso del suelo'])}
      ${dataset('▣','Permisos de vertimientos activos','Registro de permisos de vertimientos otorgados y vigentes.','05/05/2025','XLSX',['Gestión ambiental','Permisos'])}
      <button class="btn" style="width:100%;margin-top:10px">▾ Ver más conjuntos de datos</button>
    </div>
    <div class="card">
      <h3 class="section-title">DETALLE DEL CONJUNTO</h3>
      <div style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><span class="bubble blue">◍</span><div><b style="font-size:12px">Puntos de monitoreo de calidad del agua superficial</b><span class="pill" style="margin-left:6px">Actualizado</span></div></div>
      <p class="tiny" style="margin-bottom:10px">Ubicación geográfica de los puntos de monitoreo y los resultados de los parámetros fisicoquímicos y microbiológicos de la calidad del agua superficial.</p>
      ${infoRow('Tema','Recurso hídrico / Calidad del agua')}${infoRow('Tipo de dato','Punto')}${infoRow('Fuente','DAGMA - Subdirección de Gestión Ambiental')}
      ${infoRow('Fecha de actualización','12/05/2025')}${infoRow('Frecuencia de actualización','Mensual')}${infoRow('Cobertura espacial','Municipio de Santiago de Cali')}
      ${infoRow('Sistema de referencia','MAGNA-SIRGAS Origen Nacional')}${infoRow('Licencia de uso','Datos abiertos - Uso libre')}
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" style="flex:1">👁 Ver en el mapa</button><button class="btn solid" style="flex:1">⇩ Descargar datos</button></div>
    </div>
  </div>

  <div class="module-head" style="margin-top:14px;background:var(--pale);padding:12px 16px;border-radius:10px">
    <div class="filters"><span class="tiny">✓ Metadatos completos<br><b style="font-size:9.5px">Estándar ISO 19115</b></span><span class="tiny">⇄ API disponible<br><b style="font-size:9.5px">Acceso programático</b></span><span class="tiny">⌖ Integración espacial<br><b style="font-size:9.5px">IDE - IDESC</b></span><span class="tiny">↻ Actualización periódica<br><b style="font-size:9.5px">Datos siempre vigentes</b></span></div>
    <button class="btn solid">+ Solicitar conjunto de datos</button>
  </div>`;
}
function dataset(ico,title,desc,date,format,tags){
  return `<div style="display:flex;gap:10px;padding:11px 0;border-bottom:1px solid #eef1ee">
    <span class="bubble blue" style="width:34px;height:34px;font-size:14px">${ico}</span>
    <div style="flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:11px">${title}</b><span class="tiny">${date}</span></div>
    <p class="tiny" style="margin:4px 0 6px">${desc}</p>
    <div style="display:flex;gap:6px">${tags.map(t=>`<span class="pill grey">${t}</span>`).join('')}<span class="pill blue">${format}</span></div></div>
    <div style="display:flex;flex-direction:column;gap:8px;color:var(--muted);cursor:pointer">⇩ ⓘ</div>
  </div>`;
}

/* ---------------- CONSULTA CIUDADANA ---------------- */
function consulta(){
  return `
  <div class="grid twoeq">
    <div class="card"><div class="bubble" style="margin-bottom:8px">▤</div><div class="metric">12.458</div><p class="tiny">Visitas de inspección realizadas este mes</p><span class="up">↑ 8% vs. mes anterior</span></div>
    <div class="card"><div class="bubble blue" style="margin-bottom:8px">≈</div><h3 style="font-size:12.5px;margin-bottom:6px">Información básica de tu río</h3><p class="tiny">Consulta el estado de las franjas protectoras, derivaciones, tributarios y cuerpos hídricos de tu cuenca hidrográfica. Esta información es generada por el DAGMA.</p></div>
  </div>

  <div class="card" style="margin-top:12px">
    <div class="searchbox" style="width:100%"><input placeholder="⌕ Buscar río, cuenca, comuna o ubicación... (Ej. Río Cali, Quebrada Isabel Pérez, Comuna 22)"></div>
    <button class="btn solid" style="margin-top:10px">Buscar</button>
  </div>

  <h3 class="section-title" style="margin-top:16px">EXPLORA POR TEMAS</h3>
  <p class="tiny" style="margin:2px 0 8px">El piloto de <b>Recurso hídrico</b> y <b>Ruido ambiental</b> tiene el mayor nivel de detalle. Biodiversidad, Residuos y Cambio climático ya muestran información de referencia tomada de fuentes oficiales, mientras avanzan sus propios talleres de cocreación con el DAGMA.</p>
  <div class="grid icon-cards" style="margin-top:8px">
    ${themeCard('≈','Recurso hídrico','Calidad y cantidad del agua · Módulo piloto')}
    ${themeCard('♪','Ruido','Niveles y mapas de ruido ambiental')}
    ${themeCard('♻','Biodiversidad','Flora, fauna y ecosistemas','#tema-biodiversidad')}
    ${themeCard('▥','Residuos','Gestión y disposición de residuos sólidos','#tema-residuos')}
    ${themeCard('☀','Cambio climático','Adaptación y mitigación del cambio climático','#tema-cambioclimatico')}
  </div>

  <h3 class="section-title" style="margin-top:16px">OTROS TEMAS AMBIENTALES DE CALI</h3>
  <p class="tiny" style="margin:2px 0 8px">Información de referencia tomada de fuentes oficiales, mientras el DAGMA completa los talleres de cocreación de cada equipo técnico.</p>
  <div class="grid three" style="margin-top:8px">
    ${topicCard('♻','tema-biodiversidad','Biodiversidad',[
      'Santiago de Cali registra <b>561 especies de aves</b> (487 residentes, 72 migratorias y 2 introducidas), con 7 especies endémicas de Colombia.',
      'El Parque Nacional Natural Farallones de Cali registra <b>626 especies de aves</b> en sus 196.430 hectáreas.',
      'La ciudad cuenta con <b>10 ecoparques</b>, incluidos los cerros tutelares Cristo Rey, Tres Cruces-Bataclán y Cerro de La Bandera.'
    ],'Instituto Humboldt (revista Biota Colombiana) y Parques Nacionales Naturales de Colombia')}
    ${topicCard('▥','tema-residuos','Residuos sólidos',[
      'Santiago de Cali genera entre <b>1.800 y 2.000 toneladas</b> de residuos sólidos al día.',
      'Los residuos se disponen en el Relleno Sanitario Regional Colomba-El Guabal (Yotoco), que recibe cerca de <b>3.200 ton/día</b> de 16 municipios del Valle del Cauca.',
      'Según el PGIRS 2015-2027, el <b>66% de los residuos</b> generados corresponden a material orgánico.'
    ],'Alcaldía de Santiago de Cali - PGIRS Santiago de Cali 2015-2027 y Universidad del Valle')}
    ${topicCard('☀','tema-cambioclimatico','Cambio climático',[
      'El Plan Maestro Cali Sostenible 2030 busca reducir en un <b>67% las emisiones</b> de gases de efecto invernadero (GEI) de la ciudad para 2050.',
      'Las emisiones actuales de la ciudad son de <b>1.171.642 toneladas de CO2</b> equivalente al año.',
      'El plan identificó <b>10 proyectos estratégicos</b> de descarbonización, con una inversión estimada de USD 2.755 millones en su primera fase.'
    ],'DAGMA - Alcaldía de Santiago de Cali, Plan Maestro Cali Sostenible 2030')}
  </div>

  <h3 class="section-title" style="margin-top:16px">INFORMACIÓN DESTACADA PARA TI</h3>
  <div class="grid four" style="margin-top:8px">
    <div class="card">
      <h4 style="font-size:11.5px;margin-bottom:8px">Informes de ruido</h4>
      ${fakeBars([40,55,60,70,80,90],['Ene','Feb','Mar','Abr','May','Jun'])}
      <div class="card-link">Ver informes ›</div>
    </div>
    <div class="card">
      <h4 style="font-size:11.5px;margin-bottom:10px">Escala de niveles de ruido por colores</h4>
      ${infoRow('● 0 - 55 dB','Bajo')}${infoRow('● 56 - 70 dB','Moderado')}${infoRow('● 71 - 85 dB','Alto')}${infoRow('● > 85 dB','Muy alto')}
      <button class="btn" style="width:100%;margin-top:8px">Ver explicación</button>
    </div>
    <div class="card">
      <h4 style="font-size:11.5px;margin-bottom:8px">¿Qué significan estos niveles?</h4>
      <p class="tiny" style="margin-bottom:10px">Conoce qué indican los niveles de ruido y cómo se miden.</p>
      <div class="card-link">Ver más ›</div>
    </div>
    <div class="card">
      <h4 style="font-size:11.5px;margin-bottom:8px">Áreas de actividad de la ciudad</h4>
      ${mapBlock({small:true,dots:[{x:40,y:30,c:'purple'},{x:60,y:45,c:'blue'},{x:35,y:60,c:'green'}]})}
      <div class="card-link">Ver mapa de actividades ›</div>
    </div>
  </div>

  <h3 class="section-title" style="margin-top:16px">CONSULTAS RÁPIDAS</h3>
  <div class="grid kpis5" style="margin-top:8px">
    ${quickStat('≈','Ríos y quebradas','28','cuerpos de agua')}
    ${quickStat('♻','Zonas de protección','156','franjas protectoras')}
    ${quickStat('⌖','Puntos de monitoreo','342','activos')}
    ${quickStat('▤','Normativa ambiental','','Ver normativa ›')}
    ${quickStat('▣','Trámites y servicios','','Ver más ›')}
  </div>

  <div class="grid two" style="margin-top:12px">
    <div class="card">
      <div class="module-head" style="margin-bottom:6px"><h3 class="section-title">NOTICIAS Y ALERTAS AMBIENTALES</h3><span class="tiny" style="color:var(--green);font-weight:700;cursor:pointer">Ver todas</span></div>
      ${newsRow('♻','Jornada de reforestación río Meléndez','15/05/2025 · Participa en la jornada de siembra este 25 de mayo.','Participa')}
      ${newsRow('≈','Monitoreo de calidad del agua','12/05/2025 · Resultados del monitoreo de mayo 2025 ya disponibles.','Información','blue')}
      ${newsRow('♪','Niveles de ruido en la ciudad','09/05/2025 · Consulta el boletín mensual de ruido ambiental.','Informe','amber')}
      ${newsRow('⚠','Alerta por altas temperaturas','07/05/2025 · Recomendaciones para el cuidado ambiental y la salud.','Alerta','red')}
    </div>
    <div class="card">
      <h3 class="section-title">DATOS ABIERTOS</h3>
      <p class="tiny" style="margin-bottom:10px">Descarga y reutiliza nuestros datos ambientales.</p>
      ${openData('Calidad del aire')}${openData('Calidad del agua')}${openData('Ruido ambiental')}${openData('Cobertura vegetal')}${openData('Residuos sólidos')}
      <button class="btn" style="width:100%;margin-top:10px">▦ Ver todos los datos abiertos ↗</button>
    </div>
  </div>

  <div class="module-head" style="margin-top:14px;background:var(--pale);padding:12px 16px;border-radius:10px">
    <button class="btn">☏ Contacto ciudadano</button><button class="btn">♪ PQRS ambientales</button><button class="btn">⚠ Denuncias ambientales</button><button class="btn">? Preguntas frecuentes</button>
  </div>`;
}
function themeCard(ico,title,desc,href){
  const tag = href ? 'a' : 'div';
  const attrs = href ? ` href="${href}" style="text-decoration:none;color:inherit"` : '';
  return `<${tag} class="card"${attrs}><div class="ico-circle">${ico}</div><h3 class="section-title">${title}</h3><p class="tiny">${desc}</p><div class="card-link">Explorar ›</div></${tag}>`;
}
function topicCard(ico,id,title,facts,source){
  return `<div class="card" id="${id}">
    <div class="bubble" style="margin-bottom:8px">${ico}</div>
    <h3 class="section-title">${title}</h3>
    <ul style="margin:8px 0 10px;padding-left:16px;font-size:11px;color:#33413a;line-height:1.75">${facts.map(f=>`<li>${f}</li>`).join('')}</ul>
    <p class="tiny" style="border-top:1px solid #eef1ee;padding-top:8px">Fuente: ${source}</p>
  </div>`;
}
function quickStat(ico,title,value,sub){return `<div class="card" style="text-align:center"><div class="bubble" style="margin:0 auto 8px">${ico}</div><h4 style="font-size:10.5px;margin-bottom:6px">${title}</h4>${value?`<div class="metric" style="font-size:19px">${value}</div><span class="tiny">${sub}</span>`:`<span class="card-link" style="border-top:0;margin-top:0;padding-top:0">${sub}</span>`}</div>`}
function newsRow(ico,title,sub,tag,cls){return `<div class="list-item" style="align-items:flex-start"><div style="display:flex;gap:10px"><span class="bubble ${cls||''}" style="width:32px;height:32px;font-size:13px">${ico}</span><div><b style="font-size:11px">${title}</b><div class="tiny">${sub}</div></div></div><span class="pill ${cls||''}">${tag}</span></div>`}
function openData(name){return `<div class="list-item"><b style="font-weight:600;font-size:11px">${name}</b><span style="display:flex;gap:6px"><span class="pill grey">CSV</span><span class="pill grey">XLSX</span><span class="pill grey">API</span></span></div>`}

/* ---------------- ADMINISTRACIÓN (solo admin) ---------------- */
function admin(){
  if(state.role!=='dagma'){
    return `<div class="card" style="text-align:center;padding:60px 20px"><div class="bubble" style="margin:0 auto 14px;width:56px;height:56px;font-size:26px">⛔</div><h3 class="section-title" style="justify-content:center">Acceso restringido</h3><p class="tiny">Este módulo está disponible solo para usuarios DAGMA.</p></div>`;
  }
  return `
  <p class="tiny" style="background:#f3f6f4;padding:9px 13px;border-radius:9px;margin-bottom:14px">ⓘ Este panel administra únicamente los textos, noticias y elementos visuales del portal público. La gestión de usuarios internos, permisos y datos operativos del DAGMA se realiza en el Centro de Monitoreo Unificado Ambiental (CEMUA); el Observatorio la consume mediante servicios/API.</p>
  <div class="tabs">
    <div class="tab active">Textos y páginas</div><div class="tab">Noticias y alertas</div><div class="tab">Banners e imágenes</div><div class="tab">Observatorios comunitarios</div><div class="tab">Documentos y enlaces</div><div class="tab">Configuración visual</div>
  </div>
  <div class="grid admin-grid">
    <div class="card">
      <div class="module-head">
        <div><h3 class="section-title">TEXTOS Y CONTENIDO DEL PORTAL</h3><p class="sub">Edita los títulos, descripciones y textos pedagógicos visibles para la ciudadanía.</p></div>
        <button class="btn solid">+ Nuevo bloque de texto</button>
      </div>
      <div class="searchbox" style="width:100%;margin-bottom:10px"><input placeholder="⌕ Buscar por página o sección..."></div>
      ${cmsRow('⌂','Dashboard · Texto de bienvenida','Panorama general del estado ambiental de Santiago de Cali.','Publicado','12/05/2025')}
      ${cmsRow('♙','Consulta ciudadana · Texto introductorio','Explora y consulta la información ambiental de tu ciudad.','Publicado','10/05/2025')}
      ${cmsRow('≈','Recurso hídrico · Texto pedagógico','Información básica de ríos, tributarios, derivaciones y franjas protectoras.','Publicado','08/05/2025')}
      ${cmsRow('♪','Ruido · Escalas y explicación','Explicación de las escalas de ruido ambiental por colores.','Publicado','05/05/2025')}
      ${cmsRow('☀','Cambio climático · Aviso "Próximamente"','Texto informativo mientras se desarrolla el módulo completo.','Borrador','—')}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span class="tiny">Mostrando 1 a 5 de 18 bloques de texto</span><span class="tiny">‹ 1 2 3 4 ›</span></div>
    </div>
    <div class="rightcol">
      <div class="card">
        <h3 class="section-title">OBSERVATORIOS COMUNITARIOS VINCULADOS</h3>
        <p class="tiny" style="margin-bottom:8px">Observatorios de comunas y corregimientos alojados bajo el dominio institucional único del Observatorio Ambiental.</p>
        ${infoRow('Comuna 22 (OAC22)',pill('Visible'))}
        ${infoRow('Corregimiento La Elvira / La Vitrera',pill('Visible'))}
        ${infoRow('Nuevos observatorios comunitarios',pill('Por vincular','grey'))}
        <button class="btn" style="width:100%;margin-top:10px">+ Vincular nuevo observatorio</button>
      </div>
      <div class="card">
        <h3 class="section-title">FUENTES DE DATOS CONECTADAS</h3>
        <p class="tiny" style="margin-bottom:8px">El Observatorio consulta esta información mediante servicios/API; no la registra ni la edita.</p>
        ${infoRow('Centro de Monitoreo Unificado Ambiental (CEMUA)',pill('Conectado'))}
        ${infoRow('IDESC (Infraestructura de Datos Espaciales)',pill('Conectado'))}
        ${infoRow('Observatorios comunitarios',pill('En migración','amber'))}
      </div>
    </div>
  </div>

  <div class="grid three" style="margin-top:12px">
    ${infoCard('♻','Noticias y alertas ambientales','Publica y programa noticias, alertas y comunicados dirigidos a la ciudadanía.','Gestionar noticias')}
    ${infoCard('▤','Banners e imágenes destacadas','Administra las imágenes de portada y elementos visuales del portal público.','Gestionar banners')}
    ${infoCard('▣','Documentos y enlaces institucionales','Vincula manuales, lineamientos y documentos de referencia del DAGMA / IDESC.','Gestionar documentos')}
  </div>

  <div class="card" style="margin-top:12px">
    <h3 class="section-title">ACCIONES RÁPIDAS</h3>
    <div class="grid kpis6" style="margin-top:10px">
      ${quickAction('♻+','Nueva noticia')}${quickAction('▤+','Nuevo banner')}${quickAction('✎','Editar textos')}
      ${quickAction('◍+','Vincular observatorio')}${quickAction('▣+','Nuevo documento')}${quickAction('🎨','Identidad visual')}
    </div>
  </div>
  <p class="tiny" style="margin-top:12px;text-align:center">ⓘ Este panel no gestiona credenciales, usuarios internos ni datos operativos del DAGMA; esa función permanece en el CEMUA.</p>`;
}
function cmsRow(ico,title,desc,status,date){
  return `<div class="user"><div class="avatar">${ico}</div><div><b>${title}</b><div class="tiny">${desc} · Actualizado ${date}</div></div><span class="pill ${status==='Publicado'?'':'grey'}">${status}</span><span class="row-actions">✎ 👁</span></div>`;
}
function infoCard(ico,title,desc,cta){return `<div class="card"><div class="bubble" style="margin-bottom:10px">${ico}</div><h4 style="font-size:12px;margin-bottom:6px">${title}</h4><p class="tiny" style="margin-bottom:10px">${desc}</p><div class="card-link">${cta} ›</div></div>`}
function quickAction(ico,label){return `<div class="card" style="text-align:center;cursor:pointer;padding:16px 8px"><div style="font-size:20px;margin-bottom:8px">${ico}</div><span class="tiny" style="font-weight:650;color:#33413a">${label}</span></div>`}

const renderers={dashboard,geovisor,indicadores,analitica,gestion,reportes,catalogo,consulta,admin};

function wireModuleInteractions(){
  document.querySelectorAll('.tabgroup .tabx, .tabs .tab').forEach(t=>{
    t.addEventListener('click',()=>{
      t.parentElement.querySelectorAll('.tabx,.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
    });
  });
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', ()=> load(el.dataset.nav));
  });
  if(document.getElementById('geo-leaflet-map')) initGeoMap();
  if(document.getElementById('home-mini-map')) initHomeMiniMap();
  if(document.getElementById('home-search-input')) wireHomeSearch();
  document.getElementById('btn-zona')?.addEventListener('click', ()=>{
    renderZonaSheet();
    document.getElementById('sheet-zona').hidden = false;
  });

  /* Recurso Hídrico: navegación interna (main / registrar / historico) */
  document.querySelectorAll('[data-rh]').forEach(el=>{
    el.addEventListener('click', ()=>{
      if(el.dataset.rh==='registrar'){
        iniciarNuevaVisita();
      } else {
        gestionView = el.dataset.rh;
      }
      load('gestion');
    });
  });
}
