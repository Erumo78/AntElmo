/* ANTELMO V7.3.24 — visor fotográfico robusto en terrarios/habitantes y copia fuera de fauna. */

async function antelmoV7324Photo(id){
  const photos=await photoAll();
  return photos.find(x=>String(x.id)===String(id))||null;
}

/* photoGet puede depender del tipo exacto de la clave de IndexedDB. Para fauna buscamos por ID normalizado. */
antelmoV7322View=async function(id){
  const meta=antelmoV7322Meta(id),p=await antelmoV7324Photo(id);
  if(!meta||!p?.blob){toast('No se pudo abrir la fotografía');return;}
  const url=URL.createObjectURL(p.blob);
  openModal(`<div class="photo-viewer v7324-photo-viewer"><img src="${url}" alt="${esc(meta.caption||p.caption||'Fotografía')}"><div class="photo-viewer-info"><h2>${esc(meta.caption||p.caption||'Sin descripción')}</h2><p>${esc(toDisplayDate(meta.date||p.date||'Sin fecha'))} ${meta.ownerCover?'· ⭐ Portada':''}</p><div class="actions"><button type="button" class="button secondary" data-v7322-cover="${esc(id)}">⭐ Portada</button><button type="button" class="button secondary" data-v7322-edit="${esc(id)}">Editar</button><button type="button" class="button danger" data-v7322-delete="${esc(id)}">🗑 Borrar</button></div></div></div>`);
  const modal=document.querySelector('#modal');
  const cleanup=()=>{try{URL.revokeObjectURL(url)}catch{}};
  modal?.addEventListener('transitionend',()=>{if(!modal.classList.contains('open'))cleanup()},{once:true});
};

/* Abrir también la fotografía de portada al tocar la imagen grande del terrario o habitante. */
document.addEventListener('click',async event=>{
  const cover=event.target.closest('[data-v7315-cover][data-v7315-owner-type]');
  if(!cover||event.target.closest('button'))return;
  const ownerType=cover.dataset.v7315OwnerType;
  const ownerId=cover.dataset.v7315Cover;
  const meta=(db.mediaIndex||[]).find(x=>x.ownerCover&&x.ownerType===ownerType&&String(x.ownerId)===String(ownerId));
  if(!meta)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  await antelmoV7322View(meta.id);
},true);

/* V7.3.23 insertaba la copia en cualquier pantalla con route=more, incluida fauna.
   En V7.3.24 solo se instala fuera del módulo Terrarios/Habitantes. */
antelmoV7323InstallPanel=function(){
  if(route!=='more'||db.appConfig?.moreTab==='fauna')return;
  const app=document.querySelector('#app');if(!app||app.querySelector('.antelmo-backup-card'))return;
  const first=app.querySelector('.section-title');
  if(first)first.insertAdjacentHTML('afterend',antelmoV7323BackupPanel());
  else app.insertAdjacentHTML('afterbegin',antelmoV7323BackupPanel());
  const backup=document.querySelector('#antelmoFullBackup');
  const restore=document.querySelector('#antelmoFullRestore');
  if(backup)backup.onclick=antelmoV7323Export;
  if(restore)restore.onchange=e=>{const f=e.target.files?.[0];if(f)antelmoV7323Import(f);e.target.value='';};
};

function antelmoV7324VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.24';
}

const antelmoV7324Render=render;
render=function(){
  antelmoV7324Render();
  antelmoV7324VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7324-styles'))return;
  const style=document.createElement('style');style.id='antelmo-v7324-styles';style.textContent=`
  [data-v7315-cover][data-v7315-owner-type]:has(img){cursor:zoom-in}
  .v7324-photo-viewer img{display:block;max-width:100%;max-height:62vh;margin:0 auto;border-radius:16px;object-fit:contain}
  `;document.head.appendChild(style);
})();
