/* ANTELMO V7.3.7 — mejoras pendientes revisadas y completadas. */

function antelmoSafeIsoDate(value=''){
  const text=String(value||'').slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return null;
  const date=new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime())?null:date;
}

daysSince=function(value){
  const date=antelmoSafeIsoDate(value);if(!date)return null;
  const todayDate=antelmoSafeIsoDate(today());if(!todayDate)return null;
  const days=Math.floor((todayDate-date)/86400000);
  return Number.isFinite(days)?Math.max(0,days):null;
};

function antelmoSafeDisplay(value,fallback='—'){
  if(value==null||value==='')return fallback;
  const text=String(value);
  return /(^|[^a-z])nan([^a-z]|$)/i.test(text)||/undefined|null/i.test(text)?fallback:text;
}

const antelmoPendingComparisonMetrics=typeof v73ComparisonMetrics==='function'?v73ComparisonMetrics:null;
if(antelmoPendingComparisonMetrics){v73ComparisonMetrics=function(colony){const metrics=antelmoPendingComparisonMetrics(colony);return Object.fromEntries(Object.entries(metrics).map(([key,value])=>[key,antelmoSafeDisplay(value)]));};}

function antelmoJournalCollapsed(){db.appConfig.v73 ||= {};db.appConfig.v73.collapsedJournalTypes ||= [];return db.appConfig.v73.collapsedJournalTypes;}

records=function(){
  ensureLocalRoadmapData();
  const cfg=db.appConfig.v73.journal,items=v73FilteredJournal(),all=journalItems();
  const types=[...new Set(all.map(item=>item.kind).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const activeFilters=[cfg.query,cfg.colony!=='all',cfg.type!=='all',cfg.importance!=='all',cfg.from,cfg.to,cfg.media!=='all',cfg.tags].filter(Boolean).length;
  const groups={};items.forEach(item=>(groups[item.kind||'Otros']||=[]).push(item));
  const collapsed=antelmoJournalCollapsed();
  const grouped=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b,'es')).map(([kind,rows])=>`<section class="journal-category ${collapsed.includes(kind)?'is-collapsed':''}" data-journal-category="${esc(kind)}"><button class="journal-category-head" type="button" data-toggle-journal-category="${esc(kind)}"><span>${V7_TYPES[kind]||'📝'}</span><div><b>${esc(kind)}</b><small>${rows.length} ${rows.length===1?'registro':'registros'}</small></div><i>${collapsed.includes(kind)?'＋':'−'}</i></button><div class="journal-category-body life-timeline">${rows.map(item=>entryHtml(item)).join('')}</div></section>`).join('');
  return `<div class="section-title"><div><h2>📖 Diario científico</h2><p>Búsqueda combinada por contenido, fecha, importancia y material visual</p></div><button class="button" data-journal-for="">＋ Entrada</button></div><form id="v73JournalFilters" class="card v73-filter-panel"><div class="v73-filter-primary"><input name="query" value="${esc(cfg.query||'')}" placeholder="Buscar palabras, colonia o contenido…"><select name="colony"><option value="all">Todas las colonias</option>${db.colonies.map(colony=>`<option value="${esc(colony.id)}" ${String(cfg.colony)===String(colony.id)?'selected':''}>${esc(colony.name)}</option>`).join('')}</select><select name="type"><option value="all">Todos los tipos</option>${types.map(type=>`<option value="${esc(type)}" ${cfg.type===type?'selected':''}>${esc(type)}</option>`).join('')}</select></div><details ${activeFilters?'open':''}><summary>Filtros avanzados <span>${activeFilters||'ninguno'}</span></summary><div class="v73-filter-grid"><label>Importancia<select name="importance">${['all','Normal','Importante','Hito'].map(value=>`<option value="${value}" ${cfg.importance===value?'selected':''}>${value==='all'?'Cualquier importancia':value}</option>`).join('')}</select></label><label>Desde<input name="from" type="text" inputmode="numeric" data-local-date="true" placeholder="DD/MM/YYYY" value="${esc(toDisplayDate(cfg.from||''))}"></label><label>Hasta<input name="to" type="text" inputmode="numeric" data-local-date="true" placeholder="DD/MM/YYYY" value="${esc(toDisplayDate(cfg.to||''))}"></label><label>Material<select name="media"><option value="all" ${cfg.media==='all'?'selected':''}>Con o sin fotos</option><option value="with" ${cfg.media==='with'?'selected':''}>Solo con fotos/vídeos</option><option value="without" ${cfg.media==='without'?'selected':''}>Sin material visual</option></select></label><label>Etiquetas<input name="tags" value="${esc(cfg.tags||'')}" placeholder="cría, mudanza"></label></div></details><div class="v73-filter-actions"><button class="button">Aplicar filtros</button><button type="button" class="button secondary" data-clear-journal-filters>Limpiar</button></div></form><div class="v73-result-strip"><span><b>${items.length}</b> de ${all.length} registros</span><span>${items.filter(v73JournalHasMedia).length} con material visual</span><span>${items.filter(item=>item.importance==='Hito'||item.kind==='Hito').length} hitos</span></div>${grouped||'<div class="card empty">No hay entradas que coincidan con todos los filtros.</div>'}`;
};

const antelmoPendingColonyForm=colonyForm;
colonyForm=function(id){antelmoPendingColonyForm(id);const form=document.querySelector('#v72ColonyForm');if(!form)return;const colony=db.colonies.find(item=>String(item.id)===String(id))||{};if(form.elements.origin)return;const notes=form.elements.notes?.closest('label')||form.elements.notes?.parentElement;const wrapper=document.createElement('label');wrapper.innerHTML=`Origen<select name="origin"><option value="">Sin indicar</option>${['Compra','Captura propia','Adopción o cesión','Vuelo nupcial','Otro'].map(value=>`<option ${colony.origin===value?'selected':''}>${value}</option>`).join('')}</select>`;if(notes)notes.before(wrapper);else form.querySelector('.button')?.before(wrapper);};

/* Registrar una misma comida o entrada en todas las colonias. */
function antelmoAddAllOption(form){const select=form?.elements?.colonyId;if(select&&!select.querySelector('[value="__all__"]'))select.insertAdjacentHTML('afterbegin','<option value="__all__">Todas las colonias</option>');}
const antelmoBaseFeedingForm=feedingForm;
feedingForm=function(id=''){antelmoBaseFeedingForm(id);const form=document.querySelector('#v72FeedForm');antelmoAddAllOption(form);if(!form)return;const original=form.onsubmit;form.onsubmit=async event=>{if(form.elements.colonyId.value!=='__all__')return original.call(form,event);event.preventDefault();const fd=new FormData(form),date=toIsoDate(fd.get('date'));for(const colony of db.colonies.filter(c=>c.lifecycle!=='historical'))db.feedings.push({id:uid('feed'),colonyId:colony.id,date,category:fd.get('category'),food:fd.get('food'),notes:fd.get('notes'),photoIds:[]});save();closeModal();toast('Alimentación añadida a todas las colonias');render();};};
const antelmoBaseJournalForm=journalForm;
journalForm=function(id=''){antelmoBaseJournalForm(id);const form=document.querySelector('#v72JournalForm');antelmoAddAllOption(form);if(!form)return;const original=form.onsubmit;form.onsubmit=async event=>{if(form.elements.colonyId.value!=='__all__')return original.call(form,event);event.preventDefault();const fd=new FormData(form),date=toIsoDate(fd.get('date'));for(const colony of db.colonies.filter(c=>c.lifecycle!=='historical'))db.journalEntries.push({id:uid('journal'),colonyId:colony.id,date,type:fd.get('type'),title:fd.get('title'),description:fd.get('description'),importance:fd.get('importance'),tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),relatedColonyIds:[],photoIds:[],createdAt:new Date().toISOString()});save();closeModal();toast('Entrada añadida a todas las colonias');render();};};

/* Día, Noche y Automático siguiendo el aspecto del iPhone. */
const antelmoThemeMedia=window.matchMedia('(prefers-color-scheme: dark)');
function antelmoAppearance(){db.appConfig ||= {};return db.appConfig.appearanceMode||'auto';}
function antelmoApplyAppearance(){const mode=antelmoAppearance(),dark=mode==='dark'||(mode==='auto'&&antelmoThemeMedia.matches);document.body.classList.toggle('dark',dark);const button=document.querySelector('#themeBtn');if(button){button.textContent=mode==='auto'?'◐':mode==='dark'?'☾':'☀';button.title=`Apariencia: ${mode==='auto'?'Automático':mode==='dark'?'Noche':'Día'}`;button.setAttribute('aria-label',button.title);}}
function antelmoCycleAppearance(){const modes=['light','dark','auto'],next=modes[(modes.indexOf(antelmoAppearance())+1)%modes.length];db.appConfig.appearanceMode=next;save();antelmoApplyAppearance();toast(`Apariencia: ${next==='light'?'Día':next==='dark'?'Noche':'Automático'}`);}
antelmoThemeMedia.addEventListener?.('change',()=>{if(antelmoAppearance()==='auto')antelmoApplyAppearance()});

const antelmoPendingRender=render;
render=function(){antelmoPendingRender();antelmoApplyAppearance();};

document.addEventListener('click',event=>{
  const theme=event.target.closest('#themeBtn');if(theme){event.preventDefault();event.stopImmediatePropagation();antelmoCycleAppearance();return;}
  const navButton=event.target.closest('#nav button');
  if(navButton&&navButton.textContent.includes('Módulos')&&navButton.classList.contains('active')){event.preventDefault();event.stopImmediatePropagation();db.appConfig.moreTab='hub';route='more';selected=null;save();render();return;}
  const toggle=event.target.closest('[data-toggle-journal-category]');if(toggle){const kind=toggle.dataset.toggleJournalCategory,list=antelmoJournalCollapsed();const index=list.indexOf(kind);index>=0?list.splice(index,1):list.push(kind);save();render();}
},true);

(function installV737Styles(){const style=document.createElement('style');style.id='antelmo-v737-styles';style.textContent=`
  input,select,textarea{font-size:16px!important}body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}.topbar h1,.section-title h2,.workbench-v7-welcome h2{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;font-weight:800}
  .workbench-v7-primary{grid-template-columns:1fr 1fr;gap:7px}.workbench-v7-primary button{min-height:52px;padding:8px 10px;border-radius:15px}.workbench-v7-primary button>span{display:block}.workbench-v7-primary button>b{font-size:12px}.workbench-v7-primary button small{font-size:8px}
  .workbench-tools{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.workbench-tools button{min-height:58px;display:grid;grid-template-columns:28px minmax(0,1fr);grid-template-rows:auto auto;column-gap:8px;align-items:center;padding:9px 10px;border-radius:15px}.workbench-tools button>span{grid-row:1/3;font-size:20px}.workbench-tools button>b{margin:0;font-size:12px}.workbench-tools button>small{font-size:8px}
  .workbench-overview{gap:7px}.workbench-overview article{padding:9px 10px;border-radius:15px}.workbench-overview article>span{width:30px;height:30px;font-size:16px}.workbench-overview b{font-size:17px}
  .colony-care-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.colony-care-actions button{min-height:58px;display:grid;grid-template-columns:30px minmax(0,1fr);grid-template-rows:auto auto;column-gap:9px;align-items:center;padding:9px 11px;border-radius:15px}.colony-care-actions button>span{grid-row:1/3;font-size:21px}.colony-care-actions button>b{margin:0;font-size:13px}.colony-care-actions button>small{font-size:9px}
  .journal-category{margin-bottom:10px}.journal-category-head{width:100%;display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);text-align:left}.journal-category-head>span{font-size:21px}.journal-category-head b,.journal-category-head small{display:block}.journal-category-head small{color:var(--muted);font-size:9px;margin-top:2px}.journal-category-head i{font-style:normal;font-size:20px;color:var(--green)}.journal-category-body{margin-top:8px}.journal-category.is-collapsed .journal-category-body{display:none}
  .v73-comparison-grid{grid-template-columns:minmax(125px,1fr) repeat(var(--compare-columns),minmax(105px,1fr));min-width:calc(125px + var(--compare-columns) * 105px)}.v73-comparison-grid>*{padding:8px 7px}.v73-comparison-grid .colony-heading span{font-size:21px}.v73-comparison-grid .colony-heading b{font-size:11px}.v73-comparison-grid .colony-heading small{font-size:8px}.v73-comparison-grid .metric-label,.v73-comparison-grid .metric-value{font-size:10px}
  @media(max-width:430px){.workbench-v7-primary,.workbench-tools{grid-template-columns:1fr 1fr}.workbench-overview{grid-template-columns:1fr 1fr}.colony-care-actions{grid-template-columns:1fr}.v73-comparison-grid{min-width:calc(115px + var(--compare-columns) * 96px);grid-template-columns:115px repeat(var(--compare-columns),96px)}}`;
  document.head.appendChild(style);antelmoApplyAppearance();})();
