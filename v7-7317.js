/* ANTELMO V7.3.17 — visor, portadas y borrado de fotos en Terrarios. */

function antelmoV7317Meta(id){return (db.mediaIndex||[]).find(x=>String(x.id)===String(id));}

async function antelmoV7317SetCover(id){
  const meta=antelmoV7317Meta(id);if(!meta)return;
  (db.mediaIndex||[]).filter(x=>x.ownerType===meta.ownerType&&String(x.ownerId)===String(meta.ownerId)).forEach(x=>x.ownerCover=false);
  meta.ownerCover=true;save();toast('Foto de portada actualizada');closeModal();render();
}

async function antelmoV7317DeletePhoto(id){
  const meta=antelmoV7317Meta(id);if(!meta)return;
  if(!confirm('¿Eliminar esta fotografía?'))return;
  await photoDelete(id);
  db.mediaIndex=(db.mediaIndex||[]).filter(x=>String(x.id)!==String(id));
  if(meta.ownerCover){
    const fallback=antelmoV7315Media(meta.ownerType,meta.ownerId)[0];
    if(fallback)fallback.ownerCover=true;
  }
  save();closeModal();toast('Fotografía eliminada');render();
}

async function antelmoV7317OpenPhoto(id){
  const meta=antelmoV7317Meta(id),photo=await photoGet(id);if(!meta||!photo?.blob)return;
  const url=URL.createObjectURL(photo.blob);
  openModal(`<div class="v7317-viewer"><img src="${url}" alt="${esc(photo.caption||'Fotografía')}"><div class="v7317-viewer-copy"><h2>${esc(photo.caption||'Fotografía')}</h2><p>${esc(toDisplayDate(meta.date||photo.date||''))}${meta.ownerCover?' · ⭐ Portada':''}</p><div class="actions"><button class="button secondary" data-v7317-cover="${esc(id)}">⭐ Usar de portada</button><button class="button danger" data-v7317-delete="${esc(id)}">🗑 Borrar</button></div></div></div>`);
}

const antelmoV7317Gallery=antelmoV7315Gallery;
antelmoV7315Gallery=function(ownerType,ownerId){
  const media=antelmoV7315Media(ownerType,ownerId);
  return `<div class="v7315-gallery">${media.map(x=>`<article class="v7315-photo ${x.ownerCover?'is-cover':''}"><button type="button" class="v7317-photo-open" data-v7317-open="${esc(x.id)}"><div data-v7315-media-id="${esc(x.id)}"><span>📷</span></div></button><small>${esc(toDisplayDate(x.date||''))}</small><b>${esc(x.caption||'Fotografía')}</b><div class="v7317-photo-actions"><button type="button" data-v7317-cover="${esc(x.id)}" aria-label="Usar como portada">⭐</button><button type="button" data-v7317-delete="${esc(x.id)}" aria-label="Borrar fotografía">🗑</button></div>${x.ownerCover?'<i>⭐ Portada</i>':''}</article>`).join('')||'<div class="empty">Aún no hay fotografías.</div>'}</div>`;
};

document.addEventListener('click',async e=>{
  const open=e.target.closest('[data-v7317-open]');if(open){e.preventDefault();e.stopImmediatePropagation();await antelmoV7317OpenPhoto(open.dataset.v7317Open);return;}
  const cover=e.target.closest('[data-v7317-cover]');if(cover){e.preventDefault();e.stopImmediatePropagation();await antelmoV7317SetCover(cover.dataset.v7317Cover);return;}
  const del=e.target.closest('[data-v7317-delete]');if(del){e.preventDefault();e.stopImmediatePropagation();await antelmoV7317DeletePhoto(del.dataset.v7317Delete);return;}
},true);

(function(){
  if(document.querySelector('#antelmo-v7317-styles'))return;
  const style=document.createElement('style');style.id='antelmo-v7317-styles';style.textContent=`
  .v7317-photo-open{display:block;width:100%;padding:0;border:0;background:transparent;cursor:pointer}
  .v7317-photo-open>div{aspect-ratio:1.25/1;overflow:hidden;border-radius:12px;background:var(--surface2);display:grid;place-items:center}
  .v7317-photo-open img{width:100%;height:100%;object-fit:cover}
  .v7317-photo-actions{display:flex;gap:6px;margin-top:6px}
  .v7317-photo-actions button{width:34px;height:30px;border:1px solid var(--line);border-radius:9px;background:var(--surface2);color:var(--text);cursor:pointer}
  .v7315-photo.is-cover{outline:2px solid var(--green);outline-offset:2px}
  .v7317-viewer img{display:block;width:100%;max-height:62vh;object-fit:contain;border-radius:16px;background:#000}
  .v7317-viewer-copy{padding-top:12px}.v7317-viewer-copy h2{margin:0 0 4px}.v7317-viewer-copy p{margin:0 0 12px;color:var(--muted)}
  `;document.head.appendChild(style);
})();
