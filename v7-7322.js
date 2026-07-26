/* ANTELMO V7.3.22 — Terrarios y habitantes usan el mismo modelo fotográfico que las colonias. */

function antelmoV7322Meta(id){
  return (db.mediaIndex||[]).find(x=>String(x.id)===String(id));
}

async function antelmoV7322Hydrate(){
  if(route!=='more'||db.appConfig?.moreTab!=='fauna')return;
  const photos=await photoAll();
  document.querySelectorAll('[data-v7322-photo]').forEach(img=>{
    const p=photos.find(x=>String(x.id)===String(img.dataset.v7322Photo));
    if(!p?.blob)return;
    const old=img.dataset.objectUrl;
    if(old)try{URL.revokeObjectURL(old)}catch{}
    const url=URL.createObjectURL(p.blob);
    img.src=url;
    img.dataset.objectUrl=url;
  });
}

async function antelmoV7322SetCover(id){
  const meta=antelmoV7322Meta(id);if(!meta)return;
  (db.mediaIndex||[])
    .filter(x=>x.ownerType===meta.ownerType&&String(x.ownerId)===String(meta.ownerId))
    .forEach(x=>x.ownerCover=false);
  meta.ownerCover=true;
  save();
  toast('Nueva portada elegida');
  closeModal();
  render();
}

async function antelmoV7322Edit(id){
  const meta=antelmoV7322Meta(id),p=await photoGet(id);if(!meta||!p)return;
  openModal(`<h2>Editar fotografía</h2><form id="v7322EditPhoto" class="form">${field('Fecha',`<input name="date" type="date" value="${esc(String(meta.date||p.date||today()).slice(0,10))}">`)}${field('Descripción',`<input name="caption" value="${esc(meta.caption||p.caption||'')}" placeholder="Qué muestra esta foto">`)}<button class="button">Guardar cambios</button></form>`);
  prepareDateInputs?.($('#modalBody'));
  $('#v7322EditPhoto').onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(e.target),date=toIsoDate(fd.get('date'))||today(),caption=String(fd.get('caption')||'');
    meta.date=date;meta.caption=caption;
    p.date=date;p.caption=caption;
    await photoPut(p);
    save();closeModal();toast('Fotografía actualizada');render();
  };
}

async function antelmoV7322Delete(id){
  const meta=antelmoV7322Meta(id);if(!meta||!confirm('¿Eliminar esta fotografía?'))return;
  const wasCover=Boolean(meta.ownerCover),ownerType=meta.ownerType,ownerId=meta.ownerId;
  await photoDelete(id);
  db.mediaIndex=(db.mediaIndex||[]).filter(x=>String(x.id)!==String(id));
  if(wasCover){
    const fallback=antelmoV7315Media(ownerType,ownerId)[0];
    if(fallback)fallback.ownerCover=true;
  }
  save();closeModal();toast('Fotografía eliminada');render();
}

async function antelmoV7322View(id){
  const meta=antelmoV7322Meta(id),p=await photoGet(id);
  if(!meta||!p?.blob){toast('No se pudo abrir la fotografía');return;}
  const url=URL.createObjectURL(p.blob);
  openModal(`<div class="photo-viewer"><img src="${url}" alt="${esc(meta.caption||p.caption||'Fotografía')}"><div class="photo-viewer-info"><h2>${esc(meta.caption||p.caption||'Sin descripción')}</h2><p>${esc(toDisplayDate(meta.date||p.date||'Sin fecha'))} ${meta.ownerCover?'· ⭐ Portada':''}</p><div class="actions"><button class="button secondary" data-v7322-cover="${esc(id)}">⭐ Portada</button><button class="button secondary" data-v7322-edit="${esc(id)}">Editar</button><button class="button danger" data-v7322-delete="${esc(id)}">🗑 Borrar</button></div></div></div>`);
}

/* Mismo marcado y clases visuales que el álbum de colonias. */
antelmoV7315Gallery=function(ownerType,ownerId){
  const media=antelmoV7315Media(ownerType,ownerId);
  return `<div class="gallery gallery-rich v7322-owner-gallery">${media.map(x=>`<article class="photo-card ${x.ownerCover?'is-cover':''}"><button class="photo-open" type="button" data-v7322-view="${esc(x.id)}" aria-label="Ver fotografía"><img data-v7322-photo="${esc(x.id)}" alt="${esc(x.caption||'Fotografía')}"></button><div class="photo-meta"><div><b>${esc(x.caption||'Sin descripción')}</b><span>${esc(toDisplayDate(x.date||'Sin fecha'))}</span></div>${x.ownerCover?'<span class="cover-badge">⭐ Portada</span>':''}</div><div class="photo-actions"><button type="button" data-v7322-cover="${esc(x.id)}" aria-label="Usar como portada">⭐</button><button type="button" data-v7322-edit="${esc(x.id)}" aria-label="Editar">✎</button><button type="button" class="danger-icon" data-v7322-delete="${esc(x.id)}" aria-label="Eliminar">🗑</button></div></article>`).join('')||'<div class="empty gallery-empty"><b>Tu álbum está vacío</b><span>Añade fotos desde Fototeca o haz una nueva.</span></div>'}</div>`;
};

/* Delegación única y estable: funciona aunque la galería se regenere. */
document.addEventListener('click',async event=>{
  const view=event.target.closest('[data-v7322-view]');
  if(view){event.preventDefault();event.stopImmediatePropagation();await antelmoV7322View(view.dataset.v7322View);return;}
  const cover=event.target.closest('[data-v7322-cover]');
  if(cover){event.preventDefault();event.stopImmediatePropagation();await antelmoV7322SetCover(cover.dataset.v7322Cover);return;}
  const edit=event.target.closest('[data-v7322-edit]');
  if(edit){event.preventDefault();event.stopImmediatePropagation();await antelmoV7322Edit(edit.dataset.v7322Edit);return;}
  const del=event.target.closest('[data-v7322-delete]');
  if(del){event.preventDefault();event.stopImmediatePropagation();await antelmoV7322Delete(del.dataset.v7322Delete);return;}
},true);

function antelmoV7322VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.22';
}

const antelmoV7322Render=render;
render=function(){
  antelmoV7322Render();
  antelmoV7322VersionBadge();
  requestAnimationFrame(()=>requestAnimationFrame(antelmoV7322Hydrate));
};
