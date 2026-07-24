/* ANTELMO V4.3 — AntDex y álbum fotográfico avanzado */
const antDexBaseSave = save;
save = function(){
  ensureProData?.();
  db.metadata={...(db.metadata||{}),schemaVersion:'4.3.0',updatedAt:new Date().toISOString()};
  localStorage.setItem('antelmo.v4',JSON.stringify(db));
};

colonyDetail = function(id){
  const c=db.colonies.find(x=>String(x.id)===String(id));
  if(!c)return colonies();
  const lf=lastFeeding(id);
  const growth=db.growthRecords.filter(x=>String(x.colonyId)===String(id)).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  const dexNo=String(db.colonies.findIndex(x=>String(x.id)===String(id))+1).padStart(3,'0');
  return `<button class="link-btn" data-back>‹ Volver a la AntDex</button>
  <section class="antdex-card">
    <div class="antdex-number">ANTDEX #${dexNo}</div>
    <div class="antdex-cover avatar" id="cover-${esc(c.id)}">🐜</div>
    <div class="antdex-info">
      <div class="antdex-top"><div><h2>${esc(c.name)}</h2><p class="latin">${esc(c.species||'Especie sin confirmar')}</p></div><button class="button secondary" data-edit-colony="${esc(c.id)}">Editar</button></div>
      <div class="type-chips"><span class="type-chip">🐜 ${esc(c.commonName||'Hormiga')}</span><span class="type-chip alt">${esc(c.status||'Sin estado')}</span></div>
      <p class="dex-description">${esc(c.notes||`${c.name} forma parte de tu colección ANTELMO. Añade notas para completar su ficha.`)}</p>
      <div class="dex-facts"><span><b>Fundada</b>${esc(toDisplayDate(c.founded||'—'))}</span><span><b>Origen</b>${esc(c.origin||'—')}</span><span><b>Hábitat</b>${esc(c.location||c.setup?.nestType||'—')}</span></div>
    </div>
  </section>
  <div class="metric-grid dex-metrics"><div class="card"><b class="big-number">${esc(c.workers??'—')}</b><div class="sub">obreras</div></div><div class="card"><b class="big-number">${esc(c.queens??'—')}</b><div class="sub">reinas</div></div><div class="card"><b class="big-number">${growth?.eggs??c.brood?.eggs??'—'}</b><div class="sub">huevos</div></div><div class="card"><b class="big-number">${growth?.larvae??c.brood?.larvae??'—'}</b><div class="sub">larvas</div></div></div>
  <div class="section-title"><div><h2>Cuidados</h2><p>Últimos datos registrados</p></div></div>
  <div class="cards"><div class="card"><b>🍯 Alimentación</b><div class="sub">${lf?`${esc(lf.food)} · ${esc(toDisplayDate(lf.date))}`:'Sin registros'}</div></div><div class="card"><b>🏠 Instalación</b><div class="sub">${esc(c.location||c.setup?.nestType||'Sin información')}</div></div></div>
  <div class="section-title"><div><h2>Álbum de evolución</h2><p>Haz fotos o elige varias de tu fototeca</p></div><button class="button secondary" data-photo-for="${esc(c.id)}">＋ Fotos</button></div>
  <div id="gallery" class="gallery gallery-rich"><div class="empty">Cargando…</div></div>`;
};

photoForm = function(id=''){
  openModal(`<h2>📸 Añadir al álbum</h2><p class="modal-intro">En iPhone puedes elegir <b>Fototeca</b>, <b>Hacer foto</b> o <b>Seleccionar archivos</b>. También puedes escoger varias imágenes.</p><form id="photoForm" class="form">${field('Colonia',`<select name="colonyId">${colonyOptions(id)}</select>`)}${field('Fecha',`<input name="date" type="date" value="${today()}">`)}${field('Fotos',`<input name="photo" type="file" accept="image/*" multiple required><small class="field-help">Puedes seleccionar varias fotos ya hechas.</small>`)}${field('Descripción común',`<input name="caption" placeholder="Llegada, cría, mudanza, instalación…">`)}<label class="check-row"><input name="cover" type="checkbox"> Usar la primera imagen como portada</label><button class="button">Guardar en el álbum</button></form>`);
  $('#photoForm').onsubmit=async e=>{
    e.preventDefault();
    const fd=new FormData(e.target),files=[...e.target.elements.photo.files];
    if(!files.length)return;
    const colonyId=fd.get('colonyId'),cover=fd.get('cover')==='on';
    if(cover)await clearCovers(colonyId);
    let i=0;
    for(const file of files){
      const blob=await optimizeImage(file);
      await photoPut({id:uid('photo'),colonyId,date:fd.get('date'),caption:fd.get('caption')||(files.length>1?`Foto ${i+1}`:''),cover:cover&&i===0,blob,createdAt:new Date().toISOString()});
      i++;
    }
    closeModal();toast(`${files.length} ${files.length===1?'fotografía guardada':'fotografías guardadas'}`);render();
  };
};

async function optimizeImage(file){
  if(!file.type.startsWith('image/'))return file;
  try{
    const bmp=await createImageBitmap(file),max=1800,scale=Math.min(1,max/Math.max(bmp.width,bmp.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.round(bmp.width*scale);canvas.height=Math.round(bmp.height*scale);
    canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);
    const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.86));
    bmp.close?.();return blob||file;
  }catch{return file}
}

async function setPhotoCover(id,colonyId){
  await clearCovers(colonyId);
  const p=(await photoAll()).find(x=>String(x.id)===String(id));
  if(p){p.cover=true;await photoPut(p);toast('Nueva portada elegida');await loadGallery(colonyId);await loadCovers();}
}

async function editPhoto(id,colonyId){
  const p=(await photoAll()).find(x=>String(x.id)===String(id));if(!p)return;
  openModal(`<h2>Editar fotografía</h2><form id="editPhotoForm" class="form">${field('Fecha',`<input name="date" type="date" value="${esc(p.date||today())}">`)}${field('Descripción',`<input name="caption" value="${esc(p.caption||'')}" placeholder="Qué muestra esta foto">`)}<button class="button">Guardar cambios</button></form>`);
  $('#editPhotoForm').onsubmit=async e=>{e.preventDefault();Object.assign(p,Object.fromEntries(new FormData(e.target)));await photoPut(p);closeModal();toast('Fotografía actualizada');loadGallery(colonyId)};
}

function viewPhoto(p,url,colonyId){
  openModal(`<div class="photo-viewer"><img src="${url}" alt="${esc(p.caption||'Fotografía')}"><div class="photo-viewer-info"><h2>${esc(p.caption||'Sin descripción')}</h2><p>${esc(toDisplayDate(p.date||'Sin fecha'))} ${p.cover?'· ⭐ Portada':''}</p><div class="actions"><button class="button secondary" data-view-cover="${esc(p.id)}">⭐ Portada</button><button class="button secondary" data-view-edit="${esc(p.id)}">Editar</button></div></div></div>`);
  $('[data-view-cover]').onclick=async()=>{await setPhotoCover(p.id,colonyId);closeModal()};
  $('[data-view-edit]').onclick=()=>editPhoto(p.id,colonyId);
}

loadGallery = async function(id){
  const el=$('#gallery');if(!el)return;
  const ps=await photosByColony(id);
  el.innerHTML=ps.map(p=>{const url=URL.createObjectURL(p.blob);return `<article class="photo-card ${p.cover?'is-cover':''}"><button class="photo-open" data-view-photo="${esc(p.id)}" aria-label="Ver fotografía"><img src="${url}" alt="${esc(p.caption||'Fotografía')}"></button><div class="photo-meta"><div><b>${esc(p.caption||'Sin descripción')}</b><span>${esc(toDisplayDate(p.date||'Sin fecha'))}</span></div>${p.cover?'<span class="cover-badge">⭐ Portada</span>':''}</div><div class="photo-actions"><button data-cover-photo="${esc(p.id)}" aria-label="Usar como portada">⭐</button><button data-edit-photo="${esc(p.id)}" aria-label="Editar">✎</button><button class="danger-icon" data-del-photo="${esc(p.id)}" aria-label="Eliminar">🗑</button></div></article>`}).join('')||'<div class="empty gallery-empty"><b>Tu álbum está vacío</b><span>Añade fotos antiguas desde Fototeca o haz una nueva.</span></div>';
  $$('[data-view-photo]').forEach(b=>b.onclick=async()=>{const p=ps.find(x=>String(x.id)===String(b.dataset.viewPhoto));if(p)viewPhoto(p,b.querySelector('img').src,id)});
  $$('[data-cover-photo]').forEach(b=>b.onclick=()=>setPhotoCover(b.dataset.coverPhoto,id));
  $$('[data-edit-photo]').forEach(b=>b.onclick=()=>editPhoto(b.dataset.editPhoto,id));
  $$('[data-del-photo]').forEach(b=>b.onclick=async()=>{if(confirm('¿Eliminar esta fotografía?')){await photoDelete(b.dataset.delPhoto);toast('Fotografía eliminada');loadGallery(id);loadCovers();}});
};
