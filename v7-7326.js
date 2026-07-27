/* ANTELMO V7.3.26 — Escudo de datos, ronda de revisión y etiquetas fotográficas. */

const ANTELMO_V7326_PHOTO_TAGS=[
  'Reina','Huevos','Larvas','Pupas','Obreras','Alimentación','Mudanza','Hormiguero'
];

function antelmoV7326EnsureData(){
  db.reviewRounds ||= [];
  db.appConfig ||= {};
  db.appConfig.v7326 ||= {
    activeRound:null,
    photoFilters:{},
    ownerPhotoFilters:{}
  };
  db.appConfig.v7326.photoFilters ||= {};
  db.appConfig.v7326.ownerPhotoFilters ||= {};
  return db.appConfig.v7326;
}

function antelmoV7326Tags(value){
  const list=Array.isArray(value)?value:String(value||'').split(',');
  return [...new Set(list.map(tag=>String(tag).trim()).filter(Boolean))];
}

function antelmoV7326TagOptions(selected=[]){
  const active=new Set(antelmoV7326Tags(selected));
  return `<fieldset class="v7326-tag-picker"><legend>Etiquetas</legend><div>${ANTELMO_V7326_PHOTO_TAGS.map(tag=>
    `<label><input type="checkbox" name="photoTag" value="${esc(tag)}" ${active.has(tag)?'checked':''}><span>${esc(tag)}</span></label>`
  ).join('')}</div></fieldset>`;
}

function antelmoV7326FormTags(form){
  return [...form.querySelectorAll('input[name="photoTag"]:checked')].map(input=>input.value);
}

function antelmoV7326TagChips(tags){
  const list=antelmoV7326Tags(tags);
  return list.length?`<div class="v7326-photo-tags">${list.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>`:'';
}

function antelmoV7326FilterBar(tags,current,attributes){
  const list=[...new Set(antelmoV7326Tags(tags))];
  if(!list.length)return '';
  return `<div class="v7326-photo-filters"><button type="button" class="${current?'':'active'}" ${attributes} data-tag="">Todas</button>${list.map(tag=>
    `<button type="button" class="${current===tag?'active':''}" ${attributes} data-tag="${esc(tag)}">${esc(tag)}</button>`
  ).join('')}</div>`;
}

function antelmoV7326Bytes(value){
  if(!Number.isFinite(value)||value<0)return '—';
  if(value<1024*1024)return `${Math.max(0.1,value/1024).toFixed(1)} KB`;
  if(value<1024*1024*1024)return `${(value/(1024*1024)).toFixed(1)} MB`;
  return `${(value/(1024*1024*1024)).toFixed(1)} GB`;
}

function antelmoV7326BackupAge(){
  const raw=db.appConfig?.backup?.lastExportAt;
  if(!raw)return null;
  const time=new Date(raw).getTime();
  if(!Number.isFinite(time))return null;
  return Math.max(0,Math.floor((Date.now()-time)/86400000));
}

function antelmoV7326SecurityCard(){
  return `<section class="card v7326-security-card" data-v7326-security>
    <div class="v7326-security-head">
      <div class="v7326-shield" data-v7326-shield>🛡️</div>
      <div><span class="eyebrow">ESCUDO DE DATOS</span><h2 data-v7326-security-title>Comprobando protección…</h2><p data-v7326-security-copy>Revisando copia, fotografías y almacenamiento local.</p></div>
      <span class="v7326-security-dot checking" data-v7326-security-dot></span>
    </div>
    <div class="v7326-security-stats">
      <div><b data-v7326-backup-value>—</b><small>última copia externa</small></div>
      <div><b data-v7326-photo-value>—</b><small>fotos y vídeos</small></div>
      <div><b data-v7326-storage-value>—</b><small>almacenamiento usado</small></div>
    </div>
    <div class="actions">
      <button type="button" class="button" data-v7326-backup>⬇︎ Crear copia ahora</button>
      <button type="button" class="button secondary" data-v7326-persist>🛡 Proteger almacenamiento</button>
    </div>
    <small class="sub">La protección reduce el riesgo de borrado automático, pero eliminar ANTELMO del iPhone también elimina sus datos locales. Conserva siempre una copia externa.</small>
  </section>`;
}

async function antelmoV7326HydrateSecurity(){
  const card=document.querySelector('[data-v7326-security]');
  if(!card)return;
  const photos=await photoAll();
  let persistent=null,estimate=null;
  try{
    if(navigator.storage?.persisted)persistent=await navigator.storage.persisted();
    if(navigator.storage?.estimate)estimate=await navigator.storage.estimate();
  }catch{}
  if(!document.body.contains(card))return;

  const age=antelmoV7326BackupAge();
  const level=age==null?'danger':(age>7||persistent!==true?'warning':'safe');
  const title=level==='safe'?'Datos protegidos':level==='warning'?'Protección mejorable':'Copia externa pendiente';
  const parts=[];
  if(age==null)parts.push('Todavía no hay una copia externa confirmada.');
  else if(age===0)parts.push('La copia externa es de hoy.');
  else parts.push(`La última copia externa tiene ${age} ${age===1?'día':'días'}.`);
  if(persistent===true)parts.push('El almacenamiento persistente está activo.');
  else if(persistent===false)parts.push('El almacenamiento aún no es persistente.');
  else parts.push('Este navegador no confirma la persistencia.');

  card.classList.remove('safe','warning','danger');
  card.classList.add(level);
  card.querySelector('[data-v7326-security-title]').textContent=title;
  card.querySelector('[data-v7326-security-copy]').textContent=parts.join(' ');
  card.querySelector('[data-v7326-security-dot]').className=`v7326-security-dot ${level}`;
  card.querySelector('[data-v7326-backup-value]').textContent=age==null?'Nunca':age===0?'Hoy':`Hace ${age} d`;
  card.querySelector('[data-v7326-photo-value]').textContent=String(photos.length);
  card.querySelector('[data-v7326-storage-value]').textContent=estimate?antelmoV7326Bytes(estimate.usage):'No disponible';
  const persistButton=card.querySelector('[data-v7326-persist]');
  if(persistent===true){
    persistButton.textContent='✓ Almacenamiento protegido';
    persistButton.disabled=true;
  }else if(!navigator.storage?.persist){
    persistButton.textContent='Protección no disponible';
    persistButton.disabled=true;
  }
}

async function antelmoV7326RequestPersistence(){
  if(!navigator.storage?.persist){
    toast('La protección persistente no está disponible');
    return;
  }
  try{
    const granted=await navigator.storage.persist();
    toast(granted?'Almacenamiento protegido':'El dispositivo no concedió la protección');
  }catch{
    toast('No se pudo comprobar la protección');
  }
  antelmoV7326HydrateSecurity();
}

/* Una copia cancelada ya no se registra como copia externa realizada. */
async function antelmoV7326Export(){
  try{
    toast('Preparando copia…');
    const backup=await antelmoV7323BuildBackup();
    const json=JSON.stringify(backup);
    const blob=new Blob([json],{type:'application/json'});
    const name=`ANTELMO-COMPLETO-${today()}.json`;
    const file=new File([blob],name,{type:'application/json'});
    if(navigator.canShare?.({files:[file]})){
      await navigator.share({files:[file],title:'Copia completa de ANTELMO'});
    }else{
      const link=document.createElement('a');
      const url=URL.createObjectURL(blob);
      link.href=url;
      link.download=name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
    }
    db.appConfig ||= {};
    db.appConfig.backup ||= {};
    db.appConfig.backup.lastExportAt=backup.exportedAt;
    db.appConfig.backup.lastExportPhotos=backup.media.length;
    save();
    toast(`Copia creada · ${backup.media.length} fotos`);
    render();
  }catch(error){
    if(error?.name==='AbortError'){
      toast('Copia cancelada');
      return;
    }
    console.error(error);
    alert('No se pudo crear la copia completa.');
  }
}

antelmoV7323Export=antelmoV7326Export;
exportBackup=antelmoV7326Export;

function antelmoV7326ActiveColonies(){
  const list=db.colonies.filter(colony=>colony.lifecycle!=='historical');
  return typeof orderedColonies==='function'?orderedColonies(list):list;
}

function antelmoV7326StartRound(){
  const cfg=antelmoV7326EnsureData();
  if(!cfg.activeRound){
    const colonies=antelmoV7326ActiveColonies();
    if(!colonies.length){
      toast('No hay colonias activas para revisar');
      return;
    }
    cfg.activeRound={
      id:uid('round'),
      date:today(),
      startedAt:new Date().toISOString(),
      colonyIds:colonies.map(colony=>String(colony.id)),
      index:0,
      items:[]
    };
    save();
  }
  antelmoV7326OpenRound();
}

function antelmoV7326LastRoundFor(colonyId){
  return db.reviewRounds.slice().reverse().find(round=>
    (round.items||[]).some(item=>String(item.colonyId)===String(colonyId))
  );
}

function antelmoV7326OpenRound(){
  const round=antelmoV7326EnsureData().activeRound;
  if(!round){
    antelmoV7326StartRound();
    return;
  }
  while(round.index<round.colonyIds.length&&!db.colonies.some(colony=>String(colony.id)===String(round.colonyIds[round.index]))){
    round.index++;
  }
  if(round.index>=round.colonyIds.length){
    antelmoV7326FinishRound();
    return;
  }
  const colony=db.colonies.find(item=>String(item.id)===String(round.colonyIds[round.index]));
  const feeding=lastFeeding(colony.id);
  const environment=(db.environmentLogs||[]).filter(item=>String(item.colonyId)===String(colony.id))
    .sort((a,b)=>`${b.date||''}${b.time||''}`.localeCompare(`${a.date||''}${a.time||''}`))[0];
  const previous=antelmoV7326LastRoundFor(colony.id);
  const completed=round.items.length;
  const progress=Math.round(completed*100/round.colonyIds.length);
  openModal(`<div class="v7326-round">
    <div class="v7326-round-head"><span class="eyebrow">RONDA DE REVISIÓN</span><b>${completed+1} de ${round.colonyIds.length}</b></div>
    <div class="v7326-round-progress"><i style="width:${progress}%"></i></div>
    <section class="v7326-round-colony">
      <span>${esc(colony.icon||'🐜')}</span>
      <div><h2>${esc(colony.name)}</h2><p class="latin">${esc(colony.species||'Especie sin confirmar')}</p></div>
    </section>
    <div class="v7326-round-facts">
      <div><small>Alimentación</small><b>${feeding?toDisplayDate(feeding.date):'Sin registro'}</b></div>
      <div><small>Ambiente</small><b>${environment?`${esc(environment.temperature||'—')} °C · ${esc(environment.humidity||'—')} %`:'Sin medición'}</b></div>
      <div><small>Obreras</small><b>${esc(colony.workers??'—')}</b></div>
      <div><small>Última ronda</small><b>${previous?toDisplayDate(previous.date):'Primera revisión'}</b></div>
    </div>
    <p class="v7326-round-question">¿Cómo está esta colonia?</p>
    <div class="v7326-round-actions">
      <button type="button" class="button" data-v7326-round-ok>✓ Correcto</button>
      <button type="button" class="button secondary" data-v7326-round-record>＋ Registrar</button>
      <button type="button" class="link-btn" data-v7326-round-skip>Saltar</button>
    </div>
    <button type="button" class="link-btn v7326-round-pause" data-v7326-round-pause>Cerrar y continuar después</button>
  </div>`);
}

function antelmoV7326RoundItem(status,action=''){
  const cfg=antelmoV7326EnsureData();
  const round=cfg.activeRound;
  if(!round)return;
  const colonyId=round.colonyIds[round.index];
  round.items.push({
    colonyId:String(colonyId),
    status,
    action,
    reviewedAt:new Date().toISOString()
  });
  round.index++;
  save();
  antelmoV7326OpenRound();
}

function antelmoV7326RecordPicker(){
  const round=antelmoV7326EnsureData().activeRound;
  if(!round)return;
  const colony=db.colonies.find(item=>String(item.id)===String(round.colonyIds[round.index]));
  if(!colony)return antelmoV7326OpenRound();
  openModal(`<div class="v7326-round-record">
    <span class="eyebrow">REGISTRAR EN LA RONDA</span><h2>${esc(colony.name)}</h2>
    <div class="v7326-record-grid">
      <button type="button" data-v7326-record-type="feeding"><span>🍯</span><b>Alimentación</b></button>
      <button type="button" data-v7326-record-type="water"><span>💧</span><b>Hidratación</b></button>
      <button type="button" data-v7326-record-type="environment"><span>🌡️</span><b>Ambiente</b></button>
      <button type="button" data-v7326-record-type="growth"><span>📈</span><b>Recuento</b></button>
      <button type="button" data-v7326-record-type="incident"><span>⚠️</span><b>Incidencia</b></button>
    </div>
    <button type="button" class="link-btn" data-v7326-round-back>‹ Volver a la colonia</button>
  </div>`);
}

function antelmoV7326RecordForm(type){
  const round=antelmoV7326EnsureData().activeRound;
  if(!round)return;
  const colony=db.colonies.find(item=>String(item.id)===String(round.colonyIds[round.index]));
  if(!colony)return antelmoV7326OpenRound();
  const forms={
    feeding:`${field('Tipo',`<select name="category"><option>Semillas</option><option>Proteína</option><option>Néctar</option><option>Fruta</option><option>Otro</option></select>`)}${field('Alimento',`<input name="food" required placeholder="Semillas, insecto, néctar…">`)}${field('Respuesta',`<textarea name="notes" placeholder="Aceptación, restos, comportamiento…"></textarea>`)}`,
    water:`${field('Detalle',`<input name="title" value="Hidratación revisada" required>`)}${field('Notas',`<textarea name="notes" placeholder="Bebedero, depósito, algodón…"></textarea>`)}`,
    environment:`<div class="row">${field('Temperatura °C',`<input name="temperature" type="number" step="0.1">`)}${field('Humedad %',`<input name="humidity" type="number" min="0" max="100">`)}</div>${field('Notas',`<textarea name="notes" placeholder="Condensación, ventilación…"></textarea>`)}`,
    growth:`<div class="row">${field('Obreras',`<input name="workers" type="number" min="0" value="${esc(colony.workers??'')}">`)}${field('Reinas',`<input name="queens" type="number" min="0" value="${esc(colony.queens??1)}">`)}</div><div class="row">${field('Huevos',`<input name="eggs" type="number" min="0">`)}${field('Larvas',`<input name="larvae" type="number" min="0">`)}</div>${field('Notas',`<textarea name="notes"></textarea>`)}`,
    incident:`${field('Incidencia',`<input name="title" required placeholder="Moho, fuga, inactividad…">`)}${field('Notas',`<textarea name="notes" placeholder="Describe lo observado y las medidas tomadas"></textarea>`)}`
  };
  const labels={feeding:'Alimentación',water:'Hidratación',environment:'Ambiente',growth:'Recuento',incident:'Incidencia'};
  if(!forms[type])return;
  openModal(`<span class="eyebrow">RONDA · ${esc(colony.name)}</span><h2>${esc(labels[type])}</h2><form id="v7326RoundRecordForm" class="form">${forms[type]}<button class="button">Guardar y continuar</button><button type="button" class="link-btn" data-v7326-record-back>Cancelar</button></form>`);
  const form=document.querySelector('#v7326RoundRecordForm');
  form.onsubmit=event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(form));
    const common={colonyId:String(colony.id),date:today()};
    if(type==='feeding'){
      db.feedings.push({id:uid('feed'),...common,category:values.category,food:values.food,notes:values.notes});
    }
    if(type==='water'){
      db.events.push({id:uid('event'),...common,type:'Hidratación',title:values.title,notes:values.notes});
    }
    if(type==='environment'){
      db.environmentLogs ||= [];
      db.environmentLogs.push({id:uid('env'),...common,time:'',temperature:values.temperature,humidity:values.humidity,notes:values.notes});
    }
    if(type==='growth'){
      const record={id:uid('growth'),...common,notes:values.notes};
      ['workers','queens','eggs','larvae'].forEach(key=>record[key]=values[key]===''?null:+values[key]);
      db.growthRecords.push(record);
      if(record.workers!=null)colony.workers=record.workers;
      if(record.queens!=null)colony.queens=record.queens;
      colony.updatedAt=today();
    }
    if(type==='incident'){
      db.events.push({id:uid('event'),...common,type:'Incidencia',title:values.title,notes:values.notes});
    }
    antelmoV7326RoundItem('recorded',type);
    toast('Registro guardado');
  };
}

function antelmoV7326FinishRound(){
  const cfg=antelmoV7326EnsureData();
  const round=cfg.activeRound;
  if(!round)return;
  round.completedAt=new Date().toISOString();
  db.reviewRounds.push(JSON.parse(JSON.stringify(round)));
  cfg.activeRound=null;
  save();
  const ok=round.items.filter(item=>item.status==='ok').length;
  const recorded=round.items.filter(item=>item.status==='recorded').length;
  const skipped=round.items.filter(item=>item.status==='skipped').length;
  openModal(`<div class="v7326-round-complete"><span>✓</span><h2>Ronda completada</h2><p>${round.items.length} colonias revisadas</p><div><b>${ok}<small>correctas</small></b><b>${recorded}<small>con registro</small></b><b>${skipped}<small>saltadas</small></b></div><button type="button" class="button" data-v7326-round-finish>Cerrar</button></div>`);
  render();
}

/* Formulario principal de fotografías con etiquetas. */
photoForm=function(id=''){
  openModal(`<h2>📸 Añadir multimedia</h2><p class="modal-intro">Las etiquetas permiten encontrar rápidamente reina, cría, alimentación o mudanzas.</p>
    <form id="v7326PhotoForm" class="form">${field('Colonia',`<select name="colonyId">${colonyOptions(id)}</select>`)}
    ${field('Fecha',`<input name="date" type="date" value="${today()}">`)}
    ${field('Fotos o vídeo',`<input name="photo" type="file" accept="image/*,video/*" multiple required>`)}
    ${field('Descripción común',`<input name="caption" placeholder="Llegada, cría, mudanza, timelapse…">`)}
    ${antelmoV7326TagOptions()}
    <label class="check-row"><input name="cover" type="checkbox"> Usar la primera fotografía como portada</label>
    <button class="button">Guardar</button></form>`);
  const form=document.querySelector('#v7326PhotoForm');
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);
  form.onsubmit=async event=>{
    event.preventDefault();
    const values=new FormData(form),files=[...form.elements.photo.files];
    if(!files.length)return;
    const colonyId=values.get('colonyId');
    const date=toIsoDate(values.get('date'))||today();
    const cover=values.get('cover')==='on';
    const tags=antelmoV7326FormTags(form);
    if(cover)await clearCovers(colonyId);
    let index=0;
    for(const file of files){
      const blob=file.type.startsWith('image/')?await optimizeImage(file):file;
      const photo={
        id:uid('media'),colonyId,date,
        caption:values.get('caption')||(files.length>1?`Archivo ${index+1}`:''),
        cover:cover&&index===0&&file.type.startsWith('image/'),
        blob,createdAt:new Date().toISOString(),tags:[...tags]
      };
      await photoPut(photo);
      indexMedia(photo,{tags:[...tags]});
      index++;
    }
    db.metadata.photoCount=(db.metadata.photoCount||0)+files.length;
    save();
    closeModal();
    toast(`${files.length} archivo${files.length===1?'':'s'} guardado${files.length===1?'':'s'}`);
    render();
  };
};

editPhoto=async function(id,colonyId){
  const photo=await antelmoV7325Photo(id);
  if(!photo){
    toast('No se pudo editar la fotografía');
    return;
  }
  const meta=(db.mediaIndex||[]).find(item=>String(item.id)===String(id));
  const selected=antelmoV7326Tags(photo.tags||meta?.tags);
  openModal(`<h2>Editar fotografía</h2><form id="v7326EditPhoto" class="form">
    ${field('Fecha',`<input name="date" type="date" value="${esc(String(photo.date||today()).slice(0,10))}">`)}
    ${field('Descripción',`<input name="caption" value="${esc(photo.caption||'')}" placeholder="Qué muestra esta foto">`)}
    ${antelmoV7326TagOptions(selected)}
    <button class="button">Guardar cambios</button></form>`);
  const form=document.querySelector('#v7326EditPhoto');
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);
  form.onsubmit=async event=>{
    event.preventDefault();
    const values=new FormData(form);
    photo.date=toIsoDate(values.get('date'))||photo.date||today();
    photo.caption=String(values.get('caption')||'').trim();
    photo.tags=antelmoV7326FormTags(form);
    await photoPut(photo);
    indexMedia(photo,{tags:[...photo.tags]});
    save();
    closeModal();
    toast('Fotografía actualizada');
    loadGallery(colonyId);
  };
};

viewPhoto=function(photo,url,colonyId){
  const tags=antelmoV7326Tags(photo.tags||(db.mediaIndex||[]).find(item=>String(item.id)===String(photo.id))?.tags);
  openModal(`<div class="photo-viewer"><img src="${url}" alt="${esc(photo.caption||'Fotografía')}"><div class="photo-viewer-info"><h2>${esc(photo.caption||'Sin descripción')}</h2><p>${esc(toDisplayDate(photo.date||'Sin fecha'))} ${photo.cover?'· ⭐ Portada':''}</p>${antelmoV7326TagChips(tags)}<div class="actions"><button class="button secondary" data-view-cover="${esc(photo.id)}">⭐ Portada</button><button class="button secondary" data-view-edit="${esc(photo.id)}">Editar</button></div></div></div>`);
  const cover=document.querySelector('[data-view-cover]');
  const edit=document.querySelector('[data-view-edit]');
  if(cover)cover.onclick=async()=>{await setPhotoCover(photo.id,colonyId);closeModal();};
  if(edit)edit.onclick=()=>editPhoto(photo.id,colonyId);
};

loadGallery=async function(id){
  const element=document.querySelector('#gallery');
  if(!element)return;
  const cfg=antelmoV7326EnsureData();
  const all=await photosByColony(id);
  const tags=[...new Set(all.flatMap(photo=>antelmoV7326Tags(photo.tags||(db.mediaIndex||[]).find(item=>String(item.id)===String(photo.id))?.tags)))];
  const current=cfg.photoFilters[String(id)]||'';
  const photos=current?all.filter(photo=>antelmoV7326Tags(photo.tags||(db.mediaIndex||[]).find(item=>String(item.id)===String(photo.id))?.tags).includes(current)):all;
  const filter=antelmoV7326FilterBar(tags,current,`data-v7326-colony-filter="${esc(id)}"`);
  element.innerHTML=filter+(photos.map(photo=>{
    const url=URL.createObjectURL(photo.blob);
    const video=photo.blob?.type?.startsWith('video/');
    const photoTags=antelmoV7326Tags(photo.tags||(db.mediaIndex||[]).find(item=>String(item.id)===String(photo.id))?.tags);
    return `<article class="photo-card ${photo.cover?'is-cover':''}">${video?`<video controls preload="metadata" src="${url}"></video>`:`<button class="photo-open" data-view-photo="${esc(photo.id)}"><img src="${url}" alt="${esc(photo.caption||'Fotografía')}"></button>`}<div class="photo-meta"><div><b>${esc(photo.caption||'Sin descripción')}</b><span>${esc(toDisplayDate(photo.date||'Sin fecha'))}</span></div>${photo.cover?'<span class="cover-badge">⭐ Portada</span>':''}</div>${antelmoV7326TagChips(photoTags)}<div class="photo-actions">${video?'':`<button data-cover-photo="${esc(photo.id)}" aria-label="Usar como portada">⭐</button>`}<button data-edit-photo="${esc(photo.id)}" aria-label="Editar">✎</button><button class="danger-icon" data-del-photo="${esc(photo.id)}" aria-label="Eliminar">🗑</button></div></article>`;
  }).join('')||`<div class="empty gallery-empty"><b>${current?'No hay archivos con esta etiqueta':'Tu álbum está vacío'}</b><span>${current?'Elige otra etiqueta o muestra todas.':'Añade fotografías o vídeos.'}</span></div>`);
  element.querySelectorAll('[data-v7326-colony-filter]').forEach(button=>button.onclick=()=>{
    cfg.photoFilters[String(id)]=button.dataset.tag||'';
    save();
    loadGallery(id);
  });
  element.querySelectorAll('[data-view-photo]').forEach(button=>button.onclick=()=>{
    const photo=all.find(item=>String(item.id)===String(button.dataset.viewPhoto));
    if(photo)viewPhoto(photo,button.querySelector('img').src,id);
  });
  element.querySelectorAll('[data-cover-photo]').forEach(button=>button.onclick=()=>setPhotoCover(button.dataset.coverPhoto,id));
  element.querySelectorAll('[data-edit-photo]').forEach(button=>button.onclick=()=>editPhoto(button.dataset.editPhoto,id));
  element.querySelectorAll('[data-del-photo]').forEach(button=>button.onclick=async()=>{
    if(!confirm('¿Eliminar este archivo?'))return;
    const photo=all.find(item=>String(item.id)===String(button.dataset.delPhoto));
    if(photo)await photoDelete(photo.id);
    db.mediaIndex=(db.mediaIndex||[]).filter(item=>String(item.id)!==String(button.dataset.delPhoto));
    save();
    toast('Fotografía eliminada');
    loadGallery(id);
    loadCovers();
  });
};

/* Etiquetas también en Terrarios y Habitantes. */
antelmoV7315AddPhotos=async function(ownerType,ownerId,label){
  openModal(`<h2>📷 Fotos de ${esc(label)}</h2><form id="v7326OwnerPhotoForm" class="form">
    ${field('Fecha',`<input name="date" type="date" value="${today()}">`)}
    ${field('Fotos',`<input name="photos" type="file" accept="image/*" multiple required>`)}
    ${field('Descripción',`<input name="caption" placeholder="Evolución, alimentación, cambio de refugio…">`)}
    ${antelmoV7326TagOptions()}
    <label class="check-row"><input name="cover" type="checkbox"> Usar la primera como portada</label>
    <button class="button">Guardar fotografías</button></form>`);
  const form=document.querySelector('#v7326OwnerPhotoForm');
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);
  form.onsubmit=async event=>{
    event.preventDefault();
    const values=new FormData(form),files=[...form.elements.photos.files];
    if(!files.length)return;
    const tags=antelmoV7326FormTags(form);
    if(values.get('cover')==='on'){
      db.mediaIndex.filter(item=>item.ownerType===ownerType&&String(item.ownerId)===String(ownerId)).forEach(item=>item.ownerCover=false);
    }
    let index=0;
    for(const file of files){
      const blob=await optimizeImage(file);
      const photo={
        id:uid('terr-media'),colonyId:'',date:toIsoDate(values.get('date'))||today(),
        caption:values.get('caption')||(files.length>1?`Foto ${index+1}`:'Fotografía'),
        cover:false,blob,createdAt:new Date().toISOString(),tags:[...tags]
      };
      await photoPut(photo);
      db.mediaIndex.push({
        id:String(photo.id),colonyId:'',date:photo.date,caption:photo.caption,
        type:blob.type||'image/jpeg',createdAt:photo.createdAt,ownerType,
        ownerId:String(ownerId),ownerCover:values.get('cover')==='on'&&index===0,
        tags:[...tags]
      });
      index++;
    }
    save();
    closeModal();
    toast(`${files.length} ${files.length===1?'foto guardada':'fotos guardadas'}`);
    render();
  };
};

antelmoV7322Edit=async function(id){
  const meta=antelmoV7322Meta(id);
  const photo=await antelmoV7325Photo(id);
  if(!meta||!photo){
    toast('No se pudo editar la fotografía');
    return;
  }
  const selected=antelmoV7326Tags(photo.tags||meta.tags);
  openModal(`<h2>Editar fotografía</h2><form id="v7326OwnerEditPhoto" class="form">
    ${field('Fecha',`<input name="date" type="date" value="${esc(String(meta.date||photo.date||today()).slice(0,10))}">`)}
    ${field('Descripción',`<input name="caption" value="${esc(meta.caption||photo.caption||'')}" placeholder="Qué muestra esta foto">`)}
    ${antelmoV7326TagOptions(selected)}
    <button class="button">Guardar cambios</button></form>`);
  const form=document.querySelector('#v7326OwnerEditPhoto');
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);
  form.onsubmit=async event=>{
    event.preventDefault();
    const values=new FormData(form);
    const date=toIsoDate(values.get('date'))||today();
    const caption=String(values.get('caption')||'').trim();
    const tags=antelmoV7326FormTags(form);
    photo.date=date;
    photo.caption=caption;
    photo.tags=[...tags];
    await photoPut(photo);
    meta.date=date;
    meta.caption=caption;
    meta.tags=[...tags];
    save();
    closeModal();
    toast('Fotografía actualizada');
    render();
  };
};

antelmoV7322View=async function(id){
  const meta=antelmoV7322Meta(id);
  const photo=await antelmoV7325Photo(id);
  if(!meta||!photo?.blob){
    toast('No se pudo abrir la fotografía');
    return;
  }
  const url=URL.createObjectURL(photo.blob);
  openModal(`<div class="photo-viewer v7324-photo-viewer"><img src="${url}" alt="${esc(meta.caption||photo.caption||'Fotografía')}"><div class="photo-viewer-info"><h2>${esc(meta.caption||photo.caption||'Sin descripción')}</h2><p>${esc(toDisplayDate(meta.date||photo.date||'Sin fecha'))} ${meta.ownerCover?'· ⭐ Portada':''}</p>${antelmoV7326TagChips(photo.tags||meta.tags)}<div class="actions"><button type="button" class="button secondary" data-v7322-cover="${esc(id)}">⭐ Portada</button><button type="button" class="button secondary" data-v7322-edit="${esc(id)}">Editar</button><button type="button" class="button danger" data-v7322-delete="${esc(id)}">🗑 Borrar</button></div></div></div>`);
};

antelmoV7315Gallery=function(ownerType,ownerId){
  const cfg=antelmoV7326EnsureData();
  const key=`${ownerType}:${String(ownerId)}`;
  const all=antelmoV7315Media(ownerType,ownerId);
  const tags=[...new Set(all.flatMap(item=>antelmoV7326Tags(item.tags)))];
  const current=cfg.ownerPhotoFilters[key]||'';
  const media=current?all.filter(item=>antelmoV7326Tags(item.tags).includes(current)):all;
  const filter=antelmoV7326FilterBar(tags,current,`data-v7326-owner-filter="${esc(key)}"`);
  return filter+`<div class="gallery gallery-rich v7322-owner-gallery">${media.map(item=>
    `<article class="photo-card ${item.ownerCover?'is-cover':''}"><button class="photo-open" type="button" data-v7322-view="${esc(item.id)}" aria-label="Ver fotografía"><img data-v7322-photo="${esc(item.id)}" alt="${esc(item.caption||'Fotografía')}"></button><div class="photo-meta"><div><b>${esc(item.caption||'Sin descripción')}</b><span>${esc(toDisplayDate(item.date||'Sin fecha'))}</span></div>${item.ownerCover?'<span class="cover-badge">⭐ Portada</span>':''}</div>${antelmoV7326TagChips(item.tags)}<div class="photo-actions"><button type="button" data-v7322-cover="${esc(item.id)}" aria-label="Usar como portada">⭐</button><button type="button" data-v7322-edit="${esc(item.id)}" aria-label="Editar">✎</button><button type="button" class="danger-icon" data-v7322-delete="${esc(item.id)}" aria-label="Eliminar">🗑</button></div></article>`
  ).join('')||`<div class="empty gallery-empty"><b>${current?'No hay fotos con esta etiqueta':'Tu álbum está vacío'}</b><span>${current?'Elige otra etiqueta o muestra todas.':'Añade fotos desde Fototeca o haz una nueva.'}</span></div>`}</div>`;
};

function antelmoV7326InstallHome(){
  if(route!=='home')return;
  antelmoV7326EnsureData();
  const app=document.querySelector('#app');
  if(!app)return;
  const direct=app.querySelector('.antelmo-v7311-direct');
  const hero=app.querySelector('.workbench-v7-hero');
  const anchor=direct||hero;
  if(anchor&&!app.querySelector('[data-v7326-security]')){
    anchor.insertAdjacentHTML('afterend',antelmoV7326SecurityCard());
  }
  if(direct&&!direct.querySelector('[data-v7326-round]')){
    const active=Boolean(db.appConfig.v7326.activeRound);
    direct.insertAdjacentHTML('beforeend',`<button type="button" class="v7326-round-button" data-v7326-round><span>✓</span><b>${active?'Continuar ronda':'Ronda de revisión'}</b></button>`);
  }
  requestAnimationFrame(antelmoV7326HydrateSecurity);
}

document.addEventListener('click',async event=>{
  const backup=event.target.closest('[data-v7326-backup]');
  if(backup){
    event.preventDefault();
    await antelmoV7326Export();
    return;
  }
  const persist=event.target.closest('[data-v7326-persist]');
  if(persist){
    event.preventDefault();
    await antelmoV7326RequestPersistence();
    return;
  }
  if(event.target.closest('[data-v7326-round]')){
    event.preventDefault();
    antelmoV7326StartRound();
    return;
  }
  if(event.target.closest('[data-v7326-round-ok]')){
    antelmoV7326RoundItem('ok');
    return;
  }
  if(event.target.closest('[data-v7326-round-record]')){
    antelmoV7326RecordPicker();
    return;
  }
  if(event.target.closest('[data-v7326-round-skip]')){
    antelmoV7326RoundItem('skipped');
    return;
  }
  if(event.target.closest('[data-v7326-round-pause]')||event.target.closest('[data-v7326-round-finish]')){
    closeModal();
    render();
    return;
  }
  if(event.target.closest('[data-v7326-round-back]')||event.target.closest('[data-v7326-record-back]')){
    antelmoV7326OpenRound();
    return;
  }
  const typeButton=event.target.closest('[data-v7326-record-type]');
  if(typeButton){
    antelmoV7326RecordForm(typeButton.dataset.v7326RecordType);
    return;
  }
  const ownerFilter=event.target.closest('[data-v7326-owner-filter]');
  if(ownerFilter){
    event.preventDefault();
    const cfg=antelmoV7326EnsureData();
    cfg.ownerPhotoFilters[ownerFilter.dataset.v7326OwnerFilter]=ownerFilter.dataset.tag||'';
    save();
    render();
  }
},true);

const antelmoV7326BuildBackup=antelmoV7323BuildBackup;
antelmoV7323BuildBackup=async function(){
  const backup=await antelmoV7326BuildBackup();
  backup.appVersion='7.3.26';
  return backup;
};

function antelmoV7326VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.26';
}

const antelmoV7326Render=render;
render=function(){
  antelmoV7326EnsureData();
  antelmoV7326Render();
  antelmoV7326VersionBadge();
  antelmoV7326InstallHome();
};

(function(){
  if(document.querySelector('#antelmo-v7326-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7326-styles';
  style.textContent=`
  .v7326-security-card{margin:0 0 16px;padding:15px;border-left:4px solid var(--line)}
  .v7326-security-card.safe{border-left-color:#2f9e62}.v7326-security-card.warning{border-left-color:#d19a32}.v7326-security-card.danger{border-left-color:#c85252}
  .v7326-security-head{display:grid;grid-template-columns:42px 1fr 12px;gap:10px;align-items:start}
  .v7326-shield{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:var(--surface2);font-size:23px}
  .v7326-security-head h2{font-size:17px;margin:2px 0}.v7326-security-head p{margin:0;color:var(--muted);font-size:12px;line-height:1.35}
  .v7326-security-dot{width:10px;height:10px;border-radius:50%;margin-top:6px;background:#aaa}.v7326-security-dot.safe{background:#2f9e62}.v7326-security-dot.warning{background:#d19a32}.v7326-security-dot.danger{background:#c85252}
  .v7326-security-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0}
  .v7326-security-stats div{padding:9px 7px;border-radius:11px;background:var(--surface2);min-width:0}.v7326-security-stats b,.v7326-security-stats small{display:block}.v7326-security-stats b{font-size:14px}.v7326-security-stats small{font-size:9px;color:var(--muted);line-height:1.2}
  .v7326-security-card>.sub{display:block;margin-top:9px;line-height:1.35}
  .antelmo-v7311-direct .v7326-round-button{grid-column:1/-1}
  .v7326-round-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.v7326-round-head>b{font-size:12px;color:var(--muted)}
  .v7326-round-progress{height:6px;border-radius:99px;background:var(--surface2);overflow:hidden;margin:8px 0 14px}.v7326-round-progress i{display:block;height:100%;border-radius:inherit;background:var(--green)}
  .v7326-round-colony{display:flex;align-items:center;gap:12px;padding:13px;border-radius:14px;background:var(--surface2)}.v7326-round-colony>span{font-size:34px}.v7326-round-colony h2{margin:0}.v7326-round-colony p{margin:3px 0 0}
  .v7326-round-facts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0}.v7326-round-facts div{padding:9px;border:1px solid var(--line);border-radius:11px}.v7326-round-facts small,.v7326-round-facts b{display:block}.v7326-round-facts small{color:var(--muted);font-size:10px}.v7326-round-facts b{font-size:12px;margin-top:2px}
  .v7326-round-question{text-align:center;font-weight:700;margin:14px 0 9px}.v7326-round-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v7326-round-actions .link-btn{grid-column:1/-1}.v7326-round-pause{display:block;margin:12px auto 0!important}
  .v7326-record-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}.v7326-record-grid button{display:flex;align-items:center;gap:8px;min-height:52px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--surface2);color:var(--text);font:inherit;text-align:left}.v7326-record-grid button span{font-size:22px}.v7326-record-grid button b{font-size:12px}
  .v7326-round-complete{text-align:center}.v7326-round-complete>span{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 10px;border-radius:50%;background:#dff4e8;color:#257a4c;font-size:30px}.v7326-round-complete>div{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:14px 0}.v7326-round-complete>div b{padding:10px;border-radius:11px;background:var(--surface2);font-size:20px}.v7326-round-complete small{display:block;color:var(--muted);font-size:9px}
  .v7326-tag-picker{padding:0;border:0;margin:2px 0 10px}.v7326-tag-picker legend{font-size:12px;font-weight:700;margin-bottom:7px}.v7326-tag-picker>div{display:flex;flex-wrap:wrap;gap:6px}.v7326-tag-picker label{margin:0}.v7326-tag-picker input{position:absolute;opacity:0;pointer-events:none}.v7326-tag-picker span{display:inline-flex;padding:7px 9px;border:1px solid var(--line);border-radius:99px;background:var(--surface2);font-size:11px}.v7326-tag-picker input:checked+span{border-color:var(--green);background:rgba(46,139,87,.14);color:var(--text);font-weight:700}
  .v7326-photo-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.v7326-photo-tags span{padding:3px 6px;border-radius:99px;background:var(--surface2);color:var(--muted);font-size:9px;line-height:1.2}
  .v7326-photo-filters{display:flex;gap:6px;overflow-x:auto;grid-column:1/-1;width:100%;padding:2px 0 8px;scrollbar-width:none}.v7326-photo-filters::-webkit-scrollbar{display:none}.v7326-photo-filters button{flex:0 0 auto;padding:6px 9px;border:1px solid var(--line);border-radius:99px;background:var(--surface);color:var(--text);font:inherit;font-size:10px}.v7326-photo-filters button.active{background:var(--green);border-color:var(--green);color:#fff}
  .modal.open~.antelmo-undo{top:calc(74px + env(safe-area-inset-top));bottom:auto}
  @media(max-width:390px){.v7326-security-card{padding:12px}.v7326-security-card .actions{display:grid;grid-template-columns:1fr}.v7326-security-stats{gap:5px}.v7326-round-facts{gap:5px}}
  `;
  document.head.appendChild(style);
})();
