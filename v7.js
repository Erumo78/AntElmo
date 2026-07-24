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
  db.appConfig.v7.colonyLayout ||= 'detail';
  db.appConfig.v7.colonyMoveMode ??= false;
  db.appConfig.features={...(db.appConfig.features||{}),journal:true,lifeBook:true,legacy:true,globalTimeline:true,genealogy:true,prediction:true};
  if(db.appConfig.moreTab==='tools')db.appConfig.moreTab='hub';
  db.colonies ||= [];
  db.appConfig.v7.colonyOrder ||= db.colonies.map(c=>String(c.id));
  db.colonies.forEach(c=>{if(!db.appConfig.v7.colonyOrder.includes(String(c.id)))db.appConfig.v7.colonyOrder.push(String(c.id))});
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

function orderedColonies(list){
  const order=db.appConfig.v7.colonyOrder||[];
  return list.slice().sort((a,b)=>{
    const ai=order.indexOf(String(a.id)),bi=order.indexOf(String(b.id));
    return (ai<0?9999:ai)-(bi<0?9999:bi);
  });
}

function colonyLayoutCard(c,layout){
  if(layout==='detail')return colonyCard(c);
  if(layout==='compact')return `<article class="card colony-compact-card" data-colony="${esc(c.id)}"><div class="avatar" id="cover-${esc(c.id)}">🐜</div><div><b>${esc(c.name)}</b><span class="latin">${esc(c.species||'Especie sin confirmar')}</span></div><strong>${esc(c.workers??'—')} <small>obreras</small></strong><span class="chip">${esc(c.status||'—')}</span></article>`;
  const last=lastFeeding(c.id);
  return `<article class="card colony-grid-card" data-colony="${esc(c.id)}"><div class="avatar" id="cover-${esc(c.id)}">🐜</div><span class="chip">${esc(c.status||'—')}</span><h3>${esc(c.name)}</h3><p class="latin">${esc(c.species||'Especie sin confirmar')}</p><div><span><b>${esc(c.workers??'—')}</b> obreras</span><span><b>${esc(c.queens??'—')}</b> reina${+c.queens===1?'':'s'}</span></div><small>${last?`🍯 ${esc(last.date)}`:'Sin alimentación'}</small></article>`;
}

function sortableColony(c,layout,index,total){
  const moving=db.appConfig.v7.colonyMoveMode;
  return `<div class="colony-sort-item ${moving?'is-sorting':''}" data-sort-colony="${esc(c.id)}" draggable="${moving?'true':'false'}">${colonyLayoutCard(c,layout)}${moving?`<div class="move-controls"><span>Arrastra o mueve</span><button data-move-colony="${esc(c.id)}" data-direction="-1" ${index===0?'disabled':''} aria-label="Subir ${esc(c.name)}">↑</button><button data-move-colony="${esc(c.id)}" data-direction="1" ${index===total-1?'disabled':''} aria-label="Bajar ${esc(c.name)}">↓</button></div>`:''}</div>`;
}

function moveVisibleColony(id,direction){
  const cfg=db.appConfig.v7;
  const visible=orderedColonies(db.colonies.filter(c=>cfg.colonyView==='historical'?c.lifecycle==='historical':c.lifecycle!=='historical')).map(c=>String(c.id));
  const current=visible.indexOf(String(id)),next=current+Number(direction);
  if(current<0||next<0||next>=visible.length)return;
  const order=cfg.colonyOrder.slice(),a=order.indexOf(visible[current]),b=order.indexOf(visible[next]);
  [order[a],order[b]]=[order[b],order[a]];cfg.colonyOrder=order;save();render();
}

function placeColonyBefore(sourceId,targetId){
  if(!sourceId||!targetId||String(sourceId)===String(targetId))return;
  const order=db.appConfig.v7.colonyOrder.filter(id=>String(id)!==String(sourceId));
  const target=order.indexOf(String(targetId));
  order.splice(target<0?order.length:target,0,String(sourceId));
  db.appConfig.v7.colonyOrder=order;save();render();
}

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

function workbenchV7Card(c){
  const [signal,icon,label]=healthSignal(c);
  const feed=lastFeeding(c.id),feedDays=daysSince(feed?.date),activity=colonyActivity(c);
  const chapters=journalItems(c.id).length;
  return `<article class="workbench-v7-card ${signal}" data-colony="${esc(c.id)}">
    <div class="workbench-v7-cover avatar" id="cover-${esc(c.id)}">🐜</div>
    <div class="workbench-v7-main">
      <div class="workbench-v7-title"><div><span class="dex-mini">ANTDEX · ${chapters} CAPÍTULO${chapters===1?'':'S'}</span><h3>${esc(c.name)}</h3><p class="latin">${esc(c.species||'Especie sin confirmar')}</p></div><span class="health-pill ${signal}">${icon} ${label}</span></div>
      <div class="workbench-v7-stats"><span><b>${esc(c.workers??'—')}</b> obreras</span><span><b>${esc(c.queens??'—')}</b> reina${+c.queens===1?'':'s'}</span><span><b>${feedDays==null?'—':feedDays+' d'}</b> desde alimento</span></div>
      <div class="workbench-v7-foot"><small>${activity?`Actualizada ${esc(activity)}`:'Sin actividad registrada'}</small><span>Ver colonia →</span></div>
    </div>
    <div class="workbench-v7-actions">
      <button data-workbench-action="feed" data-workbench-colony="${esc(c.id)}" aria-label="Alimentar ${esc(c.name)}">🍯<small>Comida</small></button>
      <button data-workbench-action="journal" data-workbench-colony="${esc(c.id)}" aria-label="Anotar en ${esc(c.name)}">📖<small>Diario</small></button>
      <button data-workbench-action="growth" data-workbench-colony="${esc(c.id)}" aria-label="Recuento de ${esc(c.name)}">📈<small>Recuento</small></button>
      <button data-workbench-action="photo" data-workbench-colony="${esc(c.id)}" aria-label="Fotografía de ${esc(c.name)}">📷<small>Foto</small></button>
    </div>
  </article>`;
}

home=function(){
  ensureV7Data();
  const all=db.colonies,active=orderedColonies(all.filter(c=>c.lifecycle!=='historical'));
  db.colonies=active;
  let care;
  try{care=smartCareItems()}finally{db.colonies=all}
  const attention=active.filter(c=>healthSignal(c)[0]!=='good').length;
  const recent=journalItems().filter(x=>daysSince(x.date)!=null&&daysSince(x.date)<=7).length;
  const dateLabel=new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  return `<section class="workbench-v7-hero">
    <div class="workbench-v7-welcome"><span class="eyebrow">CENTRO DE MANDO · ${esc(dateLabel)}</span><h2>Tu mesa de trabajo</h2><p>Un vistazo claro a tus colonias y sus próximos cuidados.</p></div>
    <div class="workbench-v7-primary"><button data-workbench-action="feed">🍯<span><b>Registrar comida</b><small>En pocos segundos</small></span></button><button data-workbench-action="journal">📖<span><b>Nueva entrada</b><small>Diario y Libro de Vida</small></span></button></div>
  </section>
  <div class="workbench-overview">
    <article><span>🐜</span><div><b>${active.length}</b><small>colonias activas</small></div></article>
    <article class="${attention?'needs-attention':''}"><span>${attention?'🔔':'🌿'}</span><div><b>${attention}</b><small>${attention===1?'cuidado pendiente':'cuidados pendientes'}</small></div></article>
    <article><span>📖</span><div><b>${recent}</b><small>registros esta semana</small></div></article>
    <article><span>📈</span><div><b>${active.reduce((n,c)=>n+(+c.workers||0),0)}</b><small>obreras registradas</small></div></article>
  </div>
  <div class="section-title workbench-section-title"><div><h2>Para hoy</h2><p>ANTELMO prioriza lo que necesita atención</p></div><button class="link-btn" data-module="smart">Ver cuidados</button></div>
  <div class="workbench-care">${care.slice(0,4).map(x=>`<button data-smart-action="${x.action}" data-smart-colony="${esc(x.colonyId)}"><span>${x.icon}</span><div><b>${esc(x.title)}</b><small>${esc(x.text)}</small></div><i>Registrar</i></button>`).join('')||'<div class="workbench-all-good"><span>🌿</span><div><b>Todo parece al día</b><small>No hay cuidados pendientes según tus registros.</small></div></div>'}</div>
  <div class="section-title workbench-section-title"><div><h2>Colonias vivas</h2><p>Estado, actividad y acciones rápidas</p></div><button class="link-btn" data-go="colonies">Organizar vistas</button></div>
  <div class="workbench-v7-grid">${active.map(workbenchV7Card).join('')||'<div class="card empty">Añade tu primera colonia para estrenar la mesa de trabajo.</div>'}</div>
  <div class="workbench-tools">
    <button data-module="stats"><span>📊</span><b>Estadísticas</b><small>Evolución y actividad</small></button>
    <button data-module="global"><span>🌍</span><b>Cronología</b><small>Todo tu proyecto</small></button>
    <button data-module="media"><span>🎞️</span><b>Fotografías</b><small>Galería y comparación</small></button>
    <button data-module="ai"><span>🧠</span><b>Análisis</b><small>Patrones de cuidados</small></button>
  </div>${v7Summary()}`;
};

colonies=function(){
  ensureV7Data();
  const cfg=db.appConfig.v7,view=cfg.colonyView||'active',layout=cfg.colonyLayout||'detail';
  const list=orderedColonies(db.colonies.filter(c=>view==='historical'?c.lifecycle==='historical':c.lifecycle!=='historical'));
  return `<div class="section-title"><div><h2>${view==='historical'?'🏛️ Colonias históricas':'Mis colonias'}</h2><p>${list.length} ${view==='historical'?'historias conservadas':'fichas activas'}</p></div>${view==='active'?'<button class="button" data-new-colony>＋ Colonia</button>':''}</div>
  <div class="tabs"><button class="${view==='active'?'active':''}" data-colony-view="active">Activas</button><button class="${view==='historical'?'active':''}" data-colony-view="historical">Legado</button></div>
  <div class="colony-viewbar card"><div class="colony-view-options"><span class="view-label">Vista</span><button class="${layout==='detail'?'active':''}" data-colony-layout="detail" aria-label="Vista detallada">☷ <small>Detallada</small></button><button class="${layout==='grid'?'active':''}" data-colony-layout="grid" aria-label="Vista cuadrícula">▦ <small>Cuadrícula</small></button><button class="${layout==='compact'?'active':''}" data-colony-layout="compact" aria-label="Vista compacta">☰ <small>Compacta</small></button><button class="move-mode-toggle ${cfg.colonyMoveMode?'active':''}" data-toggle-move aria-label="${cfg.colonyMoveMode?'Terminar de ordenar':'Ordenar colonias'}">${cfg.colonyMoveMode?'✓':'⇅'} <small>${cfg.colonyMoveMode?'Terminar':'Ordenar'}</small></button></div></div>
  ${cfg.colonyMoveMode?'<p class="sort-help">Mantén pulsada y arrastra una colonia, o utiliza las flechas para cambiar su posición.</p>':''}
  <div class="colony-layout colony-layout-${layout}">${list.map((c,i)=>sortableColony(c,layout,i,list.length)).join('')||`<div class="card empty">${view==='historical'?'Las colonias que archives aparecerán aquí sin perder ningún dato.':'No hay colonias activas.'}</div>`}</div>`;
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
  const careActions=historical?'':`<section class="colony-care-actions"><button data-feed-for="${esc(c.id)}"><span>🍯</span><b>Alimentar</b><small>${lastFeeding(c.id)?`Última: ${esc(lastFeeding(c.id).date)}`:'Sin registros'}</small></button><button data-growth-for="${esc(c.id)}"><span>📈</span><b>Recuento</b><small>Obreras y cría</small></button><button data-env-for="${esc(c.id)}"><span>🌡️</span><b>Ambiente</b><small>Temperatura y humedad</small></button><button data-detail-photo="${esc(c.id)}"><span>📷</span><b>Fotografía</b><small>Guardar evolución</small></button></section>`;
  const detail=base.replace('</section>',`</section>${careActions}`);
  return detail+`<div class="section-title"><div><h2>📖 Libro de Vida</h2><p>Biografía construida con todos sus registros</p></div><button class="button" data-journal-for="${esc(c.id)}">＋ Entrada</button></div>
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

function colonyEnvironmentForm(id=''){
  openModal(`<h2>🌡️ Nueva medición</h2><p class="modal-intro">La medición quedará asociada a esta colonia y aparecerá también en su Libro de Vida.</p>
  <form id="envForm" class="form">${field('Colonia o instalación',`<select name="colonyId"><option value="">General / terrario</option>${colonyOptions(id)}</select>`)}
  <div class="row">${field('Fecha',`<input name="date" type="date" value="${today()}" required>`)}${field('Hora',`<input name="time" type="time">`)}</div>
  <div class="row">${field('Temperatura °C',`<input name="temperature" type="number" step="0.1">`)}${field('Humedad %',`<input name="humidity" type="number" min="0" max="100">`)}</div>
  ${field('Notas',`<textarea name="notes" placeholder="Condensación, depósito, ventilación…"></textarea>`)}
  <button class="button">Guardar medición</button></form>`);
  $('#envForm').onsubmit=e=>{
    e.preventDefault();
    db.environmentLogs.push({id:uid('env'),...Object.fromEntries(new FormData(e.target))});
    save();closeModal();toast('Medición guardada');render();
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
  $$('[data-colony-layout]').forEach(b=>b.onclick=()=>{db.appConfig.v7.colonyLayout=b.dataset.colonyLayout;save();render()});
  $('[data-toggle-move]')&&($('[data-toggle-move]').onclick=()=>{db.appConfig.v7.colonyMoveMode=!db.appConfig.v7.colonyMoveMode;save();render()});
  $$('[data-move-colony]').forEach(b=>b.onclick=e=>{e.stopPropagation();moveVisibleColony(b.dataset.moveColony,b.dataset.direction)});
  let draggedColony='';
  $$('[data-sort-colony]').forEach(el=>{
    el.ondragstart=e=>{draggedColony=el.dataset.sortColony;e.dataTransfer.effectAllowed='move';el.classList.add('dragging')};
    el.ondragend=()=>el.classList.remove('dragging');
    el.ondragover=e=>{if(db.appConfig.v7.colonyMoveMode)e.preventDefault()};
    el.ondrop=e=>{e.preventDefault();placeColonyBefore(draggedColony,el.dataset.sortColony)};
  });
  $$('[data-feed-for]').forEach(b=>b.onclick=()=>feedingForm(b.dataset.feedFor));
  $$('[data-growth-for]').forEach(b=>b.onclick=()=>growthForm(b.dataset.growthFor));
  $$('[data-env-for]').forEach(b=>b.onclick=()=>colonyEnvironmentForm(b.dataset.envFor));
  $$('[data-detail-photo]').forEach(b=>b.onclick=()=>photoForm(b.dataset.detailPhoto));
  $$('[data-workbench-action]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const id=b.dataset.workbenchColony||'',action=b.dataset.workbenchAction;
    if(action==='feed')feedingForm(id);
    if(action==='journal')journalForm(id);
    if(action==='growth')growthForm(id);
    if(action==='photo')photoForm(id);
  });
  $$('[data-archive-colony]').forEach(b=>b.onclick=()=>archiveColonyForm(b.dataset.archiveColony));
  $('[data-restore-colony]')&&($('[data-restore-colony]').onclick=()=>{const c=db.colonies.find(x=>String(x.id)===String(selected));if(c){c.lifecycle='active';c.status='En observación';delete c.endedAt;delete c.endReason;save();toast('Colonia restaurada');render()}});
  $('[data-new-relation]')&&($('[data-new-relation]').onclick=genealogyForm);
};

boot=async function(){await v7BaseBoot();ensureV7Data();save();};

$('#fab').onclick=()=>openModal(`<h2>Nuevo registro</h2><div class="quick-grid"><button class="quick" id="mjournal"><i>📖</i><b>Diario</b><span>Observación o hito</span></button><button class="quick" id="mfeed"><i>🍯</i><b>Alimentación</b></button><button class="quick" id="mevent"><i>📅</i><b>Evento</b></button><button class="quick" id="mgrowth"><i>📈</i><b>Recuento</b></button><button class="quick" id="mphoto"><i>📷</i><b>Fotografía</b></button><button class="quick" id="menv"><i>🌡️</i><b>Ambiente</b></button></div>`);
document.addEventListener('click',e=>{if(e.target.closest('#mjournal'))journalForm();if(e.target.closest('#menv'))environmentForm()});
