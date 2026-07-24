/* ANTELMO V7 — Libro de Vida
   Capa compatible con los datos y módulos de V4, V5 y V6. */
const v7BaseHome=home;
const v7BaseColonyDetail=colonyDetail;
const v7BaseMore=more;
const v7BaseBind=bind;
const v7BaseColonyForm=colonyForm;
const v7BaseBoot=boot;

const V7_TYPES={
  'Observación':'👁️','Reina':'👑','Cría':'🥚','Hormiguero':'🏠',
  'Alimentación':'🍯','Condiciones':'🌡️','Incidencia':'⚠️',
  'Hito':'❤️','Fotografía':'📷','Nota':'📝','Recuento':'📈'
};

function ensureV7Data(){
  db.journalEntries ||= [];
  db.genealogy ||= [];
  db.appConfig ||= {};
  db.appConfig.v7 ||= {journalType:'all',journalColony:'all',journalQuery:'',colonyView:'active'};
  db.appConfig.features={...(db.appConfig.features||{}),journal:true,lifeBook:true,legacy:true,globalTimeline:true,genealogy:true,prediction:true};
  if(db.appConfig.moreTab==='tools')db.appConfig.moreTab='hub';
  db.colonies ||= [];
  db.colonies.forEach(c=>{
    c.lifecycle ||= c.archivedAt?'historical':'active';
    c.tags ||= [];
  });
  db.metadata={...(db.metadata||{}),schemaVersion:'7.0.0'};
  if(nav?.[0])nav[0][2]='Mando';
  if(nav?.[2])nav[2][2]='Diario';
  if(nav?.[4])nav[4][2]='Módulos';
}

save=function(){
  ensureV7Data();
  db.metadata={...(db.metadata||{}),schemaVersion:'7.0.0',updatedAt:new Date().toISOString()};
  localStorage.setItem('antelmo.v4',JSON.stringify(db));
};

exportBackup=async function(share=false){
  ensureV7Data();
  const media=[];
  for(const p of await photoAll())media.push({...p,blob:undefined,dataUrl:await blobToDataURL(p.blob),mime:p.blob.type});
  const backup={...db,mediaBackup:media,metadata:{...(db.metadata||{}),schemaVersion:'7.0.0',exportedAt:new Date().toISOString()}};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const file=new File([blob],`ANTELMO-V7-${today()}.json`,{type:'application/json'});
  if(share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'Copia ANTELMO V7'});
  else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  toast('Copia V7 creada');
};

function journalItems(colonyId=null){
  ensureV7Data();
  const same=x=>colonyId==null||String(x.colonyId)===String(colonyId);
  const items=[
    ...db.events.filter(same).map(x=>({...x,source:'event',kind:x.type||'Observación',title:x.title||x.type||'Evento',text:x.notes||'',importance:x.importance||'Normal',icon:V7_TYPES[x.type]||'📅'})),
    ...db.feedings.filter(same).map(x=>({...x,source:'feeding',kind:'Alimentación',title:x.food||'Alimentación',text:x.notes||'',importance:'Normal',icon:'🍯'})),
    ...db.growthRecords.filter(same).map(x=>({...x,source:'growth',kind:'Recuento',title:`${x.workers??'—'} obreras`,text:[x.eggs!=null?`${x.eggs} huevos`:'',x.larvae!=null?`${x.larvae} larvas`:'',x.pupae!=null?`${x.pupae} pupas`:'',x.notes||''].filter(Boolean).join(' · '),importance:'Normal',icon:'📈'})),
    ...(db.environmentLogs||[]).filter(same).map(x=>({...x,source:'environment',kind:'Condiciones',title:`${x.temperature||'—'} °C · ${x.humidity||'—'} %`,text:x.notes||'',importance:'Normal',icon:'🌡️'})),
    ...(db.observations||[]).filter(same).map(x=>({...x,source:'observation',kind:'Observación',title:x.title||'Observación',text:x.notes||x.description||'',importance:x.importance||'Normal',icon:'👁️'})),
    ...db.journalEntries.filter(same).map(x=>({...x,source:'journal',kind:x.type||'Nota',title:x.title||x.type||'Entrada',text:x.description||x.notes||'',icon:V7_TYPES[x.type]||'📝'}))
  ];
  return items.sort((a,b)=>`${b.date||''}${b.time||''}`.localeCompare(`${a.date||''}${a.time||''}`));
}

function entryHtml(x,showColony=true){
  return `<article class="life-entry ${String(x.importance||'Normal').toLowerCase()}">
    <div class="life-icon">${x.icon||V7_TYPES[x.kind]||'📝'}</div>
    <div class="life-copy"><div class="life-meta"><span>${esc(x.kind||'Registro')}</span><time>${esc(x.date||'Sin fecha')}</time>${showColony?`<span>${esc(colonyName(x.colonyId))}</span>`:''}</div>
    <h3>${esc(x.title||'Registro')}</h3>${x.text?`<p>${esc(x.text)}</p>`:''}
    ${x.tags?.length?`<div class="tag-row">${x.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</div>
    ${x.importance&&x.importance!=='Normal'?`<span class="importance-badge">${esc(x.importance)}</span>`:''}
  </article>`;
}

function storyForColony(c){
  const items=journalItems(c.id).slice().reverse();
  const first=items[0],last=items.at(-1);
  const milestones=items.filter(x=>x.importance==='Hito'||x.kind==='Hito');
  const parts=[`${c.name} es una colonia de ${c.species||'especie aún sin confirmar'}.`];
  if(c.founded)parts.push(`Su seguimiento comenzó el ${c.founded}.`);
  if(c.workers!=null)parts.push(`Actualmente tiene alrededor de ${c.workers} obreras y ${c.queens??'—'} reina${+c.queens===1?'':'s'}.`);
  if(first)parts.push(`El primer registro conservado es “${first.title}”, del ${first.date}.`);
  if(last&&last!==first)parts.push(`La anotación más reciente es “${last.title}”, del ${last.date}.`);
  if(milestones.length)parts.push(`Su Libro de Vida reúne ${milestones.length} hito${milestones.length===1?'':'s'} destacado${milestones.length===1?'':'s'}.`);
  return parts.join(' ');
}

function v7Summary(){
  const active=db.colonies.filter(c=>c.lifecycle!=='historical');
  const historical=db.colonies.filter(c=>c.lifecycle==='historical');
  const entries=journalItems();
  return `<section class="v7-strip">
    <div><span class="eyebrow">ANTELMO V7 · LIBRO DE VIDA</span><b>${entries.length} recuerdos conectados</b><small>${active.length} colonias activas · ${historical.length} históricas</small></div>
    <button class="button glass" data-v7-route="records">Abrir diario</button>
  </section>`;
}

home=function(){
  ensureV7Data();
  const all=db.colonies;
  db.colonies=all.filter(c=>c.lifecycle!=='historical');
  let base;
  try{base=v7BaseHome()}finally{db.colonies=all}
  return base+v7Summary();
};

colonies=function(){
  ensureV7Data();
  const view=db.appConfig.v7.colonyView||'active';
  const list=db.colonies.filter(c=>view==='historical'?c.lifecycle==='historical':c.lifecycle!=='historical');
  return `<div class="section-title"><div><h2>${view==='historical'?'🏛️ Colonias históricas':'Mis colonias'}</h2><p>${list.length} ${view==='historical'?'historias conservadas':'fichas activas'}</p></div>${view==='active'?'<button class="button" data-new-colony>＋ Colonia</button>':''}</div>
  <div class="tabs"><button class="${view==='active'?'active':''}" data-colony-view="active">Activas</button><button class="${view==='historical'?'active':''}" data-colony-view="historical">Legado</button></div>
  <div class="cards">${list.map(colonyCard).join('')||`<div class="card empty">${view==='historical'?'Las colonias que archives aparecerán aquí sin perder ningún dato.':'No hay colonias activas.'}</div>`}</div>`;
};

function documentaryHtml(c){
  const items=journalItems(c.id).slice(0,8);
  return `<div class="documentary">
    <div class="documentary-cover"><span>🎞️</span><div><small>MODO DOCUMENTAL</small><b>${esc(c.name)}</b><p>${items.length} escenas de su historia reciente</p></div></div>
    <div class="documentary-reel">${items.map((x,i)=>`<div><span>${x.icon||'📝'}</span><small>ESCENA ${String(i+1).padStart(2,'0')}</small><b>${esc(x.title)}</b><time>${esc(x.date||'')}</time></div>`).join('')||'<p class="empty">Añade registros para comenzar su documental.</p>'}</div>
  </div>`;
}

colonyDetail=function(id){
  ensureV7Data();
  const c=db.colonies.find(x=>String(x.id)===String(id));
  if(!c)return colonies();
  const base=v7BaseColonyDetail(id);
  const historical=c.lifecycle==='historical';
  return base+`<div class="section-title"><div><h2>📖 Libro de Vida</h2><p>Biografía construida con todos sus registros</p></div><button class="button" data-journal-for="${esc(c.id)}">＋ Entrada</button></div>
  <article class="card life-story"><span>RELATO ACTUAL</span><p>${esc(storyForColony(c))}</p></article>
  ${documentaryHtml(c)}
  <div class="section-title"><div><h2>Últimos capítulos</h2><p>Alimentación, ambiente, recuentos y notas</p></div></div>
  <div class="life-timeline">${journalItems(c.id).slice(0,12).map(x=>entryHtml(x,false)).join('')||'<div class="card empty">Su Libro de Vida todavía está esperando la primera entrada.</div>'}</div>
  <div class="legacy-action card"><div><b>${historical?'🏛️ Conservada en el Legado':'🌿 Ciclo de la colonia'}</b><p>${historical?`Historia archivada${c.endedAt?` el ${esc(c.endedAt)}`:''}. ${esc(c.endReason||'')}`:'Si su ciclo termina, archívala sin borrar fotografías, estadísticas ni recuerdos.'}</p></div>${historical?'<button class="button secondary" data-restore-colony>Restaurar</button>':`<button class="button secondary" data-archive-colony="${esc(c.id)}">Archivar</button>`}</div>`;
};

function journalForm(id=''){
  openModal(`<h2>📖 Nueva entrada</h2><p class="modal-intro">Quedará conectada al Libro de Vida, la cronología global y las estadísticas.</p>
  <form id="v7JournalForm" class="form">${field('Colonia',`<select name="colonyId" required>${colonyOptions(id)}</select>`)}
  <div class="row">${field('Fecha',`<input name="date" type="date" value="${today()}" required>`)}${field('Tipo',`<select name="type">${Object.keys(V7_TYPES).filter(x=>!['Alimentación','Condiciones','Recuento'].includes(x)).map(x=>`<option>${x}</option>`).join('')}</select>`)}</div>
  ${field('Título',`<input name="title" required placeholder="¿Qué ha ocurrido?">`)}
  ${field('Descripción',`<textarea name="description" placeholder="Comportamiento, cambios y detalles importantes…"></textarea>`)}
  <div class="row">${field('Importancia',`<select name="importance"><option>Normal</option><option>Importante</option><option>Hito</option></select>`)}${field('Etiquetas',`<input name="tags" placeholder="cría, mudanza, salud">`)}</div>
  <button class="button">Guardar en el Libro de Vida</button></form>`);
  $('#v7JournalForm').onsubmit=e=>{
    e.preventDefault();
    const o=Object.fromEntries(new FormData(e.target));
    o.tags=String(o.tags||'').split(',').map(x=>x.trim()).filter(Boolean);
    db.journalEntries.push({id:uid('journal'),createdAt:new Date().toISOString(),...o});
    save();closeModal();toast('Entrada añadida al Libro de Vida');render();
  };
}

function archiveColonyForm(id){
  const c=db.colonies.find(x=>String(x.id)===String(id));
  if(!c)return;
  openModal(`<h2>🏛️ Guardar en el Legado</h2><p class="modal-intro">No se eliminará nada. La ficha, fotos, registros y estadísticas seguirán disponibles.</p>
  <form id="archiveColonyForm" class="form">${field('Fecha de finalización',`<input name="endedAt" type="date" value="${today()}" required>`)}
  ${field('Motivo o contexto',`<textarea name="endReason" placeholder="Fallecimiento de la reina, fusión, pérdida, final natural…"></textarea>`)}
  <button class="button">Conservar como colonia histórica</button></form>`);
  $('#archiveColonyForm').onsubmit=e=>{
    e.preventDefault();Object.assign(c,Object.fromEntries(new FormData(e.target)),{lifecycle:'historical',status:'Histórica',updatedAt:today()});
    db.journalEntries.push({id:uid('journal'),colonyId:c.id,date:today(),type:'Hito',title:'La colonia pasa al Legado',description:c.endReason||'Ciclo de seguimiento finalizado.',importance:'Hito',tags:['legado']});
    save();closeModal();selected=null;toast('Historia conservada en el Legado');render();
  };
}

colonyForm=function(id){
  v7BaseColonyForm(id);
  if(!id)return;
  const del=$('#deleteColony');
  if(del){del.textContent='Archivar en el Legado';del.onclick=()=>archiveColonyForm(id);}
};

function filteredJournal(){
  ensureV7Data();
  const cfg=db.appConfig.v7;
  const q=String(cfg.journalQuery||'').toLowerCase();
  return journalItems().filter(x=>(cfg.journalType==='all'||x.kind===cfg.journalType)&&(cfg.journalColony==='all'||String(x.colonyId)===String(cfg.journalColony))&&(!q||`${x.title} ${x.text} ${colonyName(x.colonyId)} ${x.kind}`.toLowerCase().includes(q)));
}

records=function(){
  ensureV7Data();
  const cfg=db.appConfig.v7,items=filteredJournal();
  const types=['all',...new Set(journalItems().map(x=>x.kind))];
  return `<div class="section-title"><div><h2>📖 Diario</h2><p>${journalItems().length} entradas construyen tu archivo científico</p></div><button class="button" data-journal-for="">＋ Entrada</button></div>
  <form id="journalSearchForm" class="journal-controls card">
    <input name="query" value="${esc(cfg.journalQuery||'')}" placeholder="Buscar en toda la historia…">
    <select name="colony"><option value="all">Todas las colonias</option>${db.colonies.map(c=>`<option value="${esc(c.id)}" ${String(cfg.journalColony)===String(c.id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <button class="button">Buscar</button>
  </form>
  <div class="tabs journal-tabs">${types.map(x=>`<button class="${cfg.journalType===x?'active':''}" data-journal-type="${esc(x)}">${x==='all'?'Todo':esc(x)}</button>`).join('')}</div>
  <div class="journal-count"><span>${items.length} resultados</span><button class="link-btn" data-v7-tab="global">Ver cronología global →</button></div>
  <div class="life-timeline">${items.map(x=>entryHtml(x)).join('')||'<div class="card empty">No hay entradas que coincidan con la búsqueda.</div>'}</div>`;
};

function hubView(){
  const modules=[
    ['home','🏠','Centro de mando','Estado general y cuidados'],['colonies','🐜','Gestión de colonias','Fichas activas y AntDex'],
    ['records','📖','Diario','Registro científico'],['life','📚','Libro de Vida','Biografías automáticas'],
    ['legacy','🏛️','Legado','Colonias históricas'],['global','🌍','Cronología global','Todo ANTELMO por fecha'],
    ['feeding','🍯','Alimentación','Historial y preferencias'],['environment','🌡️','Revisión ambiental','Temperatura y humedad'],
    ['media','📷','Fotografías','Galería y comparación'],['stats','📊','Estadísticas','Crecimiento y actividad'],
    ['ai','🧠','IA analítica','Patrones e historias'],['achievements','🏆','Logros','Hitos automáticos'],
    ['encyclopedia','📚','Enciclopedia','Fichas de especies'],['genealogy','🌳','Genealogía','Linajes de reinas'],
    ['sync','☁️','Sincronización','Copias completas'],['prediction','🔮','Predicción','Tendencias futuras']
  ];
  return `<section class="module-intro"><span class="eyebrow">ANTELMO V7</span><h2>Un ecosistema, una sola historia</h2><p>Todos los módulos comparten los mismos registros. Una alimentación aparece en el Diario, el Libro de Vida, la cronología y las estadísticas sin duplicarse.</p></section>
  <div class="module-grid">${modules.map(([dest,icon,title,text])=>`<button data-module="${dest}"><span>${icon}</span><b>${title}</b><small>${text}</small></button>`).join('')}</div>`;
}

function lifeOverview(){
  return `<div class="section-title"><div><h2>📚 Libros de Vida</h2><p>La biografía viva de cada colonia</p></div></div>
  <div class="life-book-grid">${db.colonies.filter(c=>c.lifecycle!=='historical').map(c=>`<article class="card life-book" data-colony="${esc(c.id)}"><div><span>LIBRO ${String(db.colonies.indexOf(c)+1).padStart(2,'0')}</span><h3>${esc(c.name)}</h3><p class="latin">${esc(c.species||'Especie sin confirmar')}</p></div><p>${esc(storyForColony(c))}</p><small>${journalItems(c.id).length} capítulos · Toca para abrir</small></article>`).join('')}</div>`;
}

function legacyView(){
  const list=db.colonies.filter(c=>c.lifecycle==='historical');
  return `<div class="section-title"><div><h2>🏛️ Legado</h2><p>Archivo permanente de colonias históricas</p></div></div>
  <section class="legacy-hero card"><span>∞</span><div><b>Ninguna historia se elimina</b><p>Fotos, cuidados, estadísticas y recuerdos permanecen consultables incluso cuando termina el ciclo de una colonia.</p></div></section>
  <div class="cards">${list.map(c=>`<article class="card legacy-card" data-colony="${esc(c.id)}"><div class="legacy-seal">🏛️</div><div><b>${esc(c.name)}</b><p class="latin">${esc(c.species||'Especie sin confirmar')}</p><small>${esc(c.founded||'Fecha desconocida')} — ${esc(c.endedAt||'Actualidad')} · ${journalItems(c.id).length} registros</small><p>${esc(c.endReason||'Historia conservada en ANTELMO.')}</p></div></article>`).join('')||'<div class="card empty">Todavía no hay colonias históricas. Cuando archives una, su historia completa aparecerá aquí.</div>'}</div>`;
}

function globalTimelineView(){
  const items=journalItems(),groups={};
  items.forEach(x=>{const month=String(x.date||'Sin fecha').slice(0,7);(groups[month]||=[]).push(x)});
  return `<div class="section-title"><div><h2>🌍 Cronología global</h2><p>Todo lo ocurrido en tu mundo ANTELMO</p></div><button class="button" data-journal-for="">＋ Entrada</button></div>
  <div class="global-stats"><div><b>${items.length}</b><span>registros</span></div><div><b>${Object.keys(groups).length}</b><span>meses documentados</span></div><div><b>${db.colonies.length}</b><span>colonias</span></div></div>
  ${Object.entries(groups).map(([month,arr])=>`<section class="month-block"><h3>${esc(month)}</h3><div class="life-timeline">${arr.map(x=>entryHtml(x)).join('')}</div></section>`).join('')||'<div class="card empty">La cronología comenzará con tu primer registro.</div>'}`;
}

function feedingOverview(){
  const foods={};db.feedings.forEach(x=>{const k=x.food||x.type||'Sin especificar';foods[k]=(foods[k]||0)+1});
  const favorite=Object.entries(foods).sort((a,b)=>b[1]-a[1])[0];
  return `<div class="section-title"><div><h2>🍯 Alimentación</h2><p>Historial conectado automáticamente al Diario</p></div><button class="button" data-quick="feed">＋ Registrar</button></div>
  <div class="metric-grid"><div class="card"><b class="big-number">${db.feedings.length}</b><div class="sub">alimentaciones</div></div><div class="card"><b class="big-number">${new Set(db.feedings.map(x=>x.colonyId)).size}</b><div class="sub">colonias registradas</div></div><div class="card"><b class="big-number">${esc(favorite?.[0]||'—')}</b><div class="sub">alimento más registrado</div></div><div class="card"><b class="big-number">${esc(db.feedings.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]?.date||'—')}</b><div class="sub">última toma</div></div></div>
  <div class="section-title"><div><h2>Últimas tomas</h2><p>No se crean registros duplicados</p></div></div><div class="life-timeline">${journalItems().filter(x=>x.kind==='Alimentación').map(x=>entryHtml(x)).join('')||'<div class="card empty">No hay alimentaciones registradas.</div>'}</div>`;
}

function aiInsightsView(){
  const active=db.colonies.filter(c=>c.lifecycle!=='historical');
  const insights=[];
  active.forEach(c=>{
    const growth=db.growthRecords.filter(x=>String(x.colonyId)===String(c.id)&&x.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const feed=lastFeeding(c.id),days=daysSince(feed?.date);
    if(growth.length>1){const delta=(+growth.at(-1).workers||0)-(+growth[0].workers||0);if(delta>0)insights.push(['📈',c.name,`Ha crecido en ${delta} obreras entre el primer y el último recuento.`])}
    if(days!=null&&days>=5)insights.push(['🍯',c.name,`Han pasado ${days} días desde la última alimentación registrada.`]);
    const env=(db.environmentLogs||[]).filter(x=>String(x.colonyId)===String(c.id)).at(-1);
    if(env?.humidity&&+env.humidity<50)insights.push(['🌡️',c.name,`La última humedad registrada fue del ${env.humidity} %; conviene revisar su instalación.`]);
  });
  return `<div class="section-title"><div><h2>🧠 Inteligencia ANTELMO</h2><p>Análisis local y privado de tus registros</p></div></div>
  <div class="card privacy-note"><b>🔒 Sin enviar datos</b><p>V7 genera estas observaciones en tu dispositivo. La narración mediante un modelo externo podrá activarse en el futuro de forma voluntaria.</p></div>
  <div class="insight-grid">${insights.map(([icon,title,text])=>`<article class="card v7-insight"><span>${icon}</span><div><b>${esc(title)}</b><p>${esc(text)}</p></div></article>`).join('')||'<div class="card empty">Añade más recuentos y mediciones para descubrir patrones.</div>'}</div>
  <div class="section-title"><div><h2>Historias actuales</h2><p>Resumen narrativo automático</p></div></div>${active.map(c=>`<article class="card narrative"><b>${esc(c.name)}</b><p>${esc(storyForColony(c))}</p></article>`).join('')}`;
}

function genealogyView(){
  const relations=db.genealogy||[];
  return `<div class="section-title"><div><h2>🌳 Genealogía</h2><p>Linajes de reinas nacidas en cautividad</p></div><button class="button" data-new-relation>＋ Relación</button></div>
  <div class="genealogy-tree">${relations.map(r=>{const parent=db.colonies.find(c=>String(c.id)===String(r.parentId)),child=db.colonies.find(c=>String(c.id)===String(r.childId));return `<article class="genealogy-link"><div><span>👑</span><b>${esc(parent?.name||'Colonia de origen')}</b></div><i>dio origen a</i><div><span>🌱</span><b>${esc(child?.name||'Nueva colonia')}</b></div><small>${esc(r.date||'Sin fecha')} ${r.notes?'· '+esc(r.notes):''}</small></article>`}).join('')||'<div class="card empty">Cuando una reina nacida en cautividad origine otra colonia, podrás registrar aquí su linaje.</div>'}</div>`;
}

function genealogyForm(){
  openModal(`<h2>🌳 Nueva relación</h2><form id="genealogyForm" class="form">${field('Colonia de origen',`<select name="parentId">${colonyOptions()}</select>`)}${field('Nueva colonia',`<select name="childId">${colonyOptions()}</select>`)}${field('Fecha',`<input name="date" type="date" value="${today()}">`)}${field('Notas',`<textarea name="notes" placeholder="Reina nacida en cautividad, vuelo nupcial, adopción…"></textarea>`)}<button class="button">Guardar linaje</button></form>`);
  $('#genealogyForm').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));if(o.parentId===o.childId)return toast('Elige dos colonias distintas');db.genealogy.push({id:uid('genealogy'),...o});save();closeModal();toast('Linaje guardado');render()};
}

function predictionFor(c){
  const arr=db.growthRecords.filter(x=>String(x.colonyId)===String(c.id)&&x.workers!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  if(arr.length<2)return null;
  const days=Math.max(1,Math.round((new Date(arr.at(-1).date)-new Date(arr[0].date))/86400000));
  const daily=((+arr.at(-1).workers||0)-(+arr[0].workers||0))/days;
  return {daily,month:Math.max(0,Math.round((+c.workers||0)+daily*30)),quarter:Math.max(0,Math.round((+c.workers||0)+daily*90))};
}

function predictionView(){
  return `<div class="section-title"><div><h2>🔮 Predicción</h2><p>Estimaciones orientativas basadas en tus recuentos reales</p></div></div>
  <div class="card privacy-note"><b>ℹ️ No es una certeza biológica</b><p>Las colonias no crecen de forma lineal. Estas cifras sirven para anticipar espacio y cuidados, no como diagnóstico.</p></div>
  <div class="prediction-grid">${db.colonies.filter(c=>c.lifecycle!=='historical').map(c=>{const p=predictionFor(c);return `<article class="card prediction-card"><div><b>${esc(c.name)}</b><span>${esc(c.species||'')}</span></div>${p?`<div class="prediction-numbers"><span><b>~${p.month}</b>en 30 días</span><span><b>~${p.quarter}</b>en 90 días</span></div><small>${p.daily>=0?'Tendencia de crecimiento':'Tendencia descendente'}: ${p.daily.toFixed(2)} obreras/día</small>`:'<p class="sub">Necesita al menos dos recuentos para calcular una tendencia.</p>'}</article>`}).join('')}</div>`;
}

more=function(){
  ensureV7Data();
  const tab=db.appConfig.moreTab||'hub';
  const tabs=[['hub','Centro'],['global','Cronología'],['life','Vida'],['legacy','Legado'],['feeding','Alimentación'],['smart','Cuidados'],['media','Fotos'],['environment','Ambiente'],['ai','IA'],['achievements','Logros'],['encyclopedia','Enciclopedia'],['genealogy','Genealogía'],['sync','Sincronizar'],['prediction','Predicción'],['fauna','Terrarios'],['scanner','AntScan'],['search','Buscar']];
  const bar=`<div class="tabs pro-tabs v7-tabs">${tabs.map(([k,l])=>`<button class="${tab===k?'active':''}" data-more-tab="${k}">${l}</button>`).join('')}</div>`;
  if(tab==='hub')return bar+hubView();
  if(tab==='global')return bar+globalTimelineView();
  if(tab==='life')return bar+lifeOverview();
  if(tab==='legacy')return bar+legacyView();
  if(tab==='feeding')return bar+feedingOverview();
  if(tab==='ai')return bar+aiInsightsView();
  if(tab==='genealogy')return bar+genealogyView();
  if(tab==='prediction')return bar+predictionView();
  const old=v7BaseMore();
  return old.replace(/<div class="tabs pro-tabs">[\s\S]*?<\/div>/,bar).replace(/ANTELMO 6/g,'ANTELMO V7');
};

bind=function(){
  v7BaseBind();ensureV7Data();
  $$('[data-v7-route]').forEach(b=>b.onclick=()=>{route=b.dataset.v7Route;selected=null;render()});
  $$('[data-v7-tab]').forEach(b=>b.onclick=()=>{route='more';db.appConfig.moreTab=b.dataset.v7Tab;save();render()});
  $$('[data-module]').forEach(b=>b.onclick=()=>{
    const dest=b.dataset.module;
    if(['home','colonies','records','stats'].includes(dest)){route=dest;selected=null}
    else{route='more';db.appConfig.moreTab=dest}
    save();render();
  });
  $$('[data-journal-for]').forEach(b=>b.onclick=()=>journalForm(b.dataset.journalFor));
  $$('[data-journal-type]').forEach(b=>b.onclick=()=>{db.appConfig.v7.journalType=b.dataset.journalType;save();render()});
  $('#journalSearchForm')&&($('#journalSearchForm').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target));db.appConfig.v7.journalQuery=o.query;db.appConfig.v7.journalColony=o.colony;save();render()});
  $$('[data-colony-view]').forEach(b=>b.onclick=()=>{db.appConfig.v7.colonyView=b.dataset.colonyView;save();render()});
  $$('[data-archive-colony]').forEach(b=>b.onclick=()=>archiveColonyForm(b.dataset.archiveColony));
  $('[data-restore-colony]')&&($('[data-restore-colony]').onclick=()=>{const c=db.colonies.find(x=>String(x.id)===String(selected));if(c){c.lifecycle='active';c.status='En observación';delete c.endedAt;delete c.endReason;save();toast('Colonia restaurada');render()}});
  $('[data-new-relation]')&&($('[data-new-relation]').onclick=genealogyForm);
};

boot=async function(){await v7BaseBoot();ensureV7Data();save();};

$('#fab').onclick=()=>openModal(`<h2>Nuevo registro</h2><div class="quick-grid"><button class="quick" id="mjournal"><i>📖</i><b>Diario</b><span>Observación o hito</span></button><button class="quick" id="mfeed"><i>🍯</i><b>Alimentación</b></button><button class="quick" id="mevent"><i>📅</i><b>Evento</b></button><button class="quick" id="mgrowth"><i>📈</i><b>Recuento</b></button><button class="quick" id="mphoto"><i>📷</i><b>Fotografía</b></button><button class="quick" id="menv"><i>🌡️</i><b>Ambiente</b></button></div>`);
document.addEventListener('click',e=>{if(e.target.closest('#mjournal'))journalForm();if(e.target.closest('#menv'))environmentForm()});
