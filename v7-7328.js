/* ANTELMO V7.3.28 — paneles plegables, colecciones, contraste y copia para iCloud. */

const ANTELMO_V7328_VERSION='7.3.28';
let antelmoV7328PreparedBackup=null;

function antelmoV7328Config(){
  db.appConfig ||= {};
  db.appConfig.v7328 ||= {homeColoniesCollapsed:false,detailCollapsed:{}};
  db.appConfig.v7328.detailCollapsed ||= {};
  return db.appConfig.v7328;
}

function antelmoV7328DetailList(){
  const cfg=antelmoV7328Config(),key=String(selected||'');
  cfg.detailCollapsed[key] ||= [];
  return cfg.detailCollapsed[key];
}

function antelmoV7328IsDetailCollapsed(section){
  return antelmoV7328DetailList().includes(section);
}

function antelmoV7328ToggleDetail(section){
  const list=antelmoV7328DetailList(),index=list.indexOf(section);
  if(index>=0)list.splice(index,1);
  else list.push(section);
}

function antelmoV7328ToggleButton(section,collapsed,label){
  const button=document.createElement('button');
  button.type='button';
  button.className='antelmo-section-toggle v7328-collapse-toggle';
  button.dataset.v7328ColonyToggle=section;
  button.textContent=collapsed?'＋':'−';
  button.setAttribute('aria-expanded',collapsed?'false':'true');
  button.setAttribute('aria-label',collapsed?`Expandir ${label}`:`Minimizar ${label}`);
  return button;
}

function antelmoV7328EnhanceHome(){
  if(route!=='home')return;
  const app=document.querySelector('#app');
  if(!app)return;
  const title=[...app.querySelectorAll('.workbench-section-title')].find(node=>
    node.querySelector('h2')?.textContent.trim()==='Colonias vivas'
  );
  if(!title)return;
  const widget=title.closest('[data-dashboard-widget="colonies"]');
  const grid=widget?.querySelector('.workbench-v7-grid')||title.nextElementSibling;
  if(!grid)return;
  const collapsed=Boolean(antelmoV7328Config().homeColoniesCollapsed);
  grid.hidden=collapsed;
  grid.style.display=collapsed?'none':'';
  title.querySelector('[data-v7328-home-colonies]')?.remove();
  const button=document.createElement('button');
  button.type='button';
  button.className='antelmo-section-toggle v7328-collapse-toggle';
  button.dataset.v7328HomeColonies='true';
  button.textContent=collapsed?'＋':'−';
  button.setAttribute('aria-expanded',collapsed?'false':'true');
  button.setAttribute('aria-label',collapsed?'Expandir Colonias vivas':'Minimizar Colonias vivas');
  title.appendChild(button);
}

function antelmoV7328EnhanceData(){
  if(route!=='stats')return;
  const app=document.querySelector('#app');
  if(!app||app.querySelector('[data-v7326-security]'))return;
  const card=antelmoV7326SecurityCard()
    .replace('data-v7326-backup>','data-v7328-open-security>')
    .replace('⬇︎ Crear copia ahora','Abrir Seguridad y copia');
  app.insertAdjacentHTML('afterbegin',card);
  requestAnimationFrame(antelmoV7326HydrateSecurity);
}

function antelmoV7328EnhanceColony(){
  if(route!=='colonies'||!selected)return;
  const app=document.querySelector('#app');
  if(!app)return;

  const documentary=app.querySelector('.documentary');
  const documentaryHead=documentary?.querySelector('.documentary-cover');
  const documentaryBodies=documentary?[...documentary.children].filter(node=>node!==documentaryHead):[];
  if(documentary&&documentaryHead&&documentaryBodies.length){
    const collapsed=antelmoV7328IsDetailCollapsed('documentary');
    documentary.classList.toggle('v7328-is-collapsed',collapsed);
    documentaryBodies.forEach(node=>{
      node.hidden=collapsed;
      node.style.display=collapsed?'none':'';
    });
    documentaryHead.querySelector('[data-v7328-colony-toggle="documentary"]')?.remove();
    documentaryHead.appendChild(antelmoV7328ToggleButton('documentary',collapsed,'Modo documental'));
  }

  const cycle=[...app.querySelectorAll('.legacy-action')].find(node=>
    /Ciclo de la colonia|Conservada en el Legado/i.test(node.textContent)
  );
  if(cycle){
    const collapsed=antelmoV7328IsDetailCollapsed('cycle');
    cycle.classList.add('v7328-cycle');
    cycle.classList.toggle('v7328-is-collapsed',collapsed);
    cycle.querySelector('[data-v7328-colony-toggle="cycle"]')?.remove();
    cycle.appendChild(antelmoV7328ToggleButton('cycle',collapsed,'Ciclo de la colonia'));
  }
}

/* V7.3.26 insertaba el Escudo en MANDO. Se conserva la ronda de revisión, pero el
   Escudo y la copia completa solo se renderizan en Módulos > Datos > Seguridad. */
antelmoV7326InstallHome=function(){
  if(route!=='home')return;
  antelmoV7326EnsureData();
  const direct=document.querySelector('#app .antelmo-v7311-direct');
  if(direct&&!direct.querySelector('[data-v7326-round]')){
    const active=Boolean(db.appConfig.v7326.activeRound);
    direct.insertAdjacentHTML('beforeend',`<button type="button" class="v7326-round-button" data-v7326-round><span>✓</span><b>${active?'Continuar ronda':'Ronda de revisión'}</b></button>`);
  }
};

/* La colección puede elegirse o crearse sin abandonar la edición de la colonia. */
const antelmoV7328BaseColonyForm=colonyForm;
colonyForm=function(id){
  antelmoV7328BaseColonyForm(id);
  const form=document.querySelector('#v72ColonyForm');
  const select=form?.elements?.collectionId;
  if(!form||!select||form.querySelector('[data-v7328-collection-create]'))return;
  const label=select.closest('label')||select.parentElement;
  const creator=document.createElement('div');
  creator.className='v7328-collection-create';
  creator.dataset.v7328CollectionCreate='true';
  creator.innerHTML='<input type="text" data-v7328-collection-name placeholder="Nombre de una nueva colección" aria-label="Nombre de una nueva colección"><button type="button" class="button secondary" data-v7328-create-collection>＋ Crear y seleccionar</button><small>Puedes elegir una colección existente arriba o crearla aquí.</small>';
  label?.insertAdjacentElement('afterend',creator);
  creator.querySelector('[data-v7328-collection-name]')?.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    event.preventDefault();
    creator.querySelector('[data-v7328-create-collection]')?.click();
  });
};

function antelmoV7328CreateCollection(button){
  const creator=button.closest('[data-v7328-collection-create]');
  const form=button.closest('#v72ColonyForm');
  const input=creator?.querySelector('[data-v7328-collection-name]');
  const select=form?.elements?.collectionId;
  const name=String(input?.value||'').trim();
  if(!name){
    input?.focus();
    toast('Escribe el nombre de la colección');
    return;
  }
  ensureRoadmapData();
  let collection=db.collections.find(item=>String(item.name||'').trim().toLocaleLowerCase('es')===name.toLocaleLowerCase('es'));
  if(!collection){
    collection={id:uid('collection'),name,color:typeof speciesAccent==='function'?speciesAccent(name):'#3d765c'};
    db.collections.push(collection);
  }
  if(select&&![...select.options].some(option=>String(option.value)===String(collection.id))){
    const option=document.createElement('option');
    option.value=collection.id;
    option.textContent=collection.name;
    select.appendChild(option);
  }
  if(select){
    select.value=collection.id;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }
  input.value='';
  save();
  toast('Colección creada y seleccionada');
}

async function antelmoV7328PrepareBackupFile(){
  const backup=await antelmoV7323BuildBackup();
  const stored=await photoAll();
  if(backup.media.length!==stored.length)throw new Error('Hay archivos multimedia incompletos');
  backup.database.appConfig ||= {};
  backup.database.appConfig.backup ||= {};
  backup.database.appConfig.backup.lastExportAt=backup.exportedAt;
  backup.database.appConfig.backup.lastExportPhotos=backup.media.length;
  const blob=new Blob([JSON.stringify(backup)],{type:'application/json'});
  const name=`ANTELMO-COMPLETO-${today()}.json`;
  return {backup,blob,name,file:new File([blob],name,{type:'application/json'})};
}

function antelmoV7328CanShareFile(file){
  if(typeof navigator.share!=='function')return false;
  return typeof navigator.canShare!=='function'||navigator.canShare({files:[file]});
}

function antelmoV7328UpdateBackupReady(){
  const ready=document.querySelector('#antelmoICloudReady');
  const name=document.querySelector('#antelmoICloudFileName');
  if(ready)ready.hidden=!antelmoV7328PreparedBackup;
  if(name)name.textContent=antelmoV7328PreparedBackup?.name||'';
}

async function antelmoV7328PrepareICloud(){
  try{
    toast('Preparando copia completa…');
    antelmoV7328PreparedBackup=await antelmoV7328PrepareBackupFile();
    antelmoV7328UpdateBackupReady();
    toast('Copia preparada · toca Guardar en Archivos');
  }catch(error){
    console.error(error);
    antelmoV7328PreparedBackup=null;
    alert('No se pudo preparar la copia completa. Comprueba que todas las fotos se abren y vuelve a intentarlo.');
  }
}

async function antelmoV7328PrepareFromShield(){
  await antelmoV7328PrepareICloud();
  document.querySelector('#antelmoICloudReady:not([hidden])')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function antelmoV7328RecordExport(prepared){
  db.appConfig ||= {};
  db.appConfig.backup ||= {};
  db.appConfig.backup.lastExportAt=prepared.backup.exportedAt;
  db.appConfig.backup.lastExportPhotos=prepared.backup.media.length;
  save();
}

function antelmoV7328ShareICloud(){
  const prepared=antelmoV7328PreparedBackup;
  if(!prepared){
    toast('Primero prepara la copia');
    return;
  }
  if(!antelmoV7328CanShareFile(prepared.file)){
    alert('Este navegador no ofrece el selector de Archivos. Usa “Descargar archivo” y mueve después la copia a iCloud Drive desde Archivos.');
    return;
  }

  /* El archivo ya está preparado: navigator.share se llama directamente desde
     este segundo toque para conservar la activación requerida por Safari. */
  let sharing;
  try{
    sharing=navigator.share({files:[prepared.file],title:'Copia completa de ANTELMO'});
  }catch(error){
    console.error(error);
    alert('No se pudo abrir Archivos. Usa “Descargar archivo” como alternativa.');
    return;
  }
  Promise.resolve(sharing).then(()=>{
    antelmoV7328RecordExport(prepared);
    antelmoV7328PreparedBackup=null;
    toast(`Copia compartida · ${prepared.backup.media.length} fotos`);
    render();
  }).catch(error=>{
    if(error?.name==='AbortError'){
      toast('Guardado cancelado');
      return;
    }
    console.error(error);
    alert('No se pudo abrir Archivos. Usa “Descargar archivo” como alternativa.');
  });
}

async function antelmoV7328DownloadBackup(){
  try{
    toast('Preparando descarga…');
    const prepared=antelmoV7328PreparedBackup||await antelmoV7328PrepareBackupFile();
    const link=document.createElement('a');
    const url=URL.createObjectURL(prepared.blob);
    link.href=url;
    link.download=prepared.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    antelmoV7328RecordExport(prepared);
    antelmoV7328PreparedBackup=null;
    toast(`Copia descargada · ${prepared.backup.media.length} fotos`);
    render();
  }catch(error){
    console.error(error);
    alert('No se pudo descargar la copia completa.');
  }
}

antelmoV7323BackupPanel=function(){
  const info=db.appConfig?.backup||{};
  const last=info.lastExportAt?toDisplayDate(String(info.lastExportAt).slice(0,10)):'Nunca';
  const count=info.lastExportPhotos!=null?` · ${info.lastExportPhotos} fotos`:'';
  return `<section class="card antelmo-backup-card v7328-backup-card">
    <div class="antelmo-backup-head"><div><span class="eyebrow">SEGURIDAD</span><h2>💾 Copia completa</h2></div><span class="chip">V7.3.28</span></div>
    <p>Guarda colonias, diario, configuraciones, terrarios, habitantes y todas las fotografías en un único archivo.</p>
    <div class="antelmo-backup-status"><b>Última copia externa</b><span>${esc(last+count)}</span></div>
    <div class="v7328-backup-actions">
      <button type="button" class="button" id="antelmoPrepareICloud">☁️ Preparar para iCloud</button>
      <button type="button" class="button secondary" id="antelmoDownloadBackup">⬇︎ Descargar archivo</button>
      <label class="button secondary antelmo-restore-label">⬆︎ Restaurar<input id="antelmoFullRestore" type="file" accept="application/json,.json" hidden></label>
    </div>
    <div class="v7328-icloud-ready" id="antelmoICloudReady" ${antelmoV7328PreparedBackup?'':'hidden'}>
      <div><b>Copia preparada</b><small id="antelmoICloudFileName">${esc(antelmoV7328PreparedBackup?.name||'')}</small></div>
      <button type="button" class="button" id="antelmoShareICloud">Abrir Archivos / iCloud Drive</button>
    </div>
    <small class="sub">En iPhone son dos toques: prepara la copia y después abre el selector del sistema para elegir “Guardar en Archivos” e iCloud Drive. “Descargar archivo” queda como alternativa.</small>
  </section>`;
};

antelmoV7327BindSecurity=function(){
  const shieldBackup=document.querySelector('[data-v7326-security] [data-v7326-backup]');
  const prepare=document.querySelector('#antelmoPrepareICloud');
  const share=document.querySelector('#antelmoShareICloud');
  const download=document.querySelector('#antelmoDownloadBackup');
  const restore=document.querySelector('#antelmoFullRestore');
  if(shieldBackup){
    shieldBackup.removeAttribute('data-v7326-backup');
    shieldBackup.dataset.v7328PrepareShield='true';
    shieldBackup.textContent='☁️ Preparar copia para iCloud';
    shieldBackup.onclick=antelmoV7328PrepareFromShield;
  }
  if(prepare)prepare.onclick=antelmoV7328PrepareICloud;
  if(share)share.onclick=antelmoV7328ShareICloud;
  if(download)download.onclick=antelmoV7328DownloadBackup;
  if(restore)restore.onchange=event=>{
    const file=event.target.files?.[0];
    if(file)antelmoV7327Import(file);
    event.target.value='';
  };
  antelmoV7328UpdateBackupReady();
  requestAnimationFrame(antelmoV7326HydrateSecurity);
};

const antelmoV7328BaseBuildBackup=antelmoV7323BuildBackup;
antelmoV7323BuildBackup=async function(){
  const backup=await antelmoV7328BaseBuildBackup();
  backup.appVersion=ANTELMO_V7328_VERSION;
  return backup;
};

document.addEventListener('click',event=>{
  const security=event.target.closest('[data-v7328-open-security]');
  if(security){
    event.preventDefault();
    event.stopImmediatePropagation();
    route='more';
    selected=null;
    db.appConfig.moreTab='security';
    save();
    render();
    return;
  }
  const home=event.target.closest('[data-v7328-home-colonies]');
  if(home){
    event.preventDefault();
    event.stopImmediatePropagation();
    const cfg=antelmoV7328Config();
    cfg.homeColoniesCollapsed=!cfg.homeColoniesCollapsed;
    save();
    render();
    return;
  }
  const detail=event.target.closest('[data-v7328-colony-toggle]');
  if(detail&&route==='colonies'&&selected){
    event.preventDefault();
    event.stopImmediatePropagation();
    antelmoV7328ToggleDetail(detail.dataset.v7328ColonyToggle);
    save();
    render();
    return;
  }
  const collection=event.target.closest('[data-v7328-create-collection]');
  if(collection){
    event.preventDefault();
    event.stopImmediatePropagation();
    antelmoV7328CreateCollection(collection);
  }
},true);

function antelmoV7328VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.28';
}

const antelmoV7328BaseRender=render;
render=function(){
  antelmoV7328Config();
  antelmoV7328BaseRender();
  antelmoV7328EnhanceHome();
  antelmoV7328EnhanceData();
  antelmoV7328EnhanceColony();
  antelmoV7328VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7328-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7328-styles';
  style.textContent=`
  .workbench-section-title>.v7328-collapse-toggle{margin-left:6px;flex:none}
  .documentary-cover{position:relative;padding-right:60px}
  .documentary-cover>.v7328-collapse-toggle{position:absolute;top:14px;right:14px;border-color:#ffffff35;background:#ffffff14;color:#fff}
  .documentary.v7328-is-collapsed .documentary-cover{border-radius:25px}
  .v7328-cycle{position:relative;padding-right:58px}
  .v7328-cycle>.v7328-collapse-toggle{position:absolute;top:12px;right:12px}
  .v7328-cycle.v7328-is-collapsed>div p,
  .v7328-cycle.v7328-is-collapsed>[data-archive-colony],
  .v7328-cycle.v7328-is-collapsed>[data-restore-colony]{display:none}
  .v7328-cycle.v7328-is-collapsed{min-height:58px;align-items:center}
  .v7328-collection-create{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;margin-top:-4px;padding:10px;border:1px dashed var(--line);border-radius:15px;background:var(--surface2)}
  .v7328-collection-create input{min-width:0;width:100%;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);padding:10px}
  .v7328-collection-create button{white-space:nowrap}
  .v7328-collection-create small{grid-column:1/-1;color:var(--muted)}
  .dex-facts{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dex-facts>span:last-child{grid-column:1/-1}
  body.dark #app[data-antelmo-view="records"] .section-title p{color:#d7e5de!important}
  body.dark #app[data-antelmo-view="records"] .life-copy p{color:#e7f0eb!important}
  body.dark #app[data-antelmo-view="records"] .life-meta,
  body.dark #app[data-antelmo-view="records"] .life-meta time{color:#c8d8d0!important}
  .v7328-backup-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .v7328-backup-actions .antelmo-restore-label{grid-column:1/-1;text-align:center}
  .v7328-icloud-ready{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:11px;border:1px solid color-mix(in srgb,var(--green2) 45%,var(--line));border-radius:15px;background:color-mix(in srgb,var(--green2) 8%,var(--surface))}
  .v7328-icloud-ready[hidden]{display:none}
  .v7328-icloud-ready b,.v7328-icloud-ready small{display:block}
  .v7328-icloud-ready small{margin-top:2px;color:var(--muted);overflow-wrap:anywhere}
  @media(max-width:520px){
    .v7328-collection-create,.v7328-backup-actions{grid-template-columns:1fr}
    .v7328-collection-create small,.v7328-backup-actions .antelmo-restore-label{grid-column:1}
    .v7328-icloud-ready{align-items:stretch;flex-direction:column}
  }
  `;
  document.head.appendChild(style);
})();
