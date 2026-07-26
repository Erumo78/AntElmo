/* ANTELMO V7.3.23 — copia de seguridad completa y restauración. */

const ANTELMO_BACKUP_FORMAT='ANTELMO_FULL_BACKUP';
const ANTELMO_BACKUP_VERSION=1;

function antelmoV7323DataUrlToBlob(dataUrl){
  return fetch(dataUrl).then(r=>r.blob());
}

async function antelmoV7323ClearPhotos(){
  if(!idb)return;
  await new Promise(resolve=>{
    try{
      const tx=idb.transaction('photos','readwrite');
      tx.objectStore('photos').clear();
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>resolve();
      tx.onabort=()=>resolve();
    }catch{resolve();}
  });
}

function antelmoV7323StorageSnapshot(){
  const out={};
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key&&key.startsWith('antelmo.'))out[key]=localStorage.getItem(key);
    }
  }catch{}
  return out;
}

async function antelmoV7323BuildBackup(){
  const photos=await photoAll();
  const media=[];
  for(const p of photos){
    if(!p?.blob)continue;
    media.push({
      ...p,
      blob:undefined,
      dataUrl:await blobToDataURL(p.blob),
      mime:p.blob.type||p.type||'image/jpeg'
    });
  }
  return {
    format:ANTELMO_BACKUP_FORMAT,
    backupVersion:ANTELMO_BACKUP_VERSION,
    appVersion:'7.3.23',
    exportedAt:new Date().toISOString(),
    database:JSON.parse(JSON.stringify(db)),
    localStorage:antelmoV7323StorageSnapshot(),
    media
  };
}

async function antelmoV7323Export(){
  try{
    toast('Preparando copia…');
    const backup=await antelmoV7323BuildBackup();
    db.appConfig ||= {};
    db.appConfig.backup ||= {};
    db.appConfig.backup.lastExportAt=backup.exportedAt;
    db.appConfig.backup.lastExportPhotos=backup.media.length;
    save();
    backup.database=JSON.parse(JSON.stringify(db));
    const json=JSON.stringify(backup);
    const blob=new Blob([json],{type:'application/json'});
    const name=`ANTELMO-COMPLETO-${today()}.json`;
    const file=new File([blob],name,{type:'application/json'});
    if(navigator.canShare?.({files:[file]})){
      await navigator.share({files:[file],title:'Copia completa de ANTELMO'});
    }else{
      const a=document.createElement('a');
      const url=URL.createObjectURL(blob);
      a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
    }
    toast(`Copia creada · ${backup.media.length} fotos`);
    render();
  }catch(err){
    if(err?.name==='AbortError'){toast('Copia cancelada');return;}
    console.error(err);alert('No se pudo crear la copia completa.');
  }
}

async function antelmoV7323Import(file){
  if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    let restoredDb,media=[];
    if(parsed?.format===ANTELMO_BACKUP_FORMAT&&parsed?.database){
      restoredDb=parsed.database;
      media=Array.isArray(parsed.media)?parsed.media:[];
    }else if(Array.isArray(parsed?.colonies)){
      /* Compatibilidad con las copias antiguas de ANTELMO. */
      restoredDb={...parsed};
      media=Array.isArray(restoredDb.mediaBackup)?restoredDb.mediaBackup:[];
      delete restoredDb.mediaBackup;
    }else throw new Error('Formato no reconocido');
    if(!Array.isArray(restoredDb.colonies))throw new Error('Base de datos inválida');
    const ok=confirm(`Restaurar esta copia sustituirá los datos actuales.\n\nColonias: ${restoredDb.colonies.length}\nFotografías: ${media.length}\n\n¿Continuar?`);
    if(!ok)return;
    toast('Restaurando copia…');
    await antelmoV7323ClearPhotos();
    for(const p of media){
      if(!p?.dataUrl)continue;
      const blob=await antelmoV7323DataUrlToBlob(p.dataUrl);
      const clean={...p,blob};delete clean.dataUrl;delete clean.mime;
      await photoPut(clean);
    }
    db=restoredDb;
    db.appConfig ||= {};
    db.appConfig.backup ||= {};
    db.appConfig.backup.lastRestoreAt=new Date().toISOString();
    save();
    selected=null;route='home';
    toast(`Copia restaurada · ${media.length} fotos`);
    render();
  }catch(err){
    console.error(err);alert('La copia no es válida o no se pudo restaurar.');
  }
}

/* Sustituye las rutinas antiguas para que cualquier botón existente use el sistema completo. */
exportBackup=antelmoV7323Export;
importBackup=antelmoV7323Import;

function antelmoV7323BackupPanel(){
  const info=db.appConfig?.backup||{};
  const last=info.lastExportAt?toDisplayDate(String(info.lastExportAt).slice(0,10)):'Nunca';
  const count=info.lastExportPhotos!=null?` · ${info.lastExportPhotos} fotos`:'';
  return `<section class="card antelmo-backup-card">
    <div class="antelmo-backup-head"><div><span class="eyebrow">SEGURIDAD</span><h2>💾 Copia completa</h2></div><span class="chip">V7.3.23</span></div>
    <p>Guarda colonias, diario, configuraciones, terrarios, habitantes y todas las fotografías en un único archivo.</p>
    <div class="antelmo-backup-status"><b>Última copia externa</b><span>${esc(last+count)}</span></div>
    <div class="actions">
      <button type="button" class="button" id="antelmoFullBackup">⬇︎ Crear copia</button>
      <label class="button secondary antelmo-restore-label">⬆︎ Restaurar<input id="antelmoFullRestore" type="file" accept="application/json,.json" hidden></label>
    </div>
    <small class="sub">Guarda el archivo en Archivos, iCloud Drive, Google Drive u otro lugar fuera de ANTELMO. Una copia guardada solo dentro de la app también se pierde si se elimina la PWA.</small>
  </section>`;
}

function antelmoV7323InstallPanel(){
  if(route!=='more')return;
  const app=document.querySelector('#app');if(!app||app.querySelector('.antelmo-backup-card'))return;
  const first=app.querySelector('.section-title');
  if(first)first.insertAdjacentHTML('afterend',antelmoV7323BackupPanel());
  else app.insertAdjacentHTML('afterbegin',antelmoV7323BackupPanel());
  const backup=document.querySelector('#antelmoFullBackup');
  const restore=document.querySelector('#antelmoFullRestore');
  if(backup)backup.onclick=antelmoV7323Export;
  if(restore)restore.onchange=e=>{const f=e.target.files?.[0];if(f)antelmoV7323Import(f);e.target.value='';};
}

function antelmoV7323VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.23';
}

const antelmoV7323Render=render;
render=function(){
  antelmoV7323Render();
  antelmoV7323VersionBadge();
  if(route==='more')requestAnimationFrame(antelmoV7323InstallPanel);
};

/* Copia interna de emergencia tras cambios. No sustituye una copia externa porque iOS puede borrarla al eliminar la PWA. */
let antelmoV7323SnapshotTimer=0;
const antelmoV7323Save=save;
save=function(){
  antelmoV7323Save();
  clearTimeout(antelmoV7323SnapshotTimer);
  antelmoV7323SnapshotTimer=setTimeout(()=>{
    try{localStorage.setItem('antelmo.safety.last',JSON.stringify({savedAt:new Date().toISOString(),database:db}));}catch{}
  },250);
};

(function(){
  if(document.querySelector('#antelmo-v7323-styles'))return;
  const style=document.createElement('style');style.id='antelmo-v7323-styles';style.textContent=`
  .antelmo-backup-card{margin:0 0 14px;padding:16px}.antelmo-backup-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.antelmo-backup-head h2{margin:3px 0 0}.antelmo-backup-card>p{margin:10px 0;color:var(--muted);line-height:1.45}.antelmo-backup-status{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:var(--surface2);margin:10px 0}.antelmo-backup-status span{color:var(--muted);text-align:right}.antelmo-restore-label{display:inline-flex;align-items:center;justify-content:center}.antelmo-backup-card small{display:block;margin-top:10px;line-height:1.4}
  `;document.head.appendChild(style);
})();
