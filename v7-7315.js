/* ANTELMO V7.3.15 — Terrarios visuales, fichas de habitantes y fotografías. */

function antelmoV7315Cfg(){
  db.appConfig ||= {};
  db.appConfig.v7315 ||= {selectedFaunaId:'',selectedTerrarium:''};
  return db.appConfig.v7315;
}

function antelmoV7315Arrival(item){return item.arrivedAt||item.arrivalDate||item.createdAt||'';}
function antelmoV7315AgeText(item){
  const raw=antelmoV7315Arrival(item);if(!raw)return 'Fecha de llegada sin indicar';
  const iso=String(raw).slice(0,10),days=daysSince(iso);if(days==null)return `Desde ${toDisplayDate(iso)}`;
  if(days===0)return `Desde ${toDisplayDate(iso)} · hoy`;
  if(days<31)return `Desde ${toDisplayDate(iso)} · ${days} días contigo`;
  const months=Math.floor(days/30.44);if(months<12)return `Desde ${toDisplayDate(iso)} · ${months} ${months===1?'mes':'meses'} contigo`;
  const years=Math.floor(months/12),rest=months%12;return `Desde ${toDisplayDate(iso)} · ${years} ${years===1?'año':'años'}${rest?` y ${rest} m`:''} contigo`;
}

function antelmoV7315Media(ownerType,ownerId){
  return (db.mediaIndex||[]).filter(x=>x.ownerType===ownerType&&String(x.ownerId)===String(ownerId)).sort((a,b)=>`${b.date||''}${b.createdAt||''}`.localeCompare(`${a.date||''}${a.createdAt||''}`));
}

async function antelmoV7315AddPhotos(ownerType,ownerId,label){
  openModal(`<h2>📷 Fotos de ${esc(label)}</h2><form id="v7315PhotoForm" class="form">${field('Fecha',`<input name="date" type="date" value="${today()}">`)}${field('Fotos',`<input name="photos" type="file" accept="image/*" multiple required>`)}${field('Descripción',`<input name="caption" placeholder="Evolución, alimentación, cambio de refugio…">`)}<label class="check-row"><input name="cover" type="checkbox"> Usar la primera como portada</label><button class="button">Guardar fotografías</button></form>`);
  prepareDateInputs?.($('#modalBody'));
  $('#v7315PhotoForm').onsubmit=async e=>{
    e.preventDefault();const form=e.target,fd=new FormData(form),files=[...form.elements.photos.files];if(!files.length)return;
    if(fd.get('cover')==='on')db.mediaIndex.filter(x=>x.ownerType===ownerType&&String(x.ownerId)===String(ownerId)).forEach(x=>x.ownerCover=false);
    let i=0;
    for(const file of files){
      const blob=await optimizeImage(file),photo={id:uid('terr-media'),colonyId:'',date:toIsoDate(fd.get('date'))||today(),caption:fd.get('caption')||(files.length>1?`Foto ${i+1}`:'Fotografía'),cover:false,blob,createdAt:new Date().toISOString()};
      await photoPut(photo);
      db.mediaIndex.push({id:String(photo.id),colonyId:'',date:photo.date,caption:photo.caption,type:blob.type||'image/jpeg',createdAt:photo.createdAt,ownerType,ownerId:String(ownerId),ownerCover:fd.get('cover')==='on'&&i===0});i++;
    }
    save();closeModal();toast(`${files.length} ${files.length===1?'foto guardada':'fotos guardadas'}`);render();
  };
}

async function antelmoV7315HydrateMedia(){
  const photos=await photoAll();
  $$('[data-v7315-media-id]').forEach(el=>{const p=photos.find(x=>String(x.id)===String(el.dataset.v7315MediaId));if(!p?.blob)return;const url=URL.createObjectURL(p.blob);el.innerHTML=`<img src="${url}" alt="${esc(p.caption||'Fotografía')}">`;});
  $$('[data-v7315-cover]').forEach(el=>{const meta=(db.mediaIndex||[]).find(x=>x.ownerCover&&x.ownerType===el.dataset.v7315OwnerType&&String(x.ownerId)===String(el.dataset.v7315Cover));if(!meta)return;const p=photos.find(x=>String(x.id)===String(meta.id));if(!p?.blob)return;el.innerHTML=`<img src="${URL.createObjectURL(p.blob)}" alt="Portada">`;});
}

function antelmoV7315Gallery(ownerType,ownerId){
  const media=antelmoV7315Media(ownerType,ownerId);
  return `<div class="v7315-gallery">${media.map(x=>`<article class="v7315-photo"><div data-v7315-media-id="${esc(x.id)}"><span>📷</span></div><small>${esc(toDisplayDate(x.date||''))}</small><b>${esc(x.caption||'Fotografía')}</b>${x.ownerCover?'<i>⭐ Portada</i>':''}</article>`).join('')||'<div class="empty">Aún no hay fotografías.</div>'}</div>`;
}

function antelmoV7315TerrariumNames(){return [...new Set(db.fauna.map(x=>String(x.habitat||'Terrario principal').trim()||'Terrario principal'))];}

function antelmoV7315TerrariumDetail(name){
  const inhabitants=db.fauna.filter(x=>String(x.habitat||'Terrario principal')===String(name));
  return `<button class="link-btn" data-v7315-back-terraria>‹ Volver a terrarios</button><div class="v7315-terrarium-hero card"><div data-v7315-cover="${esc(name)}" data-v7315-owner-type="terrarium"><span>🌿</span></div><div><span class="eyebrow">TERRARIO</span><h2>${esc(name)}</h2><p>${inhabitants.length} ${inhabitants.length===1?'habitante':'habitantes'}</p></div><button class="button" data-v7315-photo-terrarium="${esc(name)}">📷 Añadir foto</button></div>${antelmoV7315Gallery('terrarium',name)}<div class="section-title"><div><h2>Habitantes</h2><p>Toca una ficha para abrirla</p></div><button class="button secondary" data-new-fauna>＋ Habitante</button></div><div class="v7315-inhabitant-grid">${inhabitants.map(antelmoV7315FaunaCard).join('')||'<div class="empty">Este terrario aún no tiene habitantes.</div>'}</div>`;
}

function antelmoV7315FaunaCard(x){
  const logs=db.faunaLogs.filter(l=>String(l.faunaId)===String(x.id)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  return `<article class="v7315-inhabitant card" data-v7315-open-fauna="${esc(x.id)}"><div class="v7315-fauna-cover" data-v7315-cover="${esc(x.id)}" data-v7315-owner-type="fauna"><span>${esc(x.emoji||'🪲')}</span></div><div><span class="chip">${esc(x.status||'Activo')}</span><h3>${esc(x.name)}</h3><p class="latin">${esc(x.species||'Especie sin confirmar')}</p><small>${esc(antelmoV7315AgeText(x))}</small>${logs[0]?`<p class="sub">${esc(logs[0].type)} · ${esc(toDisplayDate(logs[0].date))}</p>`:''}</div></article>`;
}

function antelmoV7315FaunaDetail(id){
  const x=db.fauna.find(y=>String(y.id)===String(id));if(!x){antelmoV7315Cfg().selectedFaunaId='';return terrariumView();}
  const logs=db.faunaLogs.filter(l=>String(l.faunaId)===String(id)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  return `<button class="link-btn" data-v7315-back-fauna>‹ Volver a ${esc(x.habitat||'Terrarios')}</button><section class="v7315-profile card"><div class="v7315-profile-cover" data-v7315-cover="${esc(x.id)}" data-v7315-owner-type="fauna"><span>${esc(x.emoji||'🪲')}</span></div><div><span class="chip">${esc(x.status||'Activo')}</span><h2>${esc(x.name)}</h2><p class="latin">${esc(x.species||'Especie sin confirmar')}</p><p>${esc(antelmoV7315AgeText(x))}</p><p class="sub">🏠 ${esc(x.habitat||'Terrario principal')}</p></div></section><div class="v7315-profile-actions"><button class="button" data-v7315-photo-fauna="${esc(x.id)}">📷 Añadir foto</button><button class="button secondary" data-fauna-log="${esc(x.id)}">＋ Observación</button><button class="button secondary" data-edit-fauna="${esc(x.id)}">✎ Editar ficha</button></div><div class="section-title"><div><h2>Álbum de evolución</h2><p>Fotografías de ${esc(x.name)}</p></div></div>${antelmoV7315Gallery('fauna',x.id)}<div class="section-title"><div><h2>Historial</h2><p>${logs.length} registros</p></div></div><div class="life-timeline">${logs.map(l=>`<article class="card"><b>${esc(l.type||'Observación')}</b><small>${esc(toDisplayDate(l.date||''))}</small><p>${esc(l.notes||'')}</p></article>`).join('')||'<div class="empty">Todavía no hay observaciones.</div>'}</div>`;
}

terrariumView=function(){
  ensureV6Data();const cfg=antelmoV7315Cfg();
  if(cfg.selectedFaunaId)return antelmoV7315FaunaDetail(cfg.selectedFaunaId);
  if(cfg.selectedTerrarium)return antelmoV7315TerrariumDetail(cfg.selectedTerrarium);
  const names=antelmoV7315TerrariumNames();
  return `<div class="section-title"><div><h2>🪲 Terrarios</h2><p>${names.length} instalaciones · ${db.fauna.length} habitantes</p></div><button class="button" data-new-fauna>＋ Habitante</button></div><div class="v7315-terraria-grid">${names.map(name=>{const inhabitants=db.fauna.filter(x=>String(x.habitat||'Terrario principal')===name),media=antelmoV7315Media('terrarium',name);return `<article class="v7315-terrarium-card card" data-v7315-open-terrarium="${esc(name)}"><div class="v7315-terrarium-cover" data-v7315-cover="${esc(name)}" data-v7315-owner-type="terrarium"><span>🌿</span></div><div><h3>${esc(name)}</h3><p>${inhabitants.length} ${inhabitants.length===1?'habitante':'habitantes'} · ${media.length} fotos</p><div class="v7315-mini-inhabitants">${inhabitants.slice(0,5).map(x=>`<span>${esc(x.emoji||'🪲')} ${esc(x.name)}</span>`).join('')}</div></div></article>`}).join('')||'<div class="empty">Añade tu primer habitante para crear el Terrario principal.</div>'}</div>`;
};

const antelmoV7315FaunaForm=faunaForm;
faunaForm=function(id){
  antelmoV7315FaunaForm(id);const form=$('#faunaForm');if(!form)return;const x=db.fauna.find(y=>String(y.id)===String(id))||{};
  if(!form.elements.arrivedAt){const habitat=form.elements.habitat?.closest('label'),wrap=document.createElement('label');wrap.innerHTML=`Fecha de llegada<input name="arrivedAt" type="date" value="${esc(String(antelmoV7315Arrival(x)||today()).slice(0,10))}">`;habitat?.after(wrap);prepareDateInputs?.(wrap);}
  const original=form.onsubmit;form.onsubmit=e=>{const fd=new FormData(form),arrived=toIsoDate(fd.get('arrivedAt'));if(id)x.arrivedAt=arrived;const before=db.fauna.length,ret=original?.call(form,e);if(!id&&db.fauna.length>before)db.fauna.at(-1).arrivedAt=arrived;return ret;};
};

const antelmoV7315Render=render;
render=function(){antelmoV7315Render();if(route==='more'&&db.appConfig.moreTab==='fauna'){requestAnimationFrame(antelmoV7315HydrateMedia)}};

document.addEventListener('click',e=>{
  const terr=e.target.closest('[data-v7315-open-terrarium]');if(terr){e.preventDefault();antelmoV7315Cfg().selectedTerrarium=terr.dataset.v7315OpenTerrarium;antelmoV7315Cfg().selectedFaunaId='';save();render();return;}
  const fauna=e.target.closest('[data-v7315-open-fauna]');if(fauna){e.preventDefault();antelmoV7315Cfg().selectedFaunaId=fauna.dataset.v7315OpenFauna;save();render();return;}
  if(e.target.closest('[data-v7315-back-terraria]')){antelmoV7315Cfg().selectedTerrarium='';save();render();return;}
  if(e.target.closest('[data-v7315-back-fauna]')){const x=db.fauna.find(y=>String(y.id)===String(antelmoV7315Cfg().selectedFaunaId));antelmoV7315Cfg().selectedFaunaId='';antelmoV7315Cfg().selectedTerrarium=x?.habitat||'';save();render();return;}
  const tp=e.target.closest('[data-v7315-photo-terrarium]');if(tp){e.preventDefault();e.stopImmediatePropagation();antelmoV7315AddPhotos('terrarium',tp.dataset.v7315PhotoTerrarium,tp.dataset.v7315PhotoTerrarium);return;}
  const fp=e.target.closest('[data-v7315-photo-fauna]');if(fp){e.preventDefault();e.stopImmediatePropagation();const x=db.fauna.find(y=>String(y.id)===String(fp.dataset.v7315PhotoFauna));if(x)antelmoV7315AddPhotos('fauna',x.id,x.name);return;}
},true);

(function(){const style=document.createElement('style');style.id='antelmo-v7315-styles';style.textContent=`
.v7315-terraria-grid,.v7315-inhabitant-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.v7315-terrarium-card,.v7315-inhabitant{cursor:pointer;overflow:hidden}.v7315-terrarium-cover,.v7315-fauna-cover,.v7315-profile-cover,.v7315-terrarium-hero>div:first-child{height:145px;border-radius:14px;background:var(--surface2);display:grid;place-items:center;overflow:hidden}.v7315-terrarium-cover img,.v7315-fauna-cover img,.v7315-profile-cover img,.v7315-terrarium-hero img{width:100%;height:100%;object-fit:cover}.v7315-terrarium-cover span,.v7315-fauna-cover span,.v7315-profile-cover span{font-size:44px}.v7315-mini-inhabitants{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.v7315-mini-inhabitants span{font-size:11px;padding:4px 7px;border-radius:99px;background:var(--surface2)}.v7315-terrarium-hero{display:grid;grid-template-columns:120px 1fr auto;gap:14px;align-items:center}.v7315-terrarium-hero>div:first-child{height:100px}.v7315-profile{display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:center}.v7315-profile-cover{height:150px}.v7315-profile-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 16px}.v7315-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin:8px 0 18px}.v7315-photo{min-width:0}.v7315-photo>div{aspect-ratio:1;border-radius:12px;background:var(--surface2);display:grid;place-items:center;overflow:hidden}.v7315-photo img{width:100%;height:100%;object-fit:cover}.v7315-photo small,.v7315-photo b,.v7315-photo i{display:block;margin-top:4px;font-size:10px}.v7315-photo b{font-size:11px}.v7315-photo i{color:var(--green);font-style:normal}@media(max-width:620px){.v7315-terraria-grid{grid-template-columns:1fr 1fr}.v7315-terrarium-hero{grid-template-columns:82px 1fr}.v7315-terrarium-hero>button{grid-column:1/-1}.v7315-profile{grid-template-columns:105px 1fr}.v7315-profile-cover{height:105px}.v7315-inhabitant-grid{grid-template-columns:1fr 1fr}.v7315-terrarium-cover,.v7315-fauna-cover{height:110px}}@media(max-width:390px){.v7315-terraria-grid,.v7315-inhabitant-grid{grid-template-columns:1fr}}
`;document.head.appendChild(style)})();