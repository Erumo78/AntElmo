/* ANTELMO V7.3.25 — corrige edición, borrado y lectura de fotografías. */

async function antelmoV7325Photo(id){
  const photos=await photoAll();
  return photos.find(photo=>String(photo.id)===String(id))||null;
}

/* Compatibilidad para módulos antiguos que llamaban a photoGet sin que existiera. */
async function photoGet(id){
  return antelmoV7325Photo(id);
}

antelmoV7322Edit=async function(id){
  const meta=antelmoV7322Meta(id);
  const photo=await antelmoV7325Photo(id);
  if(!meta||!photo){
    toast('No se pudo editar la fotografía');
    return;
  }

  const initialDate=String(meta.date||photo.date||today()).slice(0,10);
  const initialCaption=meta.caption||photo.caption||'';
  openModal(`<h2>Editar fotografía</h2><form id="v7325EditPhoto" class="form">${field('Fecha',`<input name="date" type="date" value="${esc(initialDate)}">`)}${field('Descripción',`<input name="caption" value="${esc(initialCaption)}" placeholder="Qué muestra esta foto">`)}<button class="button">Guardar cambios</button></form>`);

  const form=document.querySelector('#v7325EditPhoto');
  if(!form)return;
  if(typeof prepareDateInputs==='function')prepareDateInputs(form);

  form.onsubmit=async event=>{
    event.preventDefault();
    const button=form.querySelector('button[type="submit"],button:not([type])');
    if(button)button.disabled=true;
    try{
      const values=new FormData(form);
      const date=toIsoDate(values.get('date'))||initialDate||today();
      const caption=String(values.get('caption')||'').trim();
      photo.date=date;
      photo.caption=caption;
      await photoPut(photo);
      meta.date=date;
      meta.caption=caption;
      save();
      closeModal();
      toast('Fotografía actualizada');
      render();
    }catch(error){
      console.error(error);
      if(button)button.disabled=false;
      toast('No se pudieron guardar los cambios');
    }
  };
};

antelmoV7322Delete=async function(id){
  const meta=antelmoV7322Meta(id);
  if(!meta){
    toast('No se encontró la fotografía');
    return;
  }
  if(!confirm('¿Eliminar esta fotografía?'))return;

  try{
    const photo=await antelmoV7325Photo(id);
    if(photo)await photoDelete(photo.id);
    const wasCover=Boolean(meta.ownerCover);
    const ownerType=meta.ownerType;
    const ownerId=meta.ownerId;
    db.mediaIndex=(db.mediaIndex||[]).filter(item=>String(item.id)!==String(id));
    if(wasCover){
      const fallback=antelmoV7315Media(ownerType,ownerId)[0];
      if(fallback)fallback.ownerCover=true;
    }
    save();
    closeModal();
    toast('Fotografía eliminada');
    render();
  }catch(error){
    console.error(error);
    toast('No se pudo eliminar la fotografía');
  }
};

/* El visor y las portadas reutilizan la misma búsqueda normalizada. */
antelmoV7324Photo=antelmoV7325Photo;

const antelmoV7325BuildBackup=antelmoV7323BuildBackup;
antelmoV7323BuildBackup=async function(){
  const backup=await antelmoV7325BuildBackup();
  backup.appVersion='7.3.25';
  return backup;
};

function antelmoV7325VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.25';
}

const antelmoV7325Render=render;
render=function(){
  antelmoV7325Render();
  antelmoV7325VersionBadge();
};
