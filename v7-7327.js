/* ANTELMO V7.3.27 — fotos de fauna, restauración segura y módulos agrupados. */

const ANTELMO_V7327_GROUPS=[
  {
    key:'hub',label:'Centro',icon:'⌂',title:'Centro de módulos',
    copy:'Seis áreas claras, sin herramientas duplicadas.',
    modules:[]
  },
  {
    key:'history',label:'Historia',icon:'📖',title:'Historia y resúmenes',
    copy:'Diario, biografías, resúmenes y documental en un mismo lugar.',
    modules:[
      ['story','📚','Historia y resúmenes','Resumen semanal, mensual o anual y acceso al documental'],
      ['global','🌍','Cronología','Todos los registros ordenados por fecha'],
      ['life','📖','Libros de Vida','Biografía viva de cada colonia'],
      ['legacy','🏛️','Legado','Colonias históricas sin perder recuerdos'],
      ['library','🗂️','Biblioteca','Archivo y búsqueda histórica'],
      ['hall','🏆','Récords','Hitos, marcas y colonia favorita'],
      ['presentation','🎴','Presentación','Tarjetas para enseñar la colección'],
      ['genealogy','🌳','Genealogía','Linajes y relaciones entre colonias']
    ]
  },
  {
    key:'care',label:'Cuidados',icon:'🌿',title:'Cuidados y seguimiento',
    copy:'Registros frecuentes, alertas y seguimiento del entorno.',
    modules:[
      ['feeding','🍯','Alimentación','Historial y preferencias'],
      ['smart','🧠','Cuidados','Prioridades calculadas en el dispositivo'],
      ['environment','🌡️','Ambiente','Temperatura y humedad'],
      ['notifications','🔔','Avisos','Recordatorios del dispositivo'],
      ['prediction','🔮','Predicción','Tendencia orientativa del crecimiento']
    ]
  },
  {
    key:'explore',label:'AntDex',icon:'🐜',title:'AntDex y Enciclopedia',
    copy:'Una sola entrada para especies, fotografías y exploración.',
    modules:[
      ['encyclopedia','📚','AntDex y Enciclopedia','Fichas locales de especies y colonias'],
      ['media','📷','Fotografías','Galería, búsqueda y Antes/Después'],
      ['timelapse','🎞️','Timelapse','Evolución fotográfica'],
      ['scanner','🔎','AntScan','Identificación y observaciones'],
      ['achievements','🏆','Logros','Hitos de la colección'],
      ['search','⌕','Buscar','Búsqueda general']
    ]
  },
  {
    key:'fauna',label:'Terrarios',icon:'🪲',title:'Terrarios y habitantes',
    copy:'Instalaciones, fichas, fotografías e historial.',
    modules:[]
  },
  {
    key:'data',label:'Datos',icon:'🛡️',title:'Seguridad, datos y nube',
    copy:'Comparación, copias y conexiones reunidas sin mezclarlas con fauna.',
    modules:[
      ['security','🛡️','Seguridad y copia','Crear, comprobar y restaurar una copia completa'],
      ['stats','📊','Datos y crecimiento','Estadísticas y evolución'],
      ['compare','⚖️','Comparar colonias','Un único comparador para hasta seis colonias'],
      ['ai','🔬','Análisis local','Patrones calculados sin enviar datos'],
      ['sync','📦','Sincronización portátil','Mover una copia entre dispositivos'],
      ['cloud','☁️','Nube personal','Conexión opcional configurada por el usuario']
    ]
  }
];

const ANTELMO_V7327_TAB_GROUP={
  story:'history',documentary:'history',summaries:'history',global:'history',life:'history',
  legacy:'history',library:'history',presentation:'history',genealogy:'history',hall:'history',
  feeding:'care',smart:'care',environment:'care',notifications:'care',prediction:'care',
  encyclopedia:'explore',media:'explore',timelapse:'explore',scanner:'explore',
  achievements:'explore',search:'explore',
  fauna:'fauna',
  security:'data',stats:'data',compare:'data',ai:'data',sync:'data',cloud:'data'
};

function antelmoV7327GroupFor(tab){
  const mapped=ANTELMO_V7327_TAB_GROUP[tab];
  if(mapped)return mapped;
  return ANTELMO_V7327_GROUPS.some(group=>group.key===tab)?tab:'hub';
}

function antelmoV7327ModuleGrid(modules){
  return `<div class="module-grid v7327-module-grid">${modules.map(([dest,icon,title,text])=>
    `<button type="button" data-module="${dest}"><span>${icon}</span><b>${title}</b><small>${text}</small></button>`
  ).join('')}</div>`;
}

function antelmoV7327HubView(){
  const groups=ANTELMO_V7327_GROUPS.filter(group=>group.key!=='hub');
  return `<section class="module-intro v7327-module-intro"><span class="eyebrow">MÓDULOS</span><h2>Todo en su sitio</h2><p>Las herramientas siguen siendo las mismas, ahora agrupadas para encontrarlas sin recorrer una barra interminable.</p></section>
  <div class="v7327-group-grid">${groups.map(group=>
    `<button type="button" data-module="${group.key}"><span>${group.icon}</span><div><b>${group.title}</b><small>${group.copy}</small></div><i>›</i></button>`
  ).join('')}</div>`;
}

function antelmoV7327GroupView(key){
  if(key==='fauna')return terrariumView();
  const group=ANTELMO_V7327_GROUPS.find(item=>item.key===key)||ANTELMO_V7327_GROUPS[0];
  return `<div class="section-title v7327-group-title"><div><span class="eyebrow">${group.label.toUpperCase()}</span><h2>${group.icon} ${group.title}</h2><p>${group.copy}</p></div></div>${antelmoV7327ModuleGrid(group.modules)}`;
}

function antelmoV7327StoryView(){
  return `<div class="section-title"><div><span class="eyebrow">HISTORIA</span><h2>📚 Historia y resúmenes</h2><p>La vista periódica y el documental comparten los mismos registros.</p></div></div>
  <div class="card v7327-story-actions"><div><b>Documental completo</b><p class="sub">Recorre meses o años y exporta la historia de una colonia.</p></div><button type="button" class="button secondary" data-module="documentary">Abrir documental</button></div>
  ${summariesView()}`;
}

function antelmoV7327SecurityView(){
  return `<div class="section-title"><div><span class="eyebrow">DATOS</span><h2>🛡️ Seguridad y copia</h2><p>La copia completa vive aquí, fuera de Terrarios y Habitantes.</p></div></div>
  ${antelmoV7326SecurityCard()}
  ${antelmoV7323BackupPanel()}
  <div class="section-title"><div><h2>Otras opciones</h2><p>Conexiones opcionales y traslado entre dispositivos</p></div></div>
  ${antelmoV7327ModuleGrid([
    ['sync','📦','Sincronización portátil','Exportar o restaurar entre dispositivos'],
    ['cloud','☁️','Nube personal','Conexión remota opcional']
  ])}`;
}

roadmapTabs=function(){
  const tab=db.appConfig?.moreTab||'hub';
  const active=antelmoV7327GroupFor(tab);
  return `<nav class="tabs pro-tabs v7-tabs v7327-tabs" aria-label="Grupos de módulos">${ANTELMO_V7327_GROUPS.map(group=>
    `<button type="button" class="${active===group.key?'active':''}" data-more-tab="${group.key}" aria-current="${active===group.key?'page':'false'}"><span>${group.icon}</span>${group.label}</button>`
  ).join('')}</nav>`;
};

hubView=antelmoV7327HubView;

const antelmoV7327BaseMore=more;
more=function(){
  ensureRoadmapData();
  const tab=db.appConfig.moreTab||'hub';
  const bar=roadmapTabs();
  if(tab==='hub')return bar+antelmoV7327HubView();
  if(ANTELMO_V7327_GROUPS.some(group=>group.key===tab))return bar+antelmoV7327GroupView(tab);
  if(tab==='story')return bar+antelmoV7327StoryView();
  if(tab==='security')return bar+antelmoV7327SecurityView();
  const html=antelmoV7327BaseMore();
  const group=ANTELMO_V7327_GROUPS.find(item=>item.key===antelmoV7327GroupFor(tab));
  const back=group?`<div class="v7327-module-context"><button type="button" class="link-btn" data-module="${group.key}">‹ ${esc(group.title)}</button></div>`:'';
  return back&&html.includes(bar)?html.replace(bar,bar+back):html;
};

/* La copia completa solo se monta en Seguridad y copia. */
const antelmoV7327BaseBackupPanel=antelmoV7323BackupPanel;
antelmoV7323BackupPanel=function(){
  return antelmoV7327BaseBackupPanel().replace('<span class="chip">V7.3.23</span>','<span class="chip">V7.3.27</span>');
};

function antelmoV7327BindSecurity(){
  const backup=document.querySelector('#antelmoFullBackup');
  const restore=document.querySelector('#antelmoFullRestore');
  if(backup)backup.onclick=antelmoV7327Export;
  if(restore)restore.onchange=event=>{
    const file=event.target.files?.[0];
    if(file)antelmoV7327Import(file);
    event.target.value='';
  };
  requestAnimationFrame(antelmoV7326HydrateSecurity);
}

antelmoV7323InstallPanel=function(){
  if(route==='more'&&db.appConfig?.moreTab==='security')antelmoV7327BindSecurity();
};

/* Exportación y restauración: se valida todo antes de sustituir IndexedDB. */
const antelmoV7327BaseBuildBackup=antelmoV7323BuildBackup;
antelmoV7323BuildBackup=async function(){
  const backup=await antelmoV7327BaseBuildBackup();
  backup.appVersion='7.3.27';
  return backup;
};

async function antelmoV7327Export(){
  try{
    toast('Preparando copia…');
    const backup=await antelmoV7323BuildBackup();
    const stored=await photoAll();
    if(backup.media.length!==stored.length)throw new Error('Hay archivos multimedia incompletos');
    backup.database.appConfig ||= {};
    backup.database.appConfig.backup ||= {};
    backup.database.appConfig.backup.lastExportAt=backup.exportedAt;
    backup.database.appConfig.backup.lastExportPhotos=backup.media.length;
    const blob=new Blob([JSON.stringify(backup)],{type:'application/json'});
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
    alert('No se pudo crear una copia completa. Comprueba que todas las fotos se abren y vuelve a intentarlo.');
  }
}

function antelmoV7327RestoreStorage(snapshot){
  if(!snapshot||typeof snapshot!=='object')return;
  const reserved=new Set(['antelmo.v4','antelmo.v3','antelmo.safety.last']);
  const current=[];
  for(let index=0;index<localStorage.length;index++){
    const key=localStorage.key(index);
    if(key?.startsWith('antelmo.')&&!reserved.has(key))current.push(key);
  }
  current.forEach(key=>localStorage.removeItem(key));
  Object.entries(snapshot).forEach(([key,value])=>{
    if(key.startsWith('antelmo.')&&!reserved.has(key)&&typeof value==='string')localStorage.setItem(key,value);
  });
}

function antelmoV7327ReplacePhotos(photos){
  return new Promise((resolve,reject)=>{
    if(!idb){
      if(photos.length)reject(new Error('Almacenamiento multimedia no disponible'));
      else resolve();
      return;
    }
    let transaction;
    try{
      transaction=idb.transaction('photos','readwrite');
      const objectStore=transaction.objectStore('photos');
      objectStore.clear();
      photos.forEach(photo=>objectStore.put(photo));
    }catch(error){
      reject(error);
      return;
    }
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(transaction.error||new Error('No se pudieron restaurar las fotos'));
    transaction.onabort=()=>reject(transaction.error||new Error('La restauración multimedia fue cancelada'));
  });
}

async function antelmoV7327PrepareRestore(file){
  const parsed=JSON.parse(await file.text());
  let restoredDb,media=[],storage={};
  if(parsed?.format===ANTELMO_BACKUP_FORMAT&&parsed?.database){
    restoredDb=parsed.database;
    media=Array.isArray(parsed.media)?parsed.media:[];
    storage=parsed.localStorage||{};
  }else if(Array.isArray(parsed?.colonies)){
    restoredDb={...parsed};
    media=Array.isArray(restoredDb.mediaBackup)?restoredDb.mediaBackup:[];
    delete restoredDb.mediaBackup;
  }else{
    throw new Error('Formato no reconocido');
  }
  if(!restoredDb||!Array.isArray(restoredDb.colonies))throw new Error('Base de datos inválida');
  const ids=new Set();
  const photos=[];
  for(const item of media){
    if(item?.id==null||typeof item.dataUrl!=='string'||ids.has(String(item.id)))throw new Error('Multimedia inválida');
    ids.add(String(item.id));
    const blob=await antelmoV7323DataUrlToBlob(item.dataUrl);
    if(!blob?.size&&item.dataUrl.length>32)throw new Error('No se pudo leer una fotografía');
    const clean={...item,blob};
    delete clean.dataUrl;
    delete clean.mime;
    photos.push(clean);
  }
  return {restoredDb,photos,storage};
}

async function antelmoV7327Import(file){
  if(!file)return;
  try{
    toast('Comprobando copia…');
    const prepared=await antelmoV7327PrepareRestore(file);
    const ok=confirm(`Restaurar esta copia sustituirá los datos actuales.\n\nColonias: ${prepared.restoredDb.colonies.length}\nFotografías: ${prepared.photos.length}\n\n¿Continuar?`);
    if(!ok){
      toast('Restauración cancelada');
      return;
    }
    toast('Restaurando copia…');
    await antelmoV7327ReplacePhotos(prepared.photos);
    db=prepared.restoredDb;
    db.appConfig ||= {};
    db.appConfig.backup ||= {};
    db.appConfig.backup.lastRestoreAt=new Date().toISOString();
    antelmoV7327RestoreStorage(prepared.storage);
    save();
    selected=null;
    route='home';
    toast(`Copia restaurada · ${prepared.photos.length} fotos`);
    render();
  }catch(error){
    console.error(error);
    alert('La copia no es válida o no se pudo completar la restauración.');
  }
}

antelmoV7326Export=antelmoV7327Export;
antelmoV7323Export=antelmoV7327Export;
exportBackup=antelmoV7327Export;
antelmoV7323Import=antelmoV7327Import;
importBackup=antelmoV7327Import;

/* Terrarios/Habitantes: altas con rollback, edición persistente y visor navegable. */
antelmoV7315AddPhotos=async function(ownerType,ownerId,label){
  openModal(`<h2>📷 Fotos de ${esc(label)}</h2><form id="v7327OwnerPhotoForm" class="form">
    ${field('Fecha',`<input name="date" type="date" value="${today()}">`)}
    ${field('Fotos',`<input name="photos" type="file" accept="image/*" multiple required>`)}
    ${field('Descripción',`<input name="caption" placeholder="Evolución, alimentación, cambio de refugio…">`)}
    ${antelmoV7326TagOptions()}
    <label class="check-row"><input name="cover" type="checkbox"> Usar la primera como portada</label>
    <button class="button">Guardar fotografías</button></form>`);
  const form=document.querySelector('#v7327OwnerPhotoForm');
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);
  form.onsubmit=async event=>{
    event.preventDefault();
    const button=form.querySelector('button[type="submit"],button:not([type])');
    const values=new FormData(form);
    const files=[...form.elements.photos.files];
    if(!files.length)return;
    if(button)button.disabled=true;
    const storedIds=[];
    try{
      const tags=antelmoV7326FormTags(form);
      const date=toIsoDate(values.get('date'))||today();
      const caption=String(values.get('caption')||'').trim();
      const created=[];
      let index=0;
      for(const file of files){
        const blob=await optimizeImage(file);
        const photo={
          id:uid('terr-media'),colonyId:'',date,
          caption:caption||(files.length>1?`Foto ${index+1}`:'Fotografía'),
          cover:false,blob,createdAt:new Date().toISOString(),tags:[...tags]
        };
        await photoPut(photo);
        storedIds.push(photo.id);
        created.push({photo,index});
        index++;
      }
      if(values.get('cover')==='on'){
        db.mediaIndex.filter(item=>item.ownerType===ownerType&&String(item.ownerId)===String(ownerId)).forEach(item=>item.ownerCover=false);
      }
      created.forEach(({photo,index:position})=>db.mediaIndex.push({
        id:String(photo.id),colonyId:'',date:photo.date,caption:photo.caption,
        type:photo.blob.type||'image/jpeg',createdAt:photo.createdAt,ownerType,
        ownerId:String(ownerId),ownerCover:values.get('cover')==='on'&&position===0,
        tags:[...photo.tags]
      }));
      save();
      closeModal();
      toast(`${files.length} ${files.length===1?'foto guardada':'fotos guardadas'}`);
      render();
    }catch(error){
      console.error(error);
      for(const id of storedIds){
        try{await photoDelete(id);}catch{}
      }
      if(button)button.disabled=false;
      toast('No se pudieron guardar las fotografías');
    }
  };
};

antelmoV7322Edit=async function(id){
  const meta=antelmoV7322Meta(id);
  const photo=await antelmoV7325Photo(id);
  if(!meta||!photo){
    toast('No se pudo editar la fotografía');
    return;
  }
  const selectedTags=antelmoV7326Tags(photo.tags||meta.tags);
  openModal(`<h2>Editar fotografía</h2><form id="v7327OwnerEditPhoto" class="form">
    ${field('Fecha',`<input name="date" type="date" value="${esc(String(meta.date||photo.date||today()).slice(0,10))}">`)}
    ${field('Descripción',`<input name="caption" value="${esc(meta.caption||photo.caption||'')}" placeholder="Qué muestra esta foto">`)}
    ${antelmoV7326TagOptions(selectedTags)}
    <button class="button">Guardar cambios</button></form>`);
  const form=document.querySelector('#v7327OwnerEditPhoto');
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);
  form.onsubmit=async event=>{
    event.preventDefault();
    const button=form.querySelector('button[type="submit"],button:not([type])');
    if(button)button.disabled=true;
    try{
      const values=new FormData(form);
      const date=toIsoDate(values.get('date'))||photo.date||today();
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
    }catch(error){
      console.error(error);
      if(button)button.disabled=false;
      toast('No se pudieron guardar los cambios');
    }
  };
};

antelmoV7322SetCover=async function(id){
  const meta=antelmoV7322Meta(id);
  const photo=await antelmoV7325Photo(id);
  if(!meta||!photo?.blob){
    toast('No se encontró la fotografía');
    return;
  }
  db.mediaIndex
    .filter(item=>item.ownerType===meta.ownerType&&String(item.ownerId)===String(meta.ownerId))
    .forEach(item=>item.ownerCover=false);
  meta.ownerCover=true;
  save();
  closeModal();
  toast('Nueva portada elegida');
  render();
};

antelmoV7322Delete=async function(id){
  const meta=antelmoV7322Meta(id);
  if(!meta){
    toast('No se encontró la fotografía');
    return;
  }
  if(!confirm('¿Eliminar esta fotografía?'))return;
  try{
    const photo=await antelmoV7325Photo(id);
    if(photo)await photoDelete(photo.id);
    const wasCover=Boolean(meta.ownerCover);
    const ownerType=meta.ownerType;
    const ownerId=meta.ownerId;
    db.mediaIndex=(db.mediaIndex||[]).filter(item=>String(item.id)!==String(id));
    if(wasCover){
      const fallback=antelmoV7315Media(ownerType,ownerId)[0];
      if(fallback)fallback.ownerCover=true;
    }
    save();
    closeModal();
    toast('Fotografía eliminada');
    render();
  }catch(error){
    console.error(error);
    toast('No se pudo eliminar la fotografía');
  }
};

let antelmoV7327ViewerUrl='';
function antelmoV7327ReleaseViewerUrl(){
  if(!antelmoV7327ViewerUrl)return;
  try{URL.revokeObjectURL(antelmoV7327ViewerUrl);}catch{}
  antelmoV7327ViewerUrl='';
}

function antelmoV7327OwnerMedia(meta){
  const all=antelmoV7315Media(meta.ownerType,meta.ownerId);
  const cfg=antelmoV7326EnsureData();
  const key=`${meta.ownerType}:${String(meta.ownerId)}`;
  const filter=cfg.ownerPhotoFilters[key]||'';
  return filter?all.filter(item=>antelmoV7326Tags(item.tags).includes(filter)):all;
}

antelmoV7322View=async function(id){
  const meta=antelmoV7322Meta(id);
  const photo=await antelmoV7325Photo(id);
  if(!meta||!photo?.blob){
    toast('No se pudo abrir la fotografía');
    return;
  }
  const media=antelmoV7327OwnerMedia(meta);
  const position=Math.max(0,media.findIndex(item=>String(item.id)===String(id)));
  const previous=media[position-1];
  const next=media[position+1];
  antelmoV7327ReleaseViewerUrl();
  antelmoV7327ViewerUrl=URL.createObjectURL(photo.blob);
  openModal(`<div class="photo-viewer v7324-photo-viewer v7327-photo-viewer">
    <img src="${antelmoV7327ViewerUrl}" alt="${esc(meta.caption||photo.caption||'Fotografía')}">
    <div class="v7327-photo-nav" aria-label="Navegación entre fotografías">
      <button type="button" class="button secondary" data-v7327-view="${esc(previous?.id||'')}" ${previous?'':'disabled'}>‹ Anterior</button>
      <span>${position+1} de ${media.length}</span>
      <button type="button" class="button secondary" data-v7327-view="${esc(next?.id||'')}" ${next?'':'disabled'}>Siguiente ›</button>
    </div>
    <div class="photo-viewer-info"><h2>${esc(meta.caption||photo.caption||'Sin descripción')}</h2><p>${esc(toDisplayDate(meta.date||photo.date||'Sin fecha'))} ${meta.ownerCover?'· ⭐ Portada':''}</p>${antelmoV7326TagChips(photo.tags||meta.tags)}
      <div class="actions"><button type="button" class="button secondary" data-v7322-cover="${esc(id)}">⭐ Portada</button><button type="button" class="button secondary" data-v7322-edit="${esc(id)}">Editar</button><button type="button" class="button danger" data-v7322-delete="${esc(id)}">🗑 Borrar</button></div>
    </div>
  </div>`);
};

let antelmoV7327MediaHydration=0;
let antelmoV7327MediaUrls=[];
async function antelmoV7327HydrateOwnerMedia(){
  if(route!=='more'||db.appConfig?.moreTab!=='fauna')return;
  const token=++antelmoV7327MediaHydration;
  const photos=await photoAll();
  if(token!==antelmoV7327MediaHydration)return;
  antelmoV7327MediaUrls.forEach(url=>{try{URL.revokeObjectURL(url);}catch{}});
  antelmoV7327MediaUrls=[];
  document.querySelectorAll('[data-v7322-photo]').forEach(image=>{
    const photo=photos.find(item=>String(item.id)===String(image.dataset.v7322Photo));
    if(!photo?.blob)return;
    const url=URL.createObjectURL(photo.blob);
    antelmoV7327MediaUrls.push(url);
    image.src=url;
  });
  document.querySelectorAll('[data-v7315-cover]').forEach(element=>{
    const meta=(db.mediaIndex||[]).find(item=>item.ownerCover&&item.ownerType===element.dataset.v7315OwnerType&&String(item.ownerId)===String(element.dataset.v7315Cover));
    const photo=meta&&photos.find(item=>String(item.id)===String(meta.id));
    if(!photo?.blob)return;
    const url=URL.createObjectURL(photo.blob);
    antelmoV7327MediaUrls.push(url);
    element.innerHTML=`<img src="${url}" alt="${esc(meta.caption||photo.caption||'Portada')}">`;
  });
}

antelmoV7315HydrateMedia=antelmoV7327HydrateOwnerMedia;
antelmoV7322Hydrate=antelmoV7327HydrateOwnerMedia;

function antelmoV7327RepairFaunaNavigation(){
  if(route!=='more'||db.appConfig?.moreTab!=='fauna')return;
  const cfg=antelmoV7315Cfg();
  let changed=false;
  if(cfg.selectedFaunaId&&!db.fauna.some(item=>String(item.id)===String(cfg.selectedFaunaId))){
    cfg.selectedFaunaId='';
    changed=true;
  }
  if(cfg.selectedTerrarium&&!antelmoV7315TerrariumNames().some(name=>String(name)===String(cfg.selectedTerrarium))){
    cfg.selectedTerrarium='';
    changed=true;
  }
  if(changed)save();
}

const antelmoV7327BaseBind=bind;
bind=function(){
  antelmoV7327BaseBind();
  if(route==='more'&&db.appConfig?.moreTab==='security')antelmoV7327BindSecurity();
};

document.addEventListener('click',event=>{
  const step=event.target.closest('[data-v7327-view]');
  if(step&&step.dataset.v7327View){
    event.preventDefault();
    event.stopImmediatePropagation();
    antelmoV7322View(step.dataset.v7327View);
    return;
  }
  if(event.target.closest('#modalClose')||event.target===document.querySelector('#modal')){
    setTimeout(antelmoV7327ReleaseViewerUrl,0);
  }
},true);

function antelmoV7327VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.27';
}

const antelmoV7327BaseRender=render;
render=function(){
  antelmoV7327RepairFaunaNavigation();
  antelmoV7327BaseRender();
  antelmoV7327VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7327-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7327-styles';
  style.textContent=`
  .v7327-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;overflow:visible;margin-bottom:14px}
  .v7327-tabs button{display:flex;min-width:0;align-items:center;justify-content:center;gap:4px;padding:8px 5px;font-size:10px}
  .v7327-tabs button span{font-size:14px}.v7327-module-intro{margin-bottom:12px}
  .v7327-group-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .v7327-group-grid>button{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:9px;min-width:0;padding:13px;border:1px solid var(--line);border-radius:18px;background:var(--surface);color:var(--ink);text-align:left}
  .v7327-group-grid>button>span{font-size:25px}.v7327-group-grid>button div{min-width:0}.v7327-group-grid b,.v7327-group-grid small{display:block}.v7327-group-grid small{margin-top:3px;color:var(--muted);font-size:10px;line-height:1.3}.v7327-group-grid i{font-size:24px;color:var(--muted);font-style:normal}
  .v7327-group-title{align-items:start}.v7327-group-title h2{margin-top:3px}.v7327-module-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .v7327-module-context{margin:-5px 0 8px}.v7327-story-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.v7327-story-actions p{margin:4px 0 0}
  .v7327-photo-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:9px}.v7327-photo-nav span{text-align:center;color:var(--muted);font-size:11px}.v7327-photo-nav button{padding:8px}.v7327-photo-nav button:disabled{opacity:.42}
  @media(max-width:620px){.v7327-tabs{grid-template-columns:repeat(3,1fr)}.v7327-group-grid,.v7327-module-grid{grid-template-columns:1fr}.v7327-story-actions{align-items:stretch;flex-direction:column}}
  `;
  document.head.appendChild(style);
})();
