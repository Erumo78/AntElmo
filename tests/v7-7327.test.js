const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

async function run(){
  const metaA={id:'7',ownerType:'terrarium',ownerId:'Principal',ownerCover:true,date:'2026-07-24',caption:'Antes',tags:['Reina']};
  const metaB={id:'8',ownerType:'terrarium',ownerId:'Principal',ownerCover:false,date:'2026-07-25',caption:'Después',tags:['Obreras']};
  let photos=[
    {id:7,date:'2026-07-24',caption:'Antes',blob:{type:'image/png'},tags:['Reina']},
    {id:8,date:'2026-07-25',caption:'Después',blob:{type:'image/png'},tags:['Obreras']}
  ];
  let modalHtml='';
  let savedPhoto=null;
  let saved=0;
  let rendered=0;
  const submitButton={disabled:false};
  const editForm={
    onsubmit:null,
    querySelector:()=>submitButton
  };
  const styleNodes=new Map();
  const localValues=new Map();
  const context={
    console,
    db:{
      colonies:[],
      fauna:[],
      mediaIndex:[metaA,metaB],
      appConfig:{moreTab:'hub',v7326:{photoFilters:{},ownerPhotoFilters:{}}}
    },
    route:'more',
    selected:null,
    ensureRoadmapData(){},
    summariesView:()=>'<section data-summaries>RESÚMENES</section>',
    terrariumView:()=>'<section data-fauna>TERRARIOS</section>',
    antelmoV7326SecurityCard:()=>'<section data-v7326-security>ESCUDO</section>',
    antelmoV7323BackupPanel:()=>'<section class="antelmo-backup-card"><span class="chip">V7.3.23</span>COPIA</section>',
    antelmoV7323BuildBackup:async()=>({appVersion:'7.3.26',media:[],database:{appConfig:{}},exportedAt:'2026-07-27T10:00:00Z'}),
    antelmoV7323StorageSnapshot:()=>({}),
    antelmoV7323DataUrlToBlob:async()=>({size:4,type:'image/png'}),
    antelmoV7326Export:async()=>{},
    antelmoV7323Export:async()=>{},
    exportBackup:async()=>{},
    antelmoV7323Import:async()=>{},
    importBackup:async()=>{},
    antelmoV7326HydrateSecurity:async()=>{},
    antelmoV7315AddPhotos:async()=>{},
    antelmoV7322Edit:async()=>{},
    antelmoV7322SetCover:async()=>{},
    antelmoV7322Delete:async()=>{},
    antelmoV7322View:async()=>{},
    antelmoV7315HydrateMedia:async()=>{},
    antelmoV7322Hydrate:async()=>{},
    antelmoV7322Meta:id=>context.db.mediaIndex.find(item=>String(item.id)===String(id)),
    antelmoV7325Photo:async id=>photos.find(item=>String(item.id)===String(id)),
    antelmoV7315Media:(ownerType,ownerId)=>context.db.mediaIndex.filter(item=>item.ownerType===ownerType&&String(item.ownerId)===String(ownerId)),
    antelmoV7315Cfg:()=>({selectedFaunaId:'',selectedTerrarium:''}),
    antelmoV7315TerrariumNames:()=>[],
    antelmoV7326EnsureData:()=>context.db.appConfig.v7326,
    antelmoV7326Tags:value=>Array.isArray(value)?value:String(value||'').split(',').filter(Boolean),
    antelmoV7326TagChips:tags=>`<tags>${(tags||[]).join(',')}</tags>`,
    antelmoV7326TagOptions:()=>'<tags-input></tags-input>',
    antelmoV7326FormTags:()=>['Reina'],
    photoAll:async()=>photos,
    photoPut:async photo=>{savedPhoto={...photo};photos=photos.map(item=>item.id===photo.id?photo:item);},
    photoDelete:async id=>{photos=photos.filter(item=>item.id!==id);},
    optimizeImage:async file=>file,
    openModal:html=>{modalHtml=html;},
    closeModal(){},
    toast(){},
    alert(){},
    confirm:()=>true,
    save:()=>{saved++;},
    render:()=>{rendered++;},
    bind(){},
    more:()=>'<nav class="tabs pro-tabs v7-tabs"></nav><main>BASE</main>',
    roadmapTabs:()=>'<nav></nav>',
    hubView:()=>'<main>HUB</main>',
    esc:value=>String(value??''),
    field:(label,html)=>`<label>${label}${html}</label>`,
    today:()=> '2026-07-27',
    toIsoDate:value=>String(value||''),
    toDisplayDate:value=>String(value||''),
    uid:()=> 'new-id',
    prepareDateInputs(){},
    FormData:class{
      get(name){
        if(name==='date')return '2026-07-27';
        if(name==='caption')return 'Editada';
        return '';
      }
    },
    Blob:class{},
    File:class{},
    URL:{
      createObjectURL:blob=>`blob:${blob.type||'data'}:${Math.random()}`,
      revokeObjectURL(){}
    },
    navigator:{},
    setTimeout,
    requestAnimationFrame:callback=>{callback();return 1;},
    localStorage:{
      get length(){return localValues.size;},
      key(index){return [...localValues.keys()][index]||null;},
      getItem(key){return localValues.get(key)||null;},
      setItem(key,value){localValues.set(key,String(value));},
      removeItem(key){localValues.delete(key);}
    },
    idb:null,
    ANTELMO_BACKUP_FORMAT:'ANTELMO_FULL_BACKUP',
    document:{
      body:{appendChild(){},contains:()=>true},
      head:{appendChild(node){styleNodes.set(node.id,node);}},
      createElement:()=>({id:'',textContent:'',style:{},click(){},remove(){}}),
      querySelector(selector){
        if(selector==='#v7327OwnerEditPhoto')return editForm;
        if(selector==='#antelmo-v7327-styles')return styleNodes.get('antelmo-v7327-styles')||null;
        return null;
      },
      querySelectorAll:()=>[],
      addEventListener(){}
    }
  };

  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'..','v7-7327.js'),'utf8');
  vm.runInContext(source,context,{filename:'v7-7327.js'});

  assert.equal(context.antelmoV7327GroupFor('compare'),'data');
  assert.equal(context.antelmoV7327GroupFor('documentary'),'history');
  assert.equal(context.antelmoV7327GroupFor('fauna'),'fauna');
  ['global','life','documentary','summaries','compare','legacy','library','hall','feeding','smart','media','timelapse','environment','ai','achievements','encyclopedia','genealogy','presentation','notifications','sync','cloud','prediction','fauna','scanner','search'].forEach(tab=>{
    assert.notEqual(context.antelmoV7327GroupFor(tab),'hub',`${tab} debe seguir accesible desde un grupo`);
  });

  context.db.appConfig.moreTab='data';
  const dataGroup=context.more();
  assert.match(dataGroup,/Seguridad, datos y nube/);
  assert.equal((dataGroup.match(/Comparar colonias/g)||[]).length,1,'solo debe existir un comparador en el grupo');

  context.db.appConfig.moreTab='story';
  const story=context.more();
  assert.match(story,/Historia y resúmenes/);
  assert.match(story,/data-summaries/);
  assert.match(story,/data-module="documentary"/);

  context.db.appConfig.moreTab='fauna';
  assert.match(context.more(),/data-fauna/);

  const backup=await context.antelmoV7323BuildBackup();
  assert.equal(backup.appVersion,'7.3.27');

  context.db.appConfig.moreTab='fauna';
  await context.antelmoV7322View('7');
  assert.match(modalHtml,/1 de 2/);
  assert.match(modalHtml,/data-v7327-view="8"/);
  assert.match(modalHtml,/Editar/);
  assert.match(modalHtml,/Borrar/);

  await context.antelmoV7322Edit('7');
  assert.equal(typeof editForm.onsubmit,'function');
  await editForm.onsubmit({preventDefault(){}});
  assert.equal(savedPhoto.id,7,'la edición conserva la clave real de IndexedDB');
  assert.equal(savedPhoto.caption,'Editada');
  assert.equal(metaA.caption,'Editada');
  assert.equal(Array.from(savedPhoto.tags).join(','),'Reina');
  assert.equal(saved,1);
  assert.equal(rendered,1);

  const transaction={
    error:null,
    oncomplete:null,
    onerror:null,
    onabort:null,
    objectStore(){
      return {
        clear(){},
        put(photo){assert.ok(photo.blob);}
      };
    }
  };
  context.idb={
    transaction(){
      queueMicrotask(()=>transaction.oncomplete());
      return transaction;
    }
  };
  const prepared=await context.antelmoV7327PrepareRestore({
    text:async()=>JSON.stringify({
      format:'ANTELMO_FULL_BACKUP',
      database:{colonies:[{id:'c1'}]},
      media:[{id:'photo-1',dataUrl:'data:image/png;base64,AAAA'}],
      localStorage:{'antelmo.draft.test':'{"ok":true}'}
    })
  });
  assert.equal(prepared.photos.length,1);
  assert.equal(prepared.photos[0].id,'photo-1');
  await context.antelmoV7327ReplacePhotos(prepared.photos);

  console.log('V7.3.27: módulos, copia, visor, edición y restauración verificados');
}

run().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
