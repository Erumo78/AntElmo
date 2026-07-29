/* ANTELMO V7.3.30 — visor navegable para fotografías de colonias. */

const ANTELMO_V7330_VERSION='7.3.30';
let antelmoV7330ObjectUrl=null;

function antelmoV7330ReleaseUrl(){
  if(!antelmoV7330ObjectUrl)return;
  try{URL.revokeObjectURL(antelmoV7330ObjectUrl)}catch{}
  antelmoV7330ObjectUrl=null;
}

async function antelmoV7330OpenColonyPhoto(colonyId,photoId){
  const photos=await photosByColony(colonyId);
  const index=photos.findIndex(photo=>String(photo.id)===String(photoId));
  if(index<0||!photos[index]?.blob){toast('No se pudo abrir la fotografía');return;}
  const photo=photos[index];
  antelmoV7330ReleaseUrl();
  const url=URL.createObjectURL(photo.blob);
  antelmoV7330ObjectUrl=url;
  const multiple=photos.length>1;
  openModal(`<div class="photo-viewer v7330-colony-viewer" data-v7330-colony="${esc(colonyId)}" data-v7330-photo="${esc(photo.id)}">
    <div class="v7330-photo-stage">
      <button type="button" class="v7330-photo-nav prev" data-v7330-step="-1" aria-label="Fotografía anterior" ${multiple?'':'hidden'}>‹</button>
      <img src="${url}" alt="${esc(photo.caption||'Fotografía de la colonia')}">
      <button type="button" class="v7330-photo-nav next" data-v7330-step="1" aria-label="Fotografía siguiente" ${multiple?'':'hidden'}>›</button>
    </div>
    <div class="photo-viewer-info">
      <div class="v7330-photo-counter">${index+1} / ${photos.length}</div>
      <h2>${esc(photo.caption||'Sin descripción')}</h2>
      <p>${esc(photo.date?toDisplayDate(photo.date):'Sin fecha')}${photo.cover?' · ⭐ Portada':''}</p>
    </div>
  </div>`);
  const viewer=document.querySelector('[data-v7330-colony]');
  if(!viewer)return;
  let startX=null;
  viewer.addEventListener('touchstart',event=>{startX=event.touches?.[0]?.clientX??null},{passive:true});
  viewer.addEventListener('touchend',event=>{
    if(startX==null)return;
    const endX=event.changedTouches?.[0]?.clientX??startX;
    const delta=endX-startX;
    startX=null;
    if(Math.abs(delta)<45)return;
    antelmoV7330MoveColonyPhoto(colonyId,photo.id,delta<0?1:-1);
  },{passive:true});
}

async function antelmoV7330MoveColonyPhoto(colonyId,photoId,step){
  const photos=await photosByColony(colonyId);
  if(photos.length<2)return;
  const index=photos.findIndex(photo=>String(photo.id)===String(photoId));
  if(index<0)return;
  const next=(index+step+photos.length)%photos.length;
  await antelmoV7330OpenColonyPhoto(colonyId,photos[next].id);
}

const antelmoV7330BaseLoadGallery=loadGallery;
loadGallery=async function(id){
  await antelmoV7330BaseLoadGallery(id);
  const gallery=document.querySelector('#gallery');
  if(!gallery)return;
  const photos=await photosByColony(id);
  const cards=[...gallery.querySelectorAll('.photo')];
  cards.forEach((card,index)=>{
    const photo=photos[index];
    const image=card.querySelector('img');
    if(!photo||!image)return;
    image.dataset.v7330ColonyPhoto=photo.id;
    image.dataset.v7330Colony=id;
    image.setAttribute('role','button');
    image.setAttribute('tabindex','0');
    image.setAttribute('aria-label',`Abrir fotografía ${index+1} de ${photos.length}`);
  });
};

document.addEventListener('click',event=>{
  const image=event.target.closest('[data-v7330-colony-photo]');
  if(image){
    event.preventDefault();
    event.stopImmediatePropagation();
    antelmoV7330OpenColonyPhoto(image.dataset.v7330Colony,image.dataset.v7330ColonyPhoto);
    return;
  }
  const nav=event.target.closest('[data-v7330-step]');
  const viewer=nav?.closest('[data-v7330-colony]');
  if(nav&&viewer){
    event.preventDefault();
    event.stopImmediatePropagation();
    antelmoV7330MoveColonyPhoto(viewer.dataset.v7330Colony,viewer.dataset.v7330Photo,Number(nav.dataset.v7330Step)||1);
  }
},true);

document.addEventListener('keydown',event=>{
  const image=event.target.closest?.('[data-v7330-colony-photo]');
  if(image&&(event.key==='Enter'||event.key===' ')){
    event.preventDefault();
    antelmoV7330OpenColonyPhoto(image.dataset.v7330Colony,image.dataset.v7330ColonyPhoto);
    return;
  }
  const viewer=document.querySelector('[data-v7330-colony]');
  if(!viewer)return;
  if(event.key==='ArrowLeft')antelmoV7330MoveColonyPhoto(viewer.dataset.v7330Colony,viewer.dataset.v7330Photo,-1);
  if(event.key==='ArrowRight')antelmoV7330MoveColonyPhoto(viewer.dataset.v7330Colony,viewer.dataset.v7330Photo,1);
});

const antelmoV7330BaseCloseModal=closeModal;
closeModal=function(){
  antelmoV7330ReleaseUrl();
  antelmoV7330BaseCloseModal();
};

function antelmoV7330VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.30';
}

const antelmoV7330BaseRender=render;
render=function(){
  antelmoV7330BaseRender();
  antelmoV7330VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7330-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7330-styles';
  style.textContent=`
    #gallery .photo img[data-v7330-colony-photo]{cursor:zoom-in}
    .v7330-photo-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:240px}
    .v7330-photo-stage img{display:block;max-width:100%;max-height:64vh;margin:0 auto;border-radius:16px;object-fit:contain;touch-action:pan-y}
    .v7330-photo-nav{position:absolute;top:50%;z-index:2;width:42px;height:42px;transform:translateY(-50%);border:0;border-radius:50%;background:rgba(18,63,50,.82);color:white;font-size:31px;line-height:1;display:grid;place-items:center}
    .v7330-photo-nav.prev{left:8px}.v7330-photo-nav.next{right:8px}
    .v7330-photo-counter{margin-top:8px;font-size:11px;font-weight:800;opacity:.72;text-align:center}
  `;
  document.head.appendChild(style);
})();