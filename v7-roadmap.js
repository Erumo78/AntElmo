/* ANTELMO V7.2 — Roadmap visual, organización y continuidad.
   Esta capa mantiene los datos ISO internamente y presenta las fechas como DD/MM/YYYY. */
const v72BaseSave=save;
const v72BaseBoot=boot;
const v72BaseBind=bind;
const v72BaseRender=render;
const v72BaseOpenModal=openModal;
const v72BaseCloseModal=closeModal;
const v72BaseColonies=colonies;
const v72BaseColonyForm=colonyForm;
const v72BaseJournalItems=journalItems;
const v72BaseEntryHtml=entryHtml;
const v72BaseHubView=hubView;
const v72BaseMore=more;
const v72BaseDocumentary=documentaryHtml;

let v72SyncTimer=null;
let v72TimelapseTimer=null;
let v72PresentationIndex=0;
let v72RemoteBusy=false;

const V72_WIDGETS=[
  ['overview','Resumen general'],
  ['care','Cuidados para hoy'],
  ['colonies','Colonias vivas'],
  ['tools','Herramientas rápidas'],
  ['life','Libro de Vida']
];

function speciesAccent(species=''){
  const palette=['#3d765c','#9b7b39','#8b5f50','#536f8c','#77608e','#927044','#46777a'];
  let hash=0;for(const ch of species)hash=(hash*31+ch.charCodeAt(0))>>>0;
  return palette[hash%palette.length];
}

function ensureRoadmapData(){
  ensureV7Data();
  db.collections ||= [];
  db.mediaIndex ||= [];
  db.remoteSync ||= {enabled:false,url:'',token:'',lastSync:'',autoMinutes:30};
  db.appConfig.v72 ||= {};
  const cfg=db.appConfig.v72;
  cfg.dashboardWidgets ||= V72_WIDGETS.map(x=>x[0]);
  cfg.dashboardHidden ||= [];
  cfg.colonySort ||= 'manual';
  cfg.collectionFilter ||= 'all';
  cfg.favoriteColonyId ||= '';
  cfg.summaryPeriod ||= 'month';
  cfg.notifications ||= {enabled:false,feeding:true,photos:true,tasks:true};
  db.colonies.forEach(c=>{
    c.collectionId ||= '';
    c.icon ||= '🐜';
    c.accentColor ||= speciesAccent(c.species||c.name);
    c.tags=Array.isArray(c.tags)?c.tags:String(c.tags||'').split(',').map(x=>x.trim()).filter(Boolean);
  });
  db.metadata={...(db.metadata||{}),schemaVersion:'7.2.0'};
}

function toDisplayDate(value){
  if(!value)return value;
  const text=String(value);
  const timestamp=text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(timestamp)return `${timestamp[3]}/${timestamp[2]}/${timestamp[1]} · ${timestamp[4]}:${timestamp[5]}`;
  return text
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g,'$3/$2/$1')
    .replace(/\b(\d{4})-(\d{2})\b/g,'$2/$1');
}

function toIsoDate(value){
  if(!value)return value;
  const text=String(value).trim();
  const local=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(local)return `${local[3]}-${String(local[2]).padStart(2,'0')}-${String(local[1]).padStart(2,'0')}`;
  return text;
}

function formatVisibleDates(root=document){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    if(['SCRIPT','STYLE','TEXTAREA'].includes(node.parentElement?.tagName))return;
    const formatted=toDisplayDate(node.nodeValue);
    if(formatted!==node.nodeValue)node.nodeValue=formatted;
  });
}

function prepareDateInputs(root=document){
  root.querySelectorAll?.('input[type="date"]').forEach(input=>{
    const value=input.value;
    input.type='text';
    input.inputMode='numeric';
    input.placeholder='DD/MM/YYYY';
    input.pattern='(?:0?[1-9]|[12][0-9]|3[01])/(?:0?[1-9]|1[0-2])/[0-9]{4}';
    input.value=toDisplayDate(value);
    input.dataset.localDate='true';
  });
}

document.addEventListener('submit',event=>{
  event.target.querySelectorAll?.('[data-local-date="true"]').forEach(input=>{
    input.value=toIsoDate(input.value);
  });
},true);

openModal=function(html){
  v72BaseOpenModal(html);
  prepareDateInputs($('#modalBody'));
  formatVisibleDates($('#modalBody'));
};

closeModal=function(){
  if(v72TimelapseTimer){clearInterval(v72TimelapseTimer);v72TimelapseTimer=null}
  v72BaseCloseModal();
};

function mediaMetaFromPhoto(photo,extra={}){
  return {
    id:String(photo.id),colonyId:String(photo.colonyId||''),date:photo.date||today(),
    caption:photo.caption||'Fotografía',type:photo.blob?.type||photo.mime||'image/jpeg',
    createdAt:photo.createdAt||new Date().toISOString(),...extra
  };
}

function indexMedia(photo,extra={}){
  const meta=mediaMetaFromPhoto(photo,extra);
  const i=db.mediaIndex.findIndex(x=>String(x.id)===String(meta.id));
  if(i>=0)db.mediaIndex[i]={...db.mediaIndex[i],...meta};
  else db.mediaIndex.push(meta);
  return meta;
}

async function backfillMediaIndex(){
  const photos=await photoAll();
  let changed=false;
  photos.forEach(photo=>{
    if(!db.mediaIndex.some(x=>String(x.id)===String(photo.id))){indexMedia(photo);changed=true}
  });
  if(changed)v72BaseSave();
}

function journalMediaIds(item){
  return [...new Set([...(item.photoIds||[]),...(item.mediaIds||[])].map(String))];
}

journalItems=function(colonyId=null){
  ensureRoadmapData();
  const items=v72BaseJournalItems(colonyId);
  const related=db.journalEntries.filter(x=>
    colonyId!=null&&(x.relatedColonyIds||[]).map(String).includes(String(colonyId))&&
    String(x.colonyId)!==String(colonyId)
  ).map(x=>({...x,source:'journal-related',kind:x.type||'Nota',title:x.title||x.type||'Entrada relacionada',
    text:x.description||x.notes||'',icon:V7_TYPES[x.type]||'📝'}));
  const media=db.mediaIndex.filter(x=>
    !x.journalId&&!x.feedingId&&(colonyId==null||String(x.colonyId)===String(colonyId))
  ).map(x=>({...x,source:'media',kind:'Fotografía',title:x.caption||'Fotografía',
    text:'Añadida al archivo visual',icon:'📷',photoIds:[x.id],importance:'Normal'}));
  const unique=new Map();
  [...items,...related,...media].forEach(x=>unique.set(`${x.source||'entry'}:${x.id}`,x));
  return [...unique.values()].sort((a,b)=>`${b.date||''}${b.time||''}`.localeCompare(`${a.date||''}${a.time||''}`));
};

entryHtml=function(item,showColony=true){
  const base=v72BaseEntryHtml(item,showColony);
  const ids=journalMediaIds(item);
  const related=(item.relatedColonyIds||[]).map(colonyName).filter(Boolean);
  if(!ids.length&&!related.length)return base;
  const extras=`${related.length?`<div class="related-colonies"><b>También relacionada con</b> ${related.map(esc).join(' · ')}</div>`:''}
    ${ids.length?`<div class="journal-photo-strip">${ids.map(id=>`<button data-view-indexed-media="${esc(id)}"><span class="media-placeholder" data-media-id="${esc(id)}">📷</span></button>`).join('')}</div>`:''}`;
  return base.replace('</article>',`${extras}</article>`);
};

async function hydrateRoadmapMedia(){
  const placeholders=$$('[data-media-id]');
  if(!placeholders.length)return;
  const photos=await photoAll();
  placeholders.forEach(el=>{
    const photo=photos.find(x=>String(x.id)===String(el.dataset.mediaId));
    if(!photo?.blob)return;
    const video=photo.blob.type?.startsWith('video/');
    el.innerHTML=video?`<video muted playsinline src="${URL.createObjectURL(photo.blob)}"></video>`:
      `<img alt="${esc(photo.caption||'Fotografía')}" src="${URL.createObjectURL(photo.blob)}">`;
  });
  $$('[data-view-indexed-media]').forEach(button=>button.onclick=()=>{
    const photo=photos.find(x=>String(x.id)===String(button.dataset.viewIndexedMedia));
    if(photo)viewPhoto(photo,URL.createObjectURL(photo.blob),photo.colonyId);
  });
}

function relatedColonyOptions(primary=''){
  return db.colonies.filter(c=>String(c.id)!==String(primary))
    .map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
}

journalForm=function(id=''){
  openModal(`<h2>📖 Nueva entrada</h2><p class="modal-intro">Puede incluir fotografías y quedar relacionada con varias colonias.</p>
  <form id="v72JournalForm" class="form">${field('Colonia principal',`<select name="colonyId" required>${colonyOptions(id)}</select>`)}
  ${field('Otras colonias relacionadas',`<select name="relatedColonyIds" multiple size="4">${relatedColonyOptions(id)}</select><small class="field-help">Mantén pulsado para elegir varias en ordenador.</small>`)}
  <div class="row">${field('Fecha',`<input name="date" type="date" value="${today()}" required>`)}${field('Tipo',`<select name="type">${Object.keys(V7_TYPES).filter(x=>!['Alimentación','Condiciones','Recuento'].includes(x)).map(x=>`<option>${x}</option>`).join('')}</select>`)}</div>
  ${field('Título',`<input name="title" required placeholder="¿Qué ha ocurrido?">`)}
  ${field('Descripción',`<textarea name="description" placeholder="Comportamiento, cambios y detalles importantes…"></textarea>`)}
  ${field('Fotografías opcionales',`<input name="photos" type="file" accept="image/*,video/*" multiple>`)}
  <div class="row">${field('Importancia',`<select name="importance"><option>Normal</option><option>Importante</option><option>Hito</option></select>`)}${field('Etiquetas',`<input name="tags" placeholder="cría, mudanza, salud">`)}</div>
  <button class="button">Guardar en el Libro de Vida</button></form>`);
  $('#v72JournalForm').onsubmit=async event=>{
    event.preventDefault();
    const form=event.target,fd=new FormData(form);
    const entry={id:uid('journal'),colonyId:fd.get('colonyId'),date:toIsoDate(fd.get('date')),type:fd.get('type'),
      title:fd.get('title'),description:fd.get('description'),importance:fd.get('importance'),
      tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),
      relatedColonyIds:[...form.elements.relatedColonyIds.selectedOptions].map(x=>x.value),
      photoIds:[],createdAt:new Date().toISOString()};
    for(const file of [...form.elements.photos.files]){
      const blob=file.type.startsWith('image/')?await optimizeImage(file):file;
      const photo={id:uid('journal-media'),colonyId:entry.colonyId,date:entry.date,
        caption:entry.title,cover:false,blob,createdAt:new Date().toISOString()};
      await photoPut(photo);indexMedia(photo,{journalId:entry.id});entry.photoIds.push(photo.id);
    }
    db.journalEntries.push(entry);save();closeModal();toast('Entrada añadida al Libro de Vida');render();
  };
};

feedingForm=function(id=''){
  openModal(`<h2>🍯 Registrar alimentación</h2><form id="v72FeedForm" class="form">${field('Colonia',`<select name="colonyId" required>${colonyOptions(id)}</select>`)}
  <div class="row">${field('Fecha',`<input name="date" type="date" value="${today()}" required>`)}${field('Tipo',`<select name="category"><option>Semillas</option><option>Proteína</option><option>Néctar</option><option>Fruta</option><option>Otro</option></select>`)}</div>
  ${field('Alimento',`<input name="food" placeholder="Chía, grillo, néctar…" required>`)}
  ${field('Respuesta de la colonia',`<textarea name="notes" placeholder="Aceptación, comportamiento, restos…"></textarea>`)}
  ${field('Fotografías opcionales',`<input name="photos" type="file" accept="image/*,video/*" multiple>`)}
  <button class="button">Guardar alimentación</button></form>`);
  $('#v72FeedForm').onsubmit=async event=>{
    event.preventDefault();const form=event.target,fd=new FormData(form);
    const feed={id:uid('feed'),colonyId:fd.get('colonyId'),date:toIsoDate(fd.get('date')),
      category:fd.get('category'),food:fd.get('food'),notes:fd.get('notes'),photoIds:[]};
    for(const file of [...form.elements.photos.files]){
      const blob=file.type.startsWith('image/')?await optimizeImage(file):file;
      const photo={id:uid('feed-media'),colonyId:feed.colonyId,date:feed.date,caption:feed.food,cover:false,blob};
      await photoPut(photo);indexMedia(photo,{feedingId:feed.id});feed.photoIds.push(photo.id);
    }
    db.feedings.push(feed);save();closeModal();toast('Alimentación guardada');render();
  };
};

photoForm=function(id=''){
  openModal(`<h2>📸 Añadir multimedia</h2><p class="modal-intro">Las fotografías aparecerán automáticamente en el Diario y la cronología.</p>
  <form id="v72PhotoForm" class="form">${field('Colonia',`<select name="colonyId">${colonyOptions(id)}</select>`)}
  ${field('Fecha',`<input name="date" type="date" value="${today()}">`)}
  ${field('Fotos o vídeo',`<input name="photo" type="file" accept="image/*,video/*" multiple required>`)}
  ${field('Descripción común',`<input name="caption" placeholder="Llegada, cría, mudanza, timelapse…">`)}
  <label class="check-row"><input name="cover" type="checkbox"> Usar la primera fotografía como portada</label>
  <button class="button">Guardar</button></form>`);
  $('#v72PhotoForm').onsubmit=async event=>{
    event.preventDefault();const form=event.target,fd=new FormData(form),files=[...form.elements.photo.files];
    if(!files.length)return;
    const colonyId=fd.get('colonyId'),date=toIsoDate(fd.get('date')),cover=fd.get('cover')==='on';
    if(cover)await clearCovers(colonyId);
    let i=0;for(const file of files){
      const blob=file.type.startsWith('image/')?await optimizeImage(file):file;
      const photo={id:uid('media'),colonyId,date,caption:fd.get('caption')||(files.length>1?`Archivo ${i+1}`:''),
        cover:cover&&i===0&&file.type.startsWith('image/'),blob,createdAt:new Date().toISOString()};
      await photoPut(photo);indexMedia(photo);i++;
    }
    db.metadata.photoCount=(db.metadata.photoCount||0)+files.length;
    save();closeModal();toast(`${files.length} archivo${files.length===1?'':'s'} guardado${files.length===1?'':'s'}`);render();
  };
};

function collectionName(id){
  return db.collections.find(x=>String(x.id)===String(id))?.name||'Sin colección';
}

function sortedRoadmapColonies(list){
  const mode=db.appConfig.v72.colonySort;
  if(mode==='manual')return orderedColonies(list);
  const copy=list.slice();
  if(mode==='name')return copy.sort((a,b)=>String(a.name).localeCompare(String(b.name),'es'));
  if(mode==='species')return copy.sort((a,b)=>String(a.species||'').localeCompare(String(b.species||''),'es'));
  if(mode==='workers')return copy.sort((a,b)=>(+b.workers||0)-(+a.workers||0));
  if(mode==='attention')return copy.sort((a,b)=>{
    const score=c=>({attention:0,due:1,good:2}[healthSignal(c)[0]]??3);
    return score(a)-score(b);
  });
  return copy;
}

colonies=function(){
  ensureRoadmapData();
  const v7=db.appConfig.v7,v72=db.appConfig.v72,view=v7.colonyView||'active',layout=v7.colonyLayout||'detail';
  let list=db.colonies.filter(c=>view==='historical'?c.lifecycle==='historical':c.lifecycle!=='historical');
  if(v72.collectionFilter!=='all')list=list.filter(c=>String(c.collectionId||'')===String(v72.collectionFilter));
  list=sortedRoadmapColonies(list);
  const manual=v72.colonySort==='manual';
  return `<div class="section-title"><div><h2>${view==='historical'?'🏛️ Colonias históricas':'Mis colonias'}</h2><p>${list.length} ${view==='historical'?'historias conservadas':'fichas activas'}</p></div>${view==='active'?'<button class="button" data-new-colony>＋ Colonia</button>':''}</div>
  <div class="tabs"><button class="${view==='active'?'active':''}" data-colony-view="active">Activas</button><button class="${view==='historical'?'active':''}" data-colony-view="historical">Legado</button></div>
  <section class="card colony-organizer"><div>${field('Orden',`<select id="colonyAutoSort"><option value="manual" ${manual?'selected':''}>Manual</option><option value="name" ${v72.colonySort==='name'?'selected':''}>Nombre</option><option value="species" ${v72.colonySort==='species'?'selected':''}>Especie</option><option value="workers" ${v72.colonySort==='workers'?'selected':''}>Población</option><option value="attention" ${v72.colonySort==='attention'?'selected':''}>Cuidados pendientes</option></select>`)}</div>
  <div>${field('Colección',`<select id="colonyCollectionFilter"><option value="all">Todas</option><option value="">Sin colección</option>${db.collections.map(x=>`<option value="${esc(x.id)}" ${String(v72.collectionFilter)===String(x.id)?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`)}</div>
  <button class="button secondary" data-manage-collections>Carpetas</button></section>
  <div class="colony-viewbar card"><div><span>Vista</span><button class="${layout==='detail'?'active':''}" data-colony-layout="detail" aria-label="Vista detallada">☷ <small>Detallada</small></button><button class="${layout==='grid'?'active':''}" data-colony-layout="grid" aria-label="Vista cuadrícula">▦ <small>Cuadrícula</small></button><button class="${layout==='compact'?'active':''}" data-colony-layout="compact" aria-label="Vista compacta">☰ <small>Compacta</small></button></div>${manual?`<button class="${v7.colonyMoveMode?'active':''}" data-toggle-move>↕ ${v7.colonyMoveMode?'Terminar':'Ordenar'}</button>`:'<span class="auto-order-badge">Orden automático</span>'}</div>
  ${manual&&v7.colonyMoveMode?'<p class="sort-help">Mantén pulsada y arrastra una colonia, o utiliza las flechas para cambiar su posición.</p>':''}
  <div class="colony-layout colony-layout-${layout}">${list.map((c,i)=>sortableColony(c,layout,i,list.length)).join('')||'<div class="card empty">No hay colonias en esta selección.</div>'}</div>`;
};

function collectionManager(){
  openModal(`<h2>🗂️ Carpetas y colecciones</h2><p class="modal-intro">Agrupa colonias por habitación, proyecto, especie o cualquier criterio personal.</p>
  <div class="collection-list">${db.collections.map(x=>`<article><i style="background:${esc(x.color)}"></i><b>${esc(x.name)}</b><small>${db.colonies.filter(c=>String(c.collectionId)===String(x.id)).length} colonias</small><button data-delete-collection="${esc(x.id)}" aria-label="Eliminar ${esc(x.name)}">×</button></article>`).join('')||'<div class="empty">Todavía no has creado ninguna colección.</div>'}</div>
  <form id="collectionForm" class="form">${field('Nombre',`<input name="name" required placeholder="Reinas jóvenes, Messor, Estudio 2026…">`)}
  ${field('Color',`<input name="color" type="color" value="#3d765c">`)}<button class="button">Crear colección</button></form>`);
  $('#collectionForm').onsubmit=event=>{
    event.preventDefault();const o=Object.fromEntries(new FormData(event.target));
    db.collections.push({id:uid('collection'),...o});save();collectionManager();
  };
  $$('[data-delete-collection]').forEach(button=>button.onclick=()=>{
    const id=button.dataset.deleteCollection;
    db.colonies.forEach(c=>{if(String(c.collectionId)===String(id))c.collectionId=''});
    db.collections=db.collections.filter(x=>String(x.id)!==String(id));
    if(String(db.appConfig.v72.collectionFilter)===String(id))db.appConfig.v72.collectionFilter='all';
    save();collectionManager();
  });
}

colonyForm=function(id){
  ensureRoadmapData();
  const colony=db.colonies.find(x=>String(x.id)===String(id))||{};
  openModal(`<h2>${id?'Editar':'Nueva'} colonia</h2><form id="v72ColonyForm" class="form">
  ${field('Nombre',`<input name="name" value="${esc(colony.name||'')}" required>`)}
  ${field('Especie',`<input name="species" value="${esc(colony.species||'')}">`)}
  <div class="row">${field('Obreras',`<input name="workers" type="number" min="0" value="${esc(colony.workers??0)}">`)}${field('Reinas',`<input name="queens" type="number" min="0" value="${esc(colony.queens??1)}">`)}</div>
  <div class="row">${field('Estado',`<select name="status">${['Crecimiento','Estable','En observación','En tránsito'].map(x=>`<option ${colony.status===x?'selected':''}>${x}</option>`).join('')}</select>`)}${field('Fecha de inicio',`<input name="founded" type="date" value="${esc(colony.founded||today())}">`)}</div>
  ${field('Instalación',`<input name="location" value="${esc(colony.location||'')}">`)}
  <div class="row">${field('Icono',`<input name="icon" value="${esc(colony.icon||'🐜')}" maxlength="8">`)}${field('Color de la colonia',`<input name="accentColor" type="color" value="${esc(colony.accentColor||speciesAccent(colony.species||colony.name))}">`)}</div>
  ${field('Colección',`<select name="collectionId"><option value="">Sin colección</option>${db.collections.map(x=>`<option value="${esc(x.id)}" ${String(colony.collectionId)===String(x.id)?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`)}
  ${field('Etiquetas',`<input name="tags" value="${esc((colony.tags||[]).join(', '))}" placeholder="favorita, estudio, exterior">`)}
  ${field('Notas',`<textarea name="notes">${esc(colony.notes||'')}</textarea>`)}
  <button class="button">Guardar colonia</button>${id&&colony.lifecycle!=='historical'?'<button type="button" class="button danger" id="archiveFromEdit">Archivar en el Legado</button>':''}</form>`);
  $('#v72ColonyForm').onsubmit=event=>{
    event.preventDefault();const o=Object.fromEntries(new FormData(event.target));
    o.workers=+o.workers||0;o.queens=+o.queens||0;o.founded=toIsoDate(o.founded);
    o.tags=String(o.tags||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(id)Object.assign(colony,o,{updatedAt:today()});
    else{
      const fresh={id:uid('colony'),lifecycle:'active',createdAt:today(),updatedAt:today(),...o};
      db.colonies.push(fresh);db.appConfig.v7.colonyOrder.push(String(fresh.id));
    }
    save();closeModal();toast('Colonia guardada');selected=id||null;render();
  };
  $('#archiveFromEdit')&&($('#archiveFromEdit').onclick=()=>archiveColonyForm(id));
};

function dashboardSettings(){
  const cfg=db.appConfig.v72;
  openModal(`<h2>🧩 Personalizar la Mesa</h2><p class="modal-intro">Elige qué bloques aparecen y cambia su posición.</p>
  <form id="dashboardSettingsForm" class="form"><div class="widget-settings">${cfg.dashboardWidgets.map((id,index)=>{
    const label=V72_WIDGETS.find(x=>x[0]===id)?.[1]||id;
    return `<article><label class="check-row"><input type="checkbox" name="visible" value="${esc(id)}" ${cfg.dashboardHidden.includes(id)?'':'checked'}><b>${esc(label)}</b></label><div><button type="button" data-widget-move="${esc(id)}" data-widget-direction="-1" ${index===0?'disabled':''}>↑</button><button type="button" data-widget-move="${esc(id)}" data-widget-direction="1" ${index===cfg.dashboardWidgets.length-1?'disabled':''}>↓</button></div></article>`;
  }).join('')}</div><button class="button">Guardar diseño</button></form>`);
  $('#dashboardSettingsForm').onsubmit=event=>{
    event.preventDefault();const visible=new FormData(event.target).getAll('visible');
    cfg.dashboardHidden=cfg.dashboardWidgets.filter(id=>!visible.includes(id));save();closeModal();render();
  };
  $$('[data-widget-move]').forEach(button=>button.onclick=()=>{
    const i=cfg.dashboardWidgets.indexOf(button.dataset.widgetMove),next=i+Number(button.dataset.widgetDirection);
    if(i<0||next<0||next>=cfg.dashboardWidgets.length)return;
    [cfg.dashboardWidgets[i],cfg.dashboardWidgets[next]]=[cfg.dashboardWidgets[next],cfg.dashboardWidgets[i]];
    save();dashboardSettings();
  });
}

function enhanceDashboard(){
  if(route!=='home')return;
  const hero=$('.workbench-v7-hero');if(!hero)return;
  const titles=$$('.workbench-section-title');
  const groups={
    overview:[$('.workbench-overview')],
    care:[titles[0],$('.workbench-care')],
    colonies:[titles[1],$('.workbench-v7-grid')],
    tools:[$('.workbench-tools')],
    life:[$('.v7-strip')]
  };
  let cursor=hero;
  db.appConfig.v72.dashboardWidgets.forEach(id=>{
    const section=document.createElement('section');
    section.className=`dashboard-widget ${db.appConfig.v72.dashboardHidden.includes(id)?'is-hidden':''}`;
    section.dataset.dashboardWidget=id;
    (groups[id]||[]).filter(Boolean).forEach(node=>section.appendChild(node));
    cursor.after(section);cursor=section;
  });
  const button=document.createElement('button');
  button.className='dashboard-customize';button.innerHTML='🧩 <span>Personalizar</span>';
  button.setAttribute('aria-label','Personalizar la Mesa');
  button.onclick=dashboardSettings;hero.appendChild(button);
  const kicker=hero.querySelector('.workbench-v7-welcome .eyebrow');
  if(kicker)kicker.textContent=`CENTRO DE MANDO · ${toDisplayDate(today())}`;
}

function applyColonyThemes(){
  $$('[data-colony]').forEach(card=>{
    const colony=db.colonies.find(c=>String(c.id)===String(card.dataset.colony));if(!colony)return;
    card.classList.add('species-themed');
    card.style.setProperty('--colony-accent',colony.accentColor||speciesAccent(colony.species||colony.name));
    setTimeout(()=>{
      card.querySelectorAll('.avatar').forEach(avatar=>{if(!avatar.querySelector('img'))avatar.textContent=colony.icon||'🐜'});
    },120);
  });
}

archiveColonyForm=function(id){
  const colony=db.colonies.find(x=>String(x.id)===String(id));if(!colony)return;
  openModal(`<h2>🏛️ Guardar en el Legado</h2><p class="modal-intro">Se conservará una fotografía estadística final además de todo el historial.</p>
  <form id="v72ArchiveForm" class="form">${field('Fecha de finalización',`<input name="endedAt" type="date" value="${today()}" required>`)}
  ${field('Motivo o contexto',`<textarea name="endReason" placeholder="Fallecimiento de la reina, fusión, pérdida, final natural…"></textarea>`)}
  <button class="button">Conservar como colonia histórica</button></form>`);
  $('#v72ArchiveForm').onsubmit=event=>{
    event.preventDefault();const o=Object.fromEntries(new FormData(event.target));
    const entries=journalItems(colony.id);
    colony.finalSnapshot={
      workers:+colony.workers||0,queens:+colony.queens||0,feedings:db.feedings.filter(x=>String(x.colonyId)===String(id)).length,
      incidents:entries.filter(x=>x.kind==='Incidencia').length,moves:entries.filter(x=>/muda|traslado|hormiguero/i.test(`${x.kind} ${x.title}`)).length,
      entries:entries.length,photos:db.mediaIndex.filter(x=>String(x.colonyId)===String(id)).length,
      capturedAt:new Date().toISOString()
    };
    Object.assign(colony,o,{endedAt:toIsoDate(o.endedAt),lifecycle:'historical',status:'Histórica',updatedAt:today()});
    db.journalEntries.push({id:uid('journal'),colonyId:colony.id,date:today(),type:'Hito',
      title:'La colonia pasa al Legado',description:colony.endReason||'Ciclo de seguimiento finalizado.',
      importance:'Hito',tags:['legado']});
    save();closeModal();selected=null;toast('Historia conservada en el Legado');render();
  };
};

function periodStart(period){
  if(period==='all')return '';
  const date=new Date(`${today()}T12:00:00`);
  date.setDate(date.getDate()-(period==='week'?7:period==='year'?365:30));
  return date.toISOString().slice(0,10);
}

function summarySentence(colony,items,period){
  const feeds=items.filter(x=>x.kind==='Alimentación').length;
  const growth=items.filter(x=>x.kind==='Recuento');
  const milestones=items.filter(x=>x.kind==='Hito'||x.importance==='Hito').length;
  const incidents=items.filter(x=>x.kind==='Incidencia').length;
  const label={week:'Durante los últimos 7 días',month:'Durante los últimos 30 días',year:'Durante el último año',all:'Desde el inicio'}[period];
  const parts=[`${label}, ${colony.name} ha reunido ${items.length} registro${items.length===1?'':'s'}.`];
  if(feeds)parts.push(`Se documentaron ${feeds} alimentación${feeds===1?'':'es'}.`);
  if(growth.length>1){const change=(+growth[0].workers||0)-(+growth.at(-1).workers||0);if(change)parts.push(`La población registrada varió en ${change>0?'+':''}${change} obreras.`)}
  if(milestones)parts.push(`Se alcanzaron ${milestones} hito${milestones===1?'':'s'}.`);
  if(incidents)parts.push(`También constan ${incidents} incidencia${incidents===1?'':'s'}.`);
  return parts.join(' ');
}

function summariesView(){
  const period=db.appConfig.v72.summaryPeriod,start=periodStart(period);
  return `<div class="section-title"><div><h2>🗓️ Resúmenes periódicos</h2><p>Lecturas semanales, mensuales y anuales del Libro de Vida</p></div></div>
  <div class="card summary-period"><label>Periodo<select id="summaryPeriod"><option value="week" ${period==='week'?'selected':''}>Últimos 7 días</option><option value="month" ${period==='month'?'selected':''}>Últimos 30 días</option><option value="year" ${period==='year'?'selected':''}>Último año</option><option value="all" ${period==='all'?'selected':''}>Historia completa</option></select></label></div>
  <div class="period-summary-grid">${db.colonies.filter(c=>c.lifecycle!=='historical').map(c=>{
    const items=journalItems(c.id).filter(x=>!start||String(x.date)>=start);
    return `<article class="card period-summary"><span>${esc(c.icon||'🐜')}</span><div><b>${esc(c.name)}</b><p>${esc(summarySentence(c,items,period))}</p><small>${items.filter(x=>x.kind==='Fotografía').length} fotos · ${items.filter(x=>x.kind==='Alimentación').length} comidas · ${items.filter(x=>x.kind==='Recuento').length} recuentos</small></div></article>`;
  }).join('')}</div>`;
}

function colonyComparisonMetrics(colony){
  const entries=journalItems(colony.id),growth=db.growthRecords.filter(x=>String(x.colonyId)===String(colony.id)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const env=db.environmentLogs.filter(x=>String(x.colonyId)===String(colony.id));
  const avg=(arr,key)=>arr.length?(arr.reduce((n,x)=>n+(+x[key]||0),0)/arr.length).toFixed(1):'—';
  const spanDays=colony.founded?daysSince(colony.founded):null;
  let monthly='—';
  if(growth.length>1){
    const days=Math.max(1,(new Date(growth.at(-1).date)-new Date(growth[0].date))/86400000);
    monthly=(((+growth.at(-1).workers||0)-(+growth[0].workers||0))/days*30).toFixed(1);
  }
  return {
    'Población':+colony.workers||0,'Reinas':+colony.queens||0,'Edad documentada':spanDays==null?'—':`${spanDays} días`,
    'Crecimiento mensual':monthly==='—'?'—':`${monthly} obreras`,'Alimentaciones':db.feedings.filter(x=>String(x.colonyId)===String(colony.id)).length,
    'Incidencias':entries.filter(x=>x.kind==='Incidencia').length,'Mudanzas':entries.filter(x=>/muda|traslado|hormiguero/i.test(`${x.kind} ${x.title}`)).length,
    'Temperatura media':avg(env,'temperature')==='—'?'—':`${avg(env,'temperature')} °C`,
    'Humedad media':avg(env,'humidity')==='—'?'—':`${avg(env,'humidity')} %`,
    'Fotografías':db.mediaIndex.filter(x=>String(x.colonyId)===String(colony.id)).length,
    'Capítulos':entries.length
  };
}

function compareView(){
  const active=db.colonies.filter(c=>c.lifecycle!=='historical');
  let a=db.appConfig.v72.compareA||active[0]?.id||'',b=db.appConfig.v72.compareB||active[1]?.id||active[0]?.id||'';
  const ca=db.colonies.find(c=>String(c.id)===String(a)),cb=db.colonies.find(c=>String(c.id)===String(b));
  const ma=ca?colonyComparisonMetrics(ca):{},mb=cb?colonyComparisonMetrics(cb):{};
  return `<div class="section-title"><div><h2>⚖️ Comparador de colonias</h2><p>Crecimiento, cuidados, ambiente y longevidad</p></div></div>
  <form id="compareColoniesForm" class="card compare-selectors">${field('Primera colonia',`<select name="a">${colonyOptions(a)}</select>`)}<span>frente a</span>${field('Segunda colonia',`<select name="b">${colonyOptions(b)}</select>`)}<button class="button">Comparar</button></form>
  ${ca&&cb?`<section class="comparison-head"><div style="--colony-accent:${esc(ca.accentColor)}"><span>${esc(ca.icon)}</span><b>${esc(ca.name)}</b><small>${esc(ca.species||'')}</small></div><i>VS</i><div style="--colony-accent:${esc(cb.accentColor)}"><span>${esc(cb.icon)}</span><b>${esc(cb.name)}</b><small>${esc(cb.species||'')}</small></div></section>
  <div class="comparison-table">${Object.keys(ma).map(key=>`<div><strong>${esc(ma[key])}</strong><span>${esc(key)}</span><strong>${esc(mb[key])}</strong></div>`).join('')}</div>`:'<div class="card empty">Necesitas al menos dos colonias para comparar.</div>'}`;
}

function libraryView(){
  const cfg=db.appConfig.v72,query=String(cfg.libraryQuery||'').toLowerCase(),species=cfg.librarySpecies||'all',year=cfg.libraryYear||'all',longevity=cfg.libraryLongevity||'all',success=cfg.librarySuccess||'all';
  const historical=db.colonies.filter(c=>c.lifecycle==='historical');
  const speciesList=[...new Set(historical.map(c=>c.species).filter(Boolean))].sort();
  const years=[...new Set(historical.flatMap(c=>[String(c.founded||'').slice(0,4),String(c.endedAt||'').slice(0,4)]).filter(Boolean))].sort().reverse();
  const lifeDays=c=>c.founded&&c.endedAt?Math.max(0,Math.round((new Date(c.endedAt)-new Date(c.founded))/86400000)):0;
  const successful=c=>success==='all'||(success==='large'&&+(c.finalSnapshot?.workers??c.workers??0)>=100)||(success==='milestones'&&journalItems(c.id).some(x=>x.kind==='Hito'||x.importance==='Hito'))||(success==='documented'&&journalItems(c.id).length>=20);
  const longEnough=c=>longevity==='all'||lifeDays(c)>=+longevity;
  const list=historical.filter(c=>(!query||`${c.name} ${c.species} ${c.endReason} ${(c.tags||[]).join(' ')}`.toLowerCase().includes(query))&&(species==='all'||c.species===species)&&(year==='all'||String(c.founded||'').startsWith(year)||String(c.endedAt||'').startsWith(year))&&longEnough(c)&&successful(c));
  return `<div class="section-title"><div><h2>🏛️ Biblioteca histórica</h2><p>Busca todo el legado por nombre, especie o año</p></div></div>
  <form id="libraryFilterForm" class="card library-filters"><input name="query" value="${esc(cfg.libraryQuery||'')}" placeholder="Nombre, motivo, etiqueta…"><select name="species"><option value="all">Todas las especies</option>${speciesList.map(x=>`<option ${species===x?'selected':''}>${esc(x)}</option>`).join('')}</select><select name="year"><option value="all">Todos los años</option>${years.map(x=>`<option ${year===x?'selected':''}>${esc(x)}</option>`).join('')}</select><select name="longevity"><option value="all">Cualquier longevidad</option><option value="365" ${longevity==='365'?'selected':''}>Más de un año</option><option value="730" ${longevity==='730'?'selected':''}>Más de dos años</option><option value="1095" ${longevity==='1095'?'selected':''}>Más de tres años</option></select><select name="success"><option value="all">Cualquier resultado</option><option value="large" ${success==='large'?'selected':''}>100+ obreras</option><option value="milestones" ${success==='milestones'?'selected':''}>Con hitos</option><option value="documented" ${success==='documented'?'selected':''}>20+ capítulos</option></select><button class="button">Buscar</button></form>
  <div class="historical-library">${list.map(c=>{const s=c.finalSnapshot||{};return `<article class="card historical-volume" data-colony="${esc(c.id)}" style="--colony-accent:${esc(c.accentColor)}"><span>${esc(c.icon||'🐜')}</span><div><b>${esc(c.name)}</b><i>${esc(c.species||'Especie sin confirmar')}</i><small>${toDisplayDate(c.founded||'—')} — ${toDisplayDate(c.endedAt||'—')}</small><p>${esc(c.endReason||'Historia conservada en ANTELMO.')}</p><div><em>${s.workers??c.workers??'—'} obreras</em><em>${s.entries??journalItems(c.id).length} capítulos</em><em>${s.photos??db.mediaIndex.filter(x=>String(x.colonyId)===String(c.id)).length} fotos</em></div></div></article>`}).join('')||'<div class="card empty">No hay historias que coincidan con los filtros.</div>'}</div>`;
}

function growthVelocity(colony){
  const rows=db.growthRecords.filter(x=>String(x.colonyId)===String(colony.id)&&x.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(rows.length<2)return null;
  const days=Math.max(1,(new Date(rows.at(-1).date)-new Date(rows[0].date))/86400000);
  return ((+rows.at(-1).workers||0)-(+rows[0].workers||0))/days*30;
}

function hallView(){
  const colonies=db.colonies.slice(),favorite=db.colonies.find(c=>String(c.id)===String(db.appConfig.v72.favoriteColonyId));
  const longest=colonies.filter(c=>c.founded).sort((a,b)=>(daysSince(b.founded)||0)-(daysSince(a.founded)||0))[0];
  const largest=colonies.sort((a,b)=>(+b.workers||0)-(+a.workers||0))[0];
  const fastest=colonies.map(c=>({c,value:growthVelocity(c)})).filter(x=>x.value!=null).sort((a,b)=>b.value-a.value)[0];
  const photographed=colonies.map(c=>({c,value:db.mediaIndex.filter(x=>String(x.colonyId)===String(c.id)).length})).sort((a,b)=>b.value-a.value)[0];
  const fed=colonies.map(c=>({c,value:db.feedings.filter(x=>String(x.colonyId)===String(c.id)).length})).sort((a,b)=>b.value-a.value)[0];
  const records=[
    ['👑','Más longeva',longest,longest?`${daysSince(longest.founded)} días documentados`:'Sin datos'],
    ['🐜','Más numerosa',largest,largest?`${largest.workers||0} obreras`:'Sin datos'],
    ['🌱','Crecimiento más rápido',fastest?.c,fastest?`${fastest.value.toFixed(1)} obreras/mes`:'Necesita dos recuentos'],
    ['📸','Más fotografiada',photographed?.c,photographed?`${photographed.value} archivos`:'Sin fotos'],
    ['🍯','Más alimentaciones',fed?.c,fed?`${fed.value} registros`:'Sin datos'],
    ['❤️','Colonia favorita',favorite,favorite?'Elegida por ti':'Sin elegir']
  ];
  return `<div class="section-title"><div><h2>🏆 Hall of Fame</h2><p>Récords automáticos de toda tu historia</p></div></div>
  <form id="favoriteColonyForm" class="card favorite-picker">${field('Colonia favorita',`<select name="favorite"><option value="">Sin elegir</option>${db.colonies.map(c=>`<option value="${esc(c.id)}" ${String(favorite?.id)===String(c.id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select>`)}<button class="button">Guardar favorita</button></form>
  <div class="hall-grid">${records.map(([icon,title,colony,value])=>`<article class="hall-card ${title==='Colonia favorita'?'favorite':''}" ${colony?`data-colony="${esc(colony.id)}"`:''}><span>${icon}</span><small>${esc(title)}</small><b>${esc(colony?.name||'Pendiente')}</b><p>${esc(value)}</p></article>`).join('')}</div>`;
}

function presentationView(){
  return `<div class="section-title"><div><h2>🎴 Presentación y tarjetas</h2><p>Muestra tus colonias como una colección visual</p></div><button class="button" data-start-presentation="0">▶ Presentar</button></div>
  <div class="collectible-grid">${db.colonies.filter(c=>c.lifecycle!=='historical').map((c,index)=>`<article class="collectible-card" data-start-presentation="${index}" style="--colony-accent:${esc(c.accentColor)}"><div class="collectible-number">ANTDEX ${String(index+1).padStart(3,'0')}</div><div class="collectible-icon">${esc(c.icon||'🐜')}</div><span>${esc(c.status||'Colonia')}</span><h3>${esc(c.name)}</h3><i>${esc(c.species||'Especie sin confirmar')}</i><div><b>${c.workers??'—'}<small>obreras</small></b><b>${journalItems(c.id).length}<small>capítulos</small></b></div><button>Ver tarjeta</button></article>`).join('')}</div>`;
}

async function openPresentation(index=0){
  const colonies=db.colonies.filter(c=>c.lifecycle!=='historical');if(!colonies.length)return toast('No hay colonias activas');
  v72PresentationIndex=(Number(index)+colonies.length)%colonies.length;
  const colony=colonies[v72PresentationIndex],latest=journalItems(colony.id).slice(0,4);
  openModal(`<div class="presentation-slide" style="--colony-accent:${esc(colony.accentColor)}"><span class="presentation-kicker">ANTELMO · ${v72PresentationIndex+1}/${colonies.length}</span><div class="presentation-emblem">${esc(colony.icon||'🐜')}</div><h2>${esc(colony.name)}</h2><i>${esc(colony.species||'Especie sin confirmar')}</i><p>${esc(storyForColony(colony))}</p><div class="presentation-metrics"><span><b>${colony.workers??'—'}</b>obreras</span><span><b>${colony.queens??'—'}</b>reinas</span><span><b>${journalItems(colony.id).length}</b>capítulos</span></div><div class="presentation-chapters">${latest.map(x=>`<span>${x.icon} ${esc(x.title)} <small>${toDisplayDate(x.date)}</small></span>`).join('')}</div><div class="presentation-nav"><button id="presentationPrev">← Anterior</button><button id="presentationNext">Siguiente →</button></div></div>`);
  $('#presentationPrev').onclick=()=>openPresentation(v72PresentationIndex-1);
  $('#presentationNext').onclick=()=>openPresentation(v72PresentationIndex+1);
}

function timelapseView(){
  const selectedId=db.appConfig.v72.timelapseColony||db.colonies[0]?.id||'';
  const count=db.mediaIndex.filter(x=>String(x.colonyId)===String(selectedId)&&String(x.type||'').startsWith('image/')).length;
  return `<div class="section-title"><div><h2>🎞️ Timelapse automático</h2><p>Recorre la evolución fotográfica en orden cronológico</p></div></div>
  <section class="card timelapse-control">${field('Colonia',`<select id="timelapseColony">${colonyOptions(selectedId)}</select>`)}<div><b>${count}</b><small>fotografías disponibles</small></div><button class="button" data-play-timelapse>▶ Reproducir</button><button class="button secondary" data-sync-photo-compare>🔍 Comparar extremos</button></section>
  <div class="card timelapse-explainer"><span>🎬</span><div><b>Película de crecimiento</b><p>ANTELMO ordena las imágenes por fecha y crea una reproducción automática. El comparador aplica el mismo nivel de zoom a la primera y la última imagen.</p></div></div>`;
}

async function colonyImagePhotos(id){
  return (await photoAll()).filter(x=>String(x.colonyId)===String(id)&&x.blob?.type?.startsWith('image/')).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

async function openTimelapse(id){
  const photos=await colonyImagePhotos(id);if(!photos.length)return toast('Esta colonia todavía no tiene fotografías');
  let index=0;const urls=photos.map(x=>URL.createObjectURL(x.blob));
  openModal(`<div class="timelapse-player"><span>TIMELAPSE · <b id="timelapseCounter"></b></span><img id="timelapseImage" alt="Evolución fotográfica"><div><b id="timelapseCaption"></b><small id="timelapseDate"></small></div><input id="timelapseSpeed" type="range" min="700" max="3500" step="100" value="1800"><div class="presentation-nav"><button id="timelapsePrev">←</button><button id="timelapsePlay">Pausar</button><button id="timelapseNext">→</button></div></div>`);
  const show=()=>{$('#timelapseImage').src=urls[index];$('#timelapseCounter').textContent=`${index+1}/${photos.length}`;$('#timelapseCaption').textContent=photos[index].caption||'Sin descripción';$('#timelapseDate').textContent=toDisplayDate(photos[index].date||'Sin fecha')};
  const start=()=>{if(v72TimelapseTimer)clearInterval(v72TimelapseTimer);v72TimelapseTimer=setInterval(()=>{index=(index+1)%photos.length;show()},+$('#timelapseSpeed').value)};
  show();start();
  $('#timelapsePrev').onclick=()=>{index=(index-1+photos.length)%photos.length;show()};
  $('#timelapseNext').onclick=()=>{index=(index+1)%photos.length;show()};
  $('#timelapsePlay').onclick=event=>{if(v72TimelapseTimer){clearInterval(v72TimelapseTimer);v72TimelapseTimer=null;event.target.textContent='Reproducir'}else{start();event.target.textContent='Pausar'}};
  $('#timelapseSpeed').onchange=start;
}

async function openSynchronizedCompare(id){
  const photos=await colonyImagePhotos(id);if(photos.length<2)return toast('Necesitas al menos dos fotografías');
  const pair=[photos[0],photos.at(-1)],urls=pair.map(x=>URL.createObjectURL(x.blob));
  openModal(`<h2>🔍 Comparador sincronizado</h2><div class="synced-compare">${pair.map((p,i)=>`<figure><div><img src="${urls[i]}" alt="${i?'Después':'Antes'}"></div><figcaption><b>${i?'Después':'Antes'}</b><span>${toDisplayDate(p.date)} · ${esc(p.caption||'')}</span></figcaption></figure>`).join('')}</div><label class="zoom-control">Zoom sincronizado <input id="syncZoom" type="range" min="1" max="3" step=".1" value="1"></label>`);
  $('#syncZoom').oninput=event=>$$('.synced-compare img').forEach(img=>img.style.transform=`scale(${event.target.value})`);
}

function notificationView(){
  const cfg=db.appConfig.v72.notifications;
  const supported='Notification'in window,permission=supported?Notification.permission:'unsupported';
  return `<div class="section-title"><div><h2>🔔 Avisos del móvil</h2><p>Recordatorios reales cuando ANTELMO detecta cuidados pendientes</p></div></div>
  <section class="card notification-status ${permission}"><span>${permission==='granted'?'✅':permission==='denied'?'⛔':'🔔'}</span><div><b>${permission==='granted'?'Avisos permitidos':permission==='denied'?'Avisos bloqueados':supported?'Permiso pendiente':'No disponible en este navegador'}</b><p>${permission==='granted'?'ANTELMO puede mostrar avisos del sistema.':permission==='denied'?'Actívalos desde los ajustes del navegador o de la aplicación.':'Instala ANTELMO en la pantalla de inicio para obtener el mejor funcionamiento.'}</p></div>${supported&&permission!=='granted'?'<button class="button" data-request-notifications>Activar avisos</button>':''}</section>
  <form id="notificationSettingsForm" class="card form"><label class="check-row"><input name="enabled" type="checkbox" ${cfg.enabled?'checked':''}> Activar comprobación diaria</label><label class="check-row"><input name="feeding" type="checkbox" ${cfg.feeding?'checked':''}> Alimentaciones pendientes</label><label class="check-row"><input name="photos" type="checkbox" ${cfg.photos?'checked':''}> Seguimiento fotográfico</label><label class="check-row"><input name="tasks" type="checkbox" ${cfg.tasks?'checked':''}> Recordatorios y tareas vencidas</label><button class="button">Guardar avisos</button><button type="button" class="button secondary" data-test-notification>Enviar aviso de prueba</button></form>
  <div class="card privacy-note"><b>ℹ️ Funcionamiento</b><p>La aplicación comprueba los avisos al abrirse y utiliza las notificaciones del sistema. Los avisos continuos con la aplicación totalmente cerrada dependen de las capacidades permitidas por iOS o Android.</p></div>`;
}

async function showAntelmoNotification(title,body){
  if(!('Notification'in window)||Notification.permission!=='granted')return false;
  try{
    const registration=await navigator.serviceWorker?.ready;
    if(registration)await registration.showNotification(title,{body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'antelmo-care',data:{url:'./'}});
    else new Notification(title,{body,icon:'icons/icon-192.png'});
    return true;
  }catch{return false}
}

async function requestAntelmoNotifications(){
  if(!('Notification'in window))return toast('Este navegador no ofrece notificaciones');
  const permission=await Notification.requestPermission();
  db.appConfig.v72.notifications.enabled=permission==='granted';save();
  if(permission==='granted')await showAntelmoNotification('ANTELMO está preparado','Los avisos de tus colonias ya están activos.');
  render();
}

async function checkDueNotifications(force=false){
  ensureRoadmapData();
  const cfg=db.appConfig.v72.notifications;if(!cfg.enabled||!('Notification'in window)||Notification.permission!=='granted')return;
  const key='antelmo.v72.lastNotification',last=localStorage.getItem(key);
  if(!force&&last===today())return;
  const items=smartCareItems().filter(x=>(x.action==='feed'&&cfg.feeding)||(x.action==='photo'&&cfg.photos));
  const tasks=cfg.tasks?db.tasks.filter(t=>t.status!=='Completada'&&t.dueDate&&t.dueDate<=today()):[];
  if(items.length||tasks.length){
    const total=items.length+tasks.length;
    await showAntelmoNotification(`${total} cuidado${total===1?'':'s'} pendiente${total===1?'':'s'}`,
      [...items.slice(0,2).map(x=>`${x.title}: ${x.text}`),...tasks.slice(0,1).map(x=>x.title)].join(' · '));
  }
  localStorage.setItem(key,today());
}

async function portableRoadmapBackup(){
  const media=[];
  for(const photo of await photoAll())media.push({...photo,blob:undefined,dataUrl:await blobToDataURL(photo.blob),mime:photo.blob.type});
  const data=JSON.parse(JSON.stringify(db));
  if(data.remoteSync)data.remoteSync={enabled:false,url:'',token:'',lastSync:data.remoteSync.lastSync||'',autoMinutes:30};
  return {...data,mediaBackup:media,metadata:{...(data.metadata||{}),schemaVersion:'7.2.0',exportedAt:new Date().toISOString()}};
}

exportBackup=async function(share=false){
  const backup=await portableRoadmapBackup();
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const file=new File([blob],`ANTELMO-V7.2-${today()}.json`,{type:'application/json'});
  if(share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'Copia ANTELMO V7.2'});
  else{const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
  toast('Copia V7.2 creada');
};

function remoteHeaders(){
  const headers={'Content-Type':'application/json'};
  if(db.remoteSync.token)headers.Authorization=`Bearer ${db.remoteSync.token}`;
  return headers;
}

async function pushRemoteSync(silent=false){
  if(v72RemoteBusy||!db.remoteSync.url)return false;
  v72RemoteBusy=true;
  try{
    const payload=await portableRoadmapBackup();
    const response=await fetch(db.remoteSync.url,{method:'PUT',headers:remoteHeaders(),body:JSON.stringify(payload)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    db.remoteSync.lastSync=new Date().toISOString();v72BaseSave();
    if(!silent)toast('Copia remota actualizada');
    return true;
  }catch(error){if(!silent)alert(`No se pudo sincronizar: ${error.message}`);return false}
  finally{v72RemoteBusy=false}
}

async function pullRemoteSync(){
  if(v72RemoteBusy||!db.remoteSync.url)return;
  if(!confirm('¿Descargar la copia remota y sustituir los datos locales?'))return;
  v72RemoteBusy=true;
  try{
    const response=await fetch(db.remoteSync.url,{headers:remoteHeaders()});if(!response.ok)throw Error(`HTTP ${response.status}`);
    const incoming=await response.json();if(!Array.isArray(incoming.colonies))throw Error('Formato no válido');
    const remoteSettings={...db.remoteSync},media=incoming.mediaBackup||[];delete incoming.mediaBackup;
    db=incoming;db.remoteSync=remoteSettings;ensureRoadmapData();
    for(const photo of media){const blob=await fetch(photo.dataUrl).then(x=>x.blob());await photoPut({...photo,blob,dataUrl:undefined})}
    save();toast('Copia remota restaurada');render();
  }catch(error){alert(`No se pudo descargar: ${error.message}`)}
  finally{v72RemoteBusy=false}
}

function cloudSyncView(){
  const sync=db.remoteSync;
  return `<div class="section-title"><div><h2>☁️ Sincronización automática</h2><p>Conecta un almacenamiento JSON o WebDAV personal</p></div></div>
  <form id="remoteSyncForm" class="card form">${field('Dirección remota',`<input name="url" type="url" value="${esc(sync.url||'')}" placeholder="https://tu-servidor/antelmo-v7.json">`)}
  ${field('Clave de acceso opcional',`<input name="token" type="password" value="${esc(sync.token||'')}" autocomplete="off">`)}
  <label class="check-row"><input name="enabled" type="checkbox" ${sync.enabled?'checked':''}> Subir automáticamente después de los cambios</label>
  <button class="button">Guardar conexión</button></form>
  <div class="cloud-actions"><button class="button" data-cloud-push>↑ Subir ahora</button><button class="button secondary" data-cloud-pull>↓ Descargar copia</button></div>
  <section class="card sync-last"><span>🔄</span><div><b>Última sincronización</b><p>${sync.lastSync?toDisplayDate(sync.lastSync):'Todavía no se ha realizado'}</p></div></section>
  <div class="card privacy-note"><b>🔒 Nube privada y opcional</b><p>ANTELMO no incluye un servidor central ni guarda tu clave fuera del dispositivo. La dirección elegida debe aceptar GET y PUT desde el navegador. Las copias manuales siguen disponibles aunque no configures esta opción.</p></div>`;
}

function scheduleRemoteSync(){
  if(v72SyncTimer)clearTimeout(v72SyncTimer);
  if(!db.remoteSync?.enabled||!db.remoteSync.url||v72RemoteBusy)return;
  v72SyncTimer=setTimeout(()=>pushRemoteSync(true),12000);
}

save=function(){
  ensureRoadmapData();v72BaseSave();
  db.metadata.schemaVersion='7.2.0';db.metadata.updatedAt=new Date().toISOString();
  localStorage.setItem('antelmo.v4',JSON.stringify(db));
  scheduleRemoteSync();
};

hubView=function(){
  return v72BaseHubView()+`<div class="section-title"><div><h2>Roadmap integrado</h2><p>Organización, comparación y presentación</p></div></div><div class="module-grid roadmap-modules">
  ${[['summaries','🗓️','Resúmenes','Semana, mes y año'],['compare','⚖️','Comparador','Hasta seis colonias'],['library','🏛️','Biblioteca','Archivo histórico'],['hall','🏆','Hall of Fame','Récords y favorita'],['presentation','🎴','Presentación','Tarjetas coleccionables'],['timelapse','🎞️','Timelapse','Evolución fotográfica'],['notifications','🔔','Avisos','Notificaciones del móvil'],['cloud','☁️','Nube automática','Conexión personal']].map(([dest,icon,title,text])=>`<button data-module="${dest}"><span>${icon}</span><b>${title}</b><small>${text}</small></button>`).join('')}</div>`;
};

function roadmapTabs(){
  const tab=db.appConfig.moreTab||'hub';
  const tabs=[['hub','Centro'],['global','Cronología'],['life','Vida'],['summaries','Resúmenes'],['compare','Comparar'],['legacy','Legado'],['library','Biblioteca'],['hall','Récords'],['feeding','Alimentación'],['smart','Cuidados'],['media','Fotos'],['timelapse','Timelapse'],['environment','Ambiente'],['ai','IA'],['achievements','Logros'],['encyclopedia','Enciclopedia'],['genealogy','Genealogía'],['presentation','Presentar'],['notifications','Avisos'],['sync','Copias'],['cloud','Nube'],['prediction','Predicción'],['fauna','Terrarios'],['scanner','AntScan'],['search','Buscar']];
  return `<div class="tabs pro-tabs v7-tabs">${tabs.map(([key,label])=>`<button class="${tab===key?'active':''}" data-more-tab="${key}">${label}</button>`).join('')}</div>`;
}

more=function(){
  ensureRoadmapData();const tab=db.appConfig.moreTab||'hub',bar=roadmapTabs();
  const custom={summaries:summariesView,compare:compareView,library:libraryView,hall:hallView,presentation:presentationView,timelapse:timelapseView,notifications:notificationView,cloud:cloudSyncView};
  if(custom[tab])return bar+custom[tab]();
  return v72BaseMore().replace(/<div class="tabs pro-tabs v7-tabs">[\s\S]*?<\/div>/,bar);
};

drawChart=function(){
  const canvas=$('#chart');if(!canvas)return;
  const id=$('#chartColony').value,rows=db.growthRecords.filter(x=>String(x.colonyId)===String(id)&&x.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const css=getComputedStyle(document.body),ink=css.getPropertyValue('--ink').trim(),line=css.getPropertyValue('--line').trim(),green=css.getPropertyValue('--green2').trim();
  ctx.strokeStyle=line;ctx.lineWidth=1;for(let i=0;i<5;i++){const y=35+i*60;ctx.beginPath();ctx.moveTo(52,y);ctx.lineTo(690,y);ctx.stroke()}
  if(!rows.length){ctx.fillStyle=ink;ctx.font='18px sans-serif';ctx.fillText('Aún no hay recuentos para esta colonia',185,165);return}
  const max=Math.max(...rows.map(x=>+x.workers),1),min=Math.min(...rows.map(x=>+x.workers),0);
  ctx.strokeStyle=green;ctx.lineWidth=5;ctx.beginPath();
  rows.forEach((point,i)=>{const x=65+(rows.length===1?300:i*600/(rows.length-1)),y=275-((point.workers-min)/(max-min||1))*210;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  rows.forEach((point,i)=>{const x=65+(rows.length===1?300:i*600/(rows.length-1)),y=275-((point.workers-min)/(max-min||1))*210;ctx.fillStyle=green;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=ink;ctx.font='12px sans-serif';ctx.fillText(String(point.workers),x-7,y-12);ctx.font='9px sans-serif';ctx.fillText(toDisplayDate(point.date),x-27,310)});
};

bind=function(){
  v72BaseBind();ensureRoadmapData();
  $('#colonyAutoSort')&&($('#colonyAutoSort').onchange=event=>{
    db.appConfig.v72.colonySort=event.target.value;
    if(event.target.value!=='manual')db.appConfig.v7.colonyMoveMode=false;
    save();render();
  });
  $('#colonyCollectionFilter')&&($('#colonyCollectionFilter').onchange=event=>{
    db.appConfig.v72.collectionFilter=event.target.value;save();render();
  });
  $('[data-manage-collections]')&&($('[data-manage-collections]').onclick=collectionManager);
  $('#summaryPeriod')&&($('#summaryPeriod').onchange=event=>{db.appConfig.v72.summaryPeriod=event.target.value;save();render()});
  $('#compareColoniesForm')&&($('#compareColoniesForm').onsubmit=event=>{
    event.preventDefault();const o=Object.fromEntries(new FormData(event.target));
    db.appConfig.v72.compareA=o.a;db.appConfig.v72.compareB=o.b;save();render();
  });
  $('#libraryFilterForm')&&($('#libraryFilterForm').onsubmit=event=>{
    event.preventDefault();const o=Object.fromEntries(new FormData(event.target));
    db.appConfig.v72.libraryQuery=o.query;db.appConfig.v72.librarySpecies=o.species;db.appConfig.v72.libraryYear=o.year;db.appConfig.v72.libraryLongevity=o.longevity;db.appConfig.v72.librarySuccess=o.success;save();render();
  });
  $('#favoriteColonyForm')&&($('#favoriteColonyForm').onsubmit=event=>{
    event.preventDefault();db.appConfig.v72.favoriteColonyId=new FormData(event.target).get('favorite');save();toast('Colonia favorita actualizada');render();
  });
  $$('[data-start-presentation]').forEach(element=>element.onclick=event=>{event.stopPropagation();openPresentation(element.dataset.startPresentation)});
  $('#timelapseColony')&&($('#timelapseColony').onchange=event=>{db.appConfig.v72.timelapseColony=event.target.value;save();render()});
  $('[data-play-timelapse]')&&($('[data-play-timelapse]').onclick=()=>openTimelapse($('#timelapseColony').value));
  $('[data-sync-photo-compare]')&&($('[data-sync-photo-compare]').onclick=()=>openSynchronizedCompare($('#timelapseColony').value));
  $('[data-request-notifications]')&&($('[data-request-notifications]').onclick=requestAntelmoNotifications);
  $('[data-test-notification]')&&($('[data-test-notification]').onclick=async()=>{const ok=await showAntelmoNotification('Aviso de prueba de ANTELMO','Las notificaciones funcionan correctamente.');if(!ok)toast('Primero debes permitir los avisos')});
  $('#notificationSettingsForm')&&($('#notificationSettingsForm').onsubmit=event=>{
    event.preventDefault();const fd=new FormData(event.target),cfg=db.appConfig.v72.notifications;
    cfg.enabled=fd.get('enabled')==='on';cfg.feeding=fd.get('feeding')==='on';cfg.photos=fd.get('photos')==='on';cfg.tasks=fd.get('tasks')==='on';
    save();toast('Avisos guardados');checkDueNotifications(true);render();
  });
  $('#remoteSyncForm')&&($('#remoteSyncForm').onsubmit=event=>{
    event.preventDefault();const fd=new FormData(event.target);
    db.remoteSync.url=String(fd.get('url')||'').trim();db.remoteSync.token=String(fd.get('token')||'');
    db.remoteSync.enabled=fd.get('enabled')==='on';save();toast('Conexión remota guardada');render();
  });
  $('[data-cloud-push]')&&($('[data-cloud-push]').onclick=()=>pushRemoteSync());
  $('[data-cloud-pull]')&&($('[data-cloud-pull]').onclick=pullRemoteSync);
};

function enhanceRoadmapUI(){
  enhanceDashboard();
  applyColonyThemes();
  formatVisibleDates(document);
  hydrateRoadmapMedia();
}

render=function(){
  ensureRoadmapData();v72BaseRender();enhanceRoadmapUI();
};

boot=async function(){
  await v72BaseBoot();ensureRoadmapData();await backfillMediaIndex();
  save();render();setTimeout(()=>checkDueNotifications(),1200);
};
