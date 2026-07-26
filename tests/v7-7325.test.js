const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

async function run(){
  const meta={id:'7',ownerType:'terrarium',ownerId:'Principal',ownerCover:true,date:'2026-07-24',caption:'Antes'};
  let photos=[{id:7,date:'2026-07-24',caption:'Antes',blob:{type:'image/png'}}];
  let savedPhoto=null;
  let deletedKey=null;
  let lastToast='';
  let saveCount=0;
  let renderCount=0;
  const submitButton={disabled:false};
  const form={
    onsubmit:null,
    querySelector:()=>submitButton
  };

  const context={
    console,
    db:{mediaIndex:[meta]},
    photoAll:async()=>photos,
    photoPut:async photo=>{savedPhoto={...photo};},
    photoDelete:async id=>{deletedKey=id;photos=photos.filter(photo=>photo.id!==id);},
    antelmoV7322Meta:id=>context.db.mediaIndex.find(item=>String(item.id)===String(id)),
    antelmoV7315Media:()=>[],
    antelmoV7324Photo:async()=>null,
    antelmoV7323BuildBackup:async()=>({appVersion:'7.3.23'}),
    render:()=>{renderCount++;},
    save:()=>{saveCount++;},
    toast:text=>{lastToast=text;},
    confirm:()=>true,
    closeModal:()=>{},
    openModal:()=>{},
    field:(label,control)=>`${label}${control}`,
    esc:value=>String(value??''),
    today:()=> '2026-07-26',
    toIsoDate:value=>value==='25/07/2026'?'2026-07-25':String(value||''),
    prepareDateInputs:()=>{},
    FormData:class{
      get(name){return name==='date'?'25/07/2026':'Después';}
    },
    document:{
      querySelector(selector){
        if(selector==='#v7325EditPhoto')return form;
        if(selector==='.topbar .eyebrow')return null;
        return null;
      }
    }
  };

  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'..','v7-7325.js'),'utf8');
  vm.runInContext(source,context,{filename:'v7-7325.js'});

  const normalized=await context.photoGet('7');
  assert.equal(normalized.id,7,'photoGet debe aceptar un ID de distinto tipo');

  await context.antelmoV7322Edit('7');
  assert.equal(typeof form.onsubmit,'function','Editar debe abrir y preparar el formulario');
  await form.onsubmit({preventDefault(){}});
  assert.equal(savedPhoto.id,7,'Editar debe conservar la clave real de IndexedDB');
  assert.equal(savedPhoto.date,'2026-07-25');
  assert.equal(savedPhoto.caption,'Después');
  assert.equal(meta.date,'2026-07-25');
  assert.equal(meta.caption,'Después');
  assert.equal(lastToast,'Fotografía actualizada');
  assert.equal(saveCount,1);
  assert.equal(renderCount,1);

  context.db.mediaIndex=[meta];
  await context.antelmoV7322Delete('7');
  assert.equal(deletedKey,7,'Borrar debe usar la clave real, no el texto del atributo data');
  assert.equal(context.db.mediaIndex.length,0);
  assert.equal(lastToast,'Fotografía eliminada');

  const backup=await context.antelmoV7323BuildBackup();
  assert.equal(backup.appVersion,'7.3.25');

  console.log('V7.3.25: lectura, edición, borrado y versión de copia verificados');
}

run().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
