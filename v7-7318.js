/* ANTELMO V7.3.18 — acciones directas y verificables en fotos de Terrarios. */

function antelmoV7318Meta(id){return (db.mediaIndex||[]).find(x=>String(x.id)===String(id));}

async function antelmoV7318SetCover(id){
  const meta=antelmoV7318Meta(id);if(!meta)return;
  (db.mediaIndex||[]).filter(x=>x.ownerType===meta.ownerType&&String(x.ownerId)===String(meta.ownerId)).forEach(x=>x.ownerCover=false);
  meta.ownerCover=true;save();closeModal();toast('Portada actualizada');render();
}

async function antelmoV7318Delete(id){
  const meta=antelmoV7318Meta(id);if(!meta||!confirm('¿Eliminar esta fotografía?'))return;
  const wasCover=Boolean(meta.ownerCover),ownerType=meta.ownerType,ownerId=meta.ownerId;
  await photoDelete(id);
  db.mediaIndex=(db.mediaIndex||[]).filter(x=>String(x.id)!==String(id));
  if(wasCover){const fallback=antelmoV7315Media(ownerType,ownerId)[0];if(fallback)fallback.ownerCover=true;}
  save();closeModal();toast('Fotografía eliminada');render();
}

async function antelmoV7318Open(id){
  const meta=antelmoV7318Meta(id),photo=await photoGet(id);if(!meta||!photo?.blob){toast('No se pudo abrir la fotografía');return;}
  const url=URL.createObjectURL(photo.blob);
  openModal(`<div class="v7318-viewer"><img src="${url}" alt="${esc(photo.caption||'Fotografía')}"><div><h2>${esc(photo.caption||'Fotografía')}</h2><p>${esc(toDisplayDate(meta.date||photo.date||''))}${meta.ownerCover?' · ⭐ Portada':''}</p><div class="actions"><button type="button" class="button secondary" id="v7318Cover">⭐ Usar de portada</button><button type="button" class="button danger" id="v7318Delete">🗑 Borrar</button></div></div></div>`);
  const cover=document.querySelector('#v7318Cover'),del=document.querySelector('#v7318Delete');
  if(cover)cover.onclick=()=>antelmoV7318SetCover(id);
  if(del)del.onclick=()=>antelmoV7318Delete(id);
}

antelmoV7315Gallery=function(ownerType,ownerId){
  const media=antelmoV7315Media(ownerType,ownerId);
  return `<div class="v7315-gallery">${media.map(x=>`<article class="v7315-photo ${x.ownerCover?'is-cover':''}" data-v7318-photo="${esc(x.id)}"><button type="button" class="v7318-photo-open" data-v7318-open="${esc(x.id)}"><div data-v7315-media-id="${esc(x.id)}"><span>📷</span></div></button><small>${esc(toDisplayDate(x.date||''))}</small><b>${esc(x.caption||'Fotografía')}</b><div class="v7318-photo-actions"><button type="button" data-v7318-cover="${esc(x.id)}" aria-label="Usar como portada">⭐</button><button type="button" data-v7318-delete="${esc(x.id)}" aria-label="Borrar fotografía">🗑</button></div>${x.ownerCover?'<i>⭐ Portada</i>':''}</article>`).join('')||'<div class="empty">Aún no hay fotografías.</div>'}</div>`;
};

function antelmoV7318BindPhotos(){
  if(route!=='more'||db.appConfig?.moreTab!=='fauna')return;
  document.querySelectorAll('[data-v7318-open]').forEach(button=>button.onclick=async e=>{e.preventDefault();e.stopPropagation();await antelmoV7318Open(button.dataset.v7318Open);});
  document.querySelectorAll('[data-v7318-cover]').forEach(button=>button.onclick=async e=>{e.preventDefault();e.stopPropagation();await antelmoV7318SetCover(button.dataset.v7318Cover);});
  document.querySelectorAll('[data-v7318-delete]').forEach(button=>button.onclick=async e=>{e.preventDefault();e.stopPropagation();await antelmoV7318Delete(button.dataset.v7318Delete);});
}

function antelmoV7318VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');if(eyebrow&&!eyebrow.textContent.includes('V7.3.18'))eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.18';
}

const antelmoV7318Render=render;
render=function(){antelmoV7318Render();antelmoV7318VersionBadge();if(route==='more'&&db.appConfig?.moreTab==='fauna')requestAnimationFrame(()=>requestAnimationFrame(antelmoV7318BindPhotos));};

(function(){if(document.querySelector('#antelmo-v7318-styles'))return;const style=document.createElement('style');style.id='antelmo-v7318-styles';style.textContent=`
.v7318-photo-open{display:block;width:100%;padding:0;border:0;background:transparent;cursor:pointer}.v7318-photo-open>div{aspect-ratio:1.25/1;overflow:hidden;border-radius:12px;background:var(--surface2);display:grid;place-items:center}.v7318-photo-open img{width:100%;height:100%;object-fit:cover}.v7318-photo-actions{display:flex;gap:6px;margin-top:7px}.v7318-photo-actions button{min-width:36px;height:32px;border:1px solid var(--line);border-radius:9px;background:var(--surface2);color:var(--text);cursor:pointer}.v7315-photo.is-cover{outline:2px solid var(--green);outline-offset:2px}.v7318-viewer img{display:block;width:100%;max-height:62vh;object-fit:contain;border-radius:16px;background:#000}.v7318-viewer>div{padding-top:12px}.v7318-viewer h2{margin:0 0 4px}.v7318-viewer p{margin:0 0 12px;color:var(--muted)}`;document.head.appendChild(style);})();
