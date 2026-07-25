/* ANTELMO V7.3.6 — mejoras pendientes revisadas y completadas. */

function antelmoSafeIsoDate(value=''){
  const text=String(value||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return null;
  const date=new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime())?null:date;
}

/* Evita cualquier NaN en días, comparadores, estadísticas y tarjetas. */
daysSince=function(value){
  const date=antelmoSafeIsoDate(value);
  if(!date)return null;
  const todayDate=antelmoSafeIsoDate(today());
  if(!todayDate)return null;
  const days=Math.floor((todayDate-date)/86400000);
  return Number.isFinite(days)?Math.max(0,days):null;
};

function antelmoSafeDisplay(value,fallback='—'){
  if(value==null||value==='')return fallback;
  const text=String(value);
  return /(^|[^a-z])nan([^a-z]|$)/i.test(text)||/undefined|null/i.test(text)?fallback:text;
}

const antelmoPendingComparisonMetrics=typeof v73ComparisonMetrics==='function'?v73ComparisonMetrics:null;
if(antelmoPendingComparisonMetrics){
  v73ComparisonMetrics=function(colony){
    const metrics=antelmoPendingComparisonMetrics(colony);
    return Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,antelmoSafeDisplay(value)]));
  };
}

/* Diario agrupado: cada categoría se puede plegar y recuerda su estado. */
function antelmoJournalCollapsed(){
  db.appConfig.v73 ||= {};
  db.appConfig.v73.collapsedJournalTypes ||= [];
  return db.appConfig.v73.collapsedJournalTypes;
}

records=function(){
  ensureLocalRoadmapData();
  const cfg=db.appConfig.v73.journal,items=v73FilteredJournal(),all=journalItems();
  const types=[...new Set(all.map(item=>item.kind).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const activeFilters=[cfg.query,cfg.colony!=='all',cfg.type!=='all',cfg.importance!=='all',cfg.from,cfg.to,cfg.media!=='all',cfg.tags].filter(Boolean).length;
  const groups={};items.forEach(item=>(groups[item.kind||'Otros']||=[]).push(item));
  const collapsed=antelmoJournalCollapsed();
  const grouped=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b,'es')).map(([kind,rows])=>`<section class="journal-category ${collapsed.includes(kind)?'is-collapsed':''}" data-journal-category="${esc(kind)}"><button class="journal-category-head" type="button" data-toggle-journal-category="${esc(kind)}"><span>${V7_TYPES[kind]||'📝'}</span><div><b>${esc(kind)}</b><small>${rows.length} ${rows.length===1?'registro':'registros'}</small></div><i>${collapsed.includes(kind)?'＋':'−'}</i></button><div class="journal-category-body life-timeline">${rows.map(item=>entryHtml(item)).join('')}</div></section>`).join('');
  return `<div class="section-title"><div><h2>📖 Diario científico</h2><p>Búsqueda combinada por contenido, fecha, importancia y material visual</p></div><button class="button" data-journal-for="">＋ Entrada</button></div>
  <form id="v73JournalFilters" class="card v73-filter-panel"><div class="v73-filter-primary"><input name="query" value="${esc(cfg.query||'')}" placeholder="Buscar palabras, colonia o contenido…"><select name="colony"><option value="all">Todas las colonias</option>${db.colonies.map(colony=>`<option value="${esc(colony.id)}" ${String(cfg.colony)===String(colony.id)?'selected':''}>${esc(colony.name)}</option>`).join('')}</select><select name="type"><option value="all">Todos los tipos</option>${types.map(type=>`<option value="${esc(type)}" ${cfg.type===type?'selected':''}>${esc(type)}</option>`).join('')}</select></div><details ${activeFilters?'open':''}><summary>Filtros avanzados <span>${activeFilters||'ninguno'}</span></summary><div class="v73-filter-grid"><label>Importancia<select name="importance">${['all','Normal','Importante','Hito'].map(value=>`<option value="${value}" ${cfg.importance===value?'selected':''}>${value==='all'?'Cualquier importancia':value}</option>`).join('')}</select></label><label>Desde<input name="from" type="text" inputmode="numeric" data-local-date="true" placeholder="DD/MM/YYYY" value="${esc(toDisplayDate(cfg.from||''))}"></label><label>Hasta<input name="to" type="text" inputmode="numeric" data-local-date="true" placeholder="DD/MM/YYYY" value="${esc(toDisplayDate(cfg.to||''))}"></label><label>Material<select name="media"><option value="all" ${cfg.media==='all'?'selected':''}>Con o sin fotos</option><option value="with" ${cfg.media==='with'?'selected':''}>Solo con fotos/vídeos</option><option value="without" ${cfg.media==='without'?'selected':''}>Sin material visual</option></select></label><label>Etiquetas<input name="tags" value="${esc(cfg.tags||'')}" placeholder="cría, mudanza"></label></div></details><div class="v73-filter-actions"><button class="button">Aplicar filtros</button><button type="button" class="button secondary" data-clear-journal-filters>Limpiar</button></div></form>
  <div class="v73-result-strip"><span><b>${items.length}</b> de ${all.length} registros</span><span>${items.filter(v73JournalHasMedia).length} con material visual</span><span>${items.filter(item=>item.importance==='Hito'||item.kind==='Hito').length} hitos</span></div>${grouped||'<div class="card empty">No hay entradas que coincidan con todos los filtros.</div>'}`;
};

/* Permite editar el origen desde la propia ficha de colonia. */
const antelmoPendingColonyForm=colonyForm;
colonyForm=function(id){
  antelmoPendingColonyForm(id);
  const form=document.querySelector('#v72ColonyForm');
  if(!form)return;
  const colony=db.colonies.find(item=>String(item.id)===String(id))||{};
  if(form.elements.origin)return;
  const notes=form.elements.notes?.closest('label')||form.elements.notes?.parentElement;
  const wrapper=document.createElement('label');
  wrapper.innerHTML=`Origen<select name="origin"><option value="">Sin indicar</option>${['Compra','Captura propia','Adopción o cesión','Vuelo nupcial','Otro'].map(value=>`<option ${colony.origin===value?'selected':''}>${value}</option>`).join('')}</select>`;
  if(notes)notes.before(wrapper);else form.querySelector('.button')?.before(wrapper);
};

/* Al tocar Módulos estando ya dentro, vuelve al Centro. */
document.addEventListener('click',event=>{
  const navButton=event.target.closest('#nav button');
  if(navButton&&navButton.textContent.includes('Módulos')&&navButton.classList.contains('active')){
    event.preventDefault();event.stopImmediatePropagation();
    db.appConfig.moreTab='hub';route='more';selected=null;save();render();return;
  }
  const toggle=event.target.closest('[data-toggle-journal-category]');
  if(toggle){
    const kind=toggle.dataset.toggleJournalCategory,list=antelmoJournalCollapsed();
    const index=list.indexOf(kind);index>=0?list.splice(index,1):list.push(kind);
    save();render();
  }
},true);

(function installV736Styles(){
  const style=document.createElement('style');style.id='antelmo-v736-styles';style.textContent=`
  .colony-care-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  .colony-care-actions button{min-height:58px;display:grid;grid-template-columns:30px minmax(0,1fr);grid-template-rows:auto auto;column-gap:9px;align-items:center;padding:9px 11px;border-radius:15px}
  .colony-care-actions button>span{grid-row:1/3;font-size:21px}.colony-care-actions button>b{margin:0;font-size:13px}.colony-care-actions button>small{font-size:9px}
  .journal-category{margin-bottom:10px}.journal-category-head{width:100%;display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);text-align:left}
  .journal-category-head>span{font-size:21px}.journal-category-head b,.journal-category-head small{display:block}.journal-category-head small{color:var(--muted);font-size:9px;margin-top:2px}.journal-category-head i{font-style:normal;font-size:20px;color:var(--green)}
  .journal-category-body{margin-top:8px}.journal-category.is-collapsed .journal-category-body{display:none}
  .v73-comparison-grid{grid-template-columns:minmax(125px,1fr) repeat(var(--compare-columns),minmax(105px,1fr));min-width:calc(125px + var(--compare-columns) * 105px)}
  .v73-comparison-grid>*{padding:8px 7px}.v73-comparison-grid .colony-heading span{font-size:21px}.v73-comparison-grid .colony-heading b{font-size:11px}.v73-comparison-grid .colony-heading small{font-size:8px}.v73-comparison-grid .metric-label,.v73-comparison-grid .metric-value{font-size:10px}
  @media(max-width:430px){.colony-care-actions{grid-template-columns:1fr}.v73-comparison-grid{min-width:calc(115px + var(--compare-columns) * 96px);grid-template-columns:115px repeat(var(--compare-columns),96px)}}`;
  document.head.appendChild(style);
})();
