/* ANTELMO V7.3.31 — visor fotográfico unificado en Colonias y Laboratorio visual. */

const ANTELMO_V7331_VERSION='7.3.31';
let antelmoV7331ViewerState=null;
let antelmoV7331ViewerUrl=null;

function antelmoV7331ReleaseUrl(){
  if(!antelmoV7331ViewerUrl)return;
  try{URL.revokeObjectURL(antelmoV7331ViewerUrl)}catch{}
  antelmoV7331ViewerUrl=null;
}

async function antelmoV7331DeleteColonyPhoto(photoId,colonyId){
  if(!confirm('¿Eliminar esta fotografía?'))return;
  await photoDelete(photoId);
  closeModal();
  toast('Fotografía eliminada');
  await loadGallery(colonyId);
  await loadCovers();
}

async function antelmoV7331Show(colonyId,photoId){
  const photos=await photosByColony(colonyId);
  const index=photos.findIndex(photo=>String(photo.id)===String(photoId));
  if(index<0||!photos[index]?.blob){toast('No se pudo abrir la fotografía');return;}

  const photo=photos[index];
  antelmoV7331ViewerState={colonyId:String(colonyId),photoId:String(photo.id)};
  antelmoV7331ReleaseUrl();
  const url=URL.createObjectURL(photo.blob);
  antelmoV7331ViewerUrl=url;

  openModal(`<div class="photo-viewer v7331-photo-viewer" data-v7331-viewer>
    <div class="v7331-stage">
      <button type="button" class="v7331-nav prev" data-v7331-prev aria-label="Foto anterior" ${photos.length<2?'hidden':''}>‹</button>
      <img src="${url}" alt="${esc(photo.caption||'Fotografía')}">
      <button type="button" class="v7331-nav next" data-v7331-next aria-label="Foto siguiente" ${photos.length<2?'hidden':''}>›</button>
    </div>
    <div class="v7331-pager">
      <button type="button" class="button secondary" data-v7331-prev ${photos.length<2?'disabled':''}>‹ Anterior</button>
      <b>${index+1} de ${photos.length}</b>
      <button type="button" class="button secondary" data-v7331-next ${photos.length<2?'disabled':''}>Siguiente ›</button>
    </div>
    <div class="photo-viewer-info">
      <h2>${esc(photo.caption||'Sin descripción')}</h2>
      <p>${esc(photo.date?toDisplayDate(photo.date):'Sin fecha')}${photo.cover?' · ⭐ Portada':''}</p>
      <div class="actions v7331-actions">
        <button type="button" class="button secondary" data-v7331-cover>⭐ Portada</button>
        <button type="button" class="button secondary" data-v7331-edit>Editar</button>
        <button type="button" class="button danger" data-v7331-delete>🗑 Borrar</button>
      </div>
    </div>
  </div>`);

  const viewer=document.querySelector('[data-v7331-viewer]');
  let startX=null;
  viewer?.addEventListener('touchstart',event=>{startX=event.touches?.[0]?.clientX??null},{passive:true});
  viewer?.addEventListener('touchend',event=>{
    if(startX==null)return;
    const endX=event.changedTouches?.[0]?.clientX??startX;
    const delta=endX-startX;
    startX=null;
    if(Math.abs(delta)<45)return;
    antelmoV7331Move(delta<0?1:-1);
  },{passive:true});
}

async function antelmoV7331Move(step){
  const state=antelmoV7331ViewerState;
  if(!state)return;
  const photos=await photosByColony(state.colonyId);
  if(photos.length<2)return;
  const index=photos.findIndex(photo=>String(photo.id)===String(state.photoId));
  if(index<0)return;
  const next=(index+step+photos.length)%photos.length;
  await antelmoV7331Show(state.colonyId,photos[next].id);
}

/* Sustituye el visor antiguo que también usa Laboratorio visual. */
viewPhoto=function(photo,url,colonyId){
  try{if(url?.startsWith?.('blob:'))URL.revokeObjectURL(url)}catch{}
  antelmoV7331Show(colonyId,photo.id);
};

/* Fuerza el álbum de colonia a abrir siempre el visor unificado. */
loadGallery=async function(id){
  const el=document.querySelector('#gallery');
  if(!el)return;
  const ps=await photosByColony(id);
  el.innerHTML=ps.map(p=>{
    const url=URL.createObjectURL(p.blob);
    return `<article class="photo-card ${p.cover?'is-cover':''}">
      <button type="button" class="photo-open" data-v7331-open-photo="${esc(p.id)}" data-v7331-colony="${esc(id)}" aria-label="Ver fotografía"><img src="${url}" alt="${esc(p.caption||'Fotografía')}"></button>
      <div class="photo-meta"><div><b>${esc(p.caption||'Sin descripción')}</b><span>${esc(toDisplayDate(p.date||'Sin fecha'))}</span></div>${p.cover?'<span class="cover-badge">⭐ Portada</span>':''}</div>
      <div class="photo-actions"><button type="button" data-cover-photo="${esc(p.id)}" aria-label="Usar como portada">⭐</button><button type="button" data-edit-photo="${esc(p.id)}" aria-label="Editar">✎</button><button type="button" class="danger-icon" data-del-photo="${esc(p.id)}" aria-label="Eliminar">🗑</button></div>
    </article>`;
  }).join('')||'<div class="empty gallery-empty"><b>Tu álbum está vacío</b><span>Añade fotos antiguas desde Fototeca o haz una nueva.</span></div>';

  el.querySelectorAll('[data-cover-photo]').forEach(button=>button.onclick=()=>setPhotoCover(button.dataset.coverPhoto,id));
  el.querySelectorAll('[data-edit-photo]').forEach(button=>button.onclick=()=>editPhoto(button.dataset.editPhoto,id));
  el.querySelectorAll('[data-del-photo]').forEach(button=>button.onclick=()=>antelmoV7331DeleteColonyPhoto(button.dataset.delPhoto,id));
};

document.addEventListener('click',event=>{
  const open=event.target.closest('[data-v7331-open-photo]');
  if(open){
    event.preventDefault();
    event.stopImmediatePropagation();
    antelmoV7331Show(open.dataset.v7331Colony,open.dataset.v7331OpenPhoto);
    return;
  }
  if(event.target.closest('[data-v7331-prev]')){event.preventDefault();event.stopImmediatePropagation();antelmoV7331Move(-1);return;}
  if(event.target.closest('[data-v7331-next]')){event.preventDefault();event.stopImmediatePropagation();antelmoV7331Move(1);return;}
  if(event.target.closest('[data-v7331-cover]')){const s=antelmoV7331ViewerState;if(s)setPhotoCover(s.photoId,s.colonyId).then(()=>antelmoV7331Show(s.colonyId,s.photoId));return;}
  if(event.target.closest('[data-v7331-edit]')){const s=antelmoV7331ViewerState;if(s)editPhoto(s.photoId,s.colonyId);return;}
  if(event.target.closest('[data-v7331-delete]')){const s=antelmoV7331ViewerState;if(s)antelmoV7331DeleteColonyPhoto(s.photoId,s.colonyId);return;}
},true);

document.addEventListener('keydown',event=>{
  if(!document.querySelector('[data-v7331-viewer]'))return;
  if(event.key==='ArrowLeft')antelmoV7331Move(-1);
  if(event.key==='ArrowRight')antelmoV7331Move(1);
});

const antelmoV7331BaseCloseModal=closeModal;
closeModal=function(){
  antelmoV7331ReleaseUrl();
  antelmoV7331ViewerState=null;
  antelmoV7331BaseCloseModal();
};

function antelmoV7331VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.31';
}

const antelmoV7331BaseRender=render;
render=function(){
  antelmoV7331BaseRender();
  antelmoV7331VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7331-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7331-styles';
  style.textContent=`
    .v7331-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:230px}
    .v7331-stage img{display:block;max-width:100%;max-height:62vh;margin:0 auto;border-radius:16px;object-fit:contain;touch-action:pan-y}
    .v7331-nav{position:absolute;top:50%;z-index:3;width:44px;height:44px;transform:translateY(-50%);border:0;border-radius:50%;background:rgba(18,63,50,.88);color:#fff;font-size:32px;display:grid;place-items:center}
    .v7331-nav.prev{left:8px}.v7331-nav.next{right:8px}
    .v7331-pager{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:12px 0}
    .v7331-pager b{text-align:center;white-space:nowrap}
    .v7331-pager .button{min-width:0;padding:10px 12px}
    .v7331-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .v7331-actions .button{min-width:0;padding:11px 8px}
    @media(max-width:390px){.v7331-pager{gap:6px}.v7331-pager .button{font-size:11px}.v7331-actions .button{font-size:11px}}
  `;
  document.head.appendChild(style);
})();