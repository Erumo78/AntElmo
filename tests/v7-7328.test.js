const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

async function run(){
  let shareCalls=0;
  let saved=0;
  let rendered=0;
  let insertedHome='';
  let insertedData='';
  const styles=new Map();
  const dataApp={
    querySelector:()=>null,
    insertAdjacentHTML(position,html){insertedData=html;}
  };
  const document={
    body:{appendChild(){}},
    head:{appendChild(node){styles.set(node.id,node);}},
    createElement(tag){
      return {
        tagName:String(tag).toUpperCase(),
        id:'',
        type:'',
        value:'',
        textContent:'',
        className:'',
        dataset:{},
        style:{},
        setAttribute(){},
        appendChild(){},
        addEventListener(){},
        click(){},
        remove(){}
      };
    },
    querySelector(selector){
      if(selector==='#antelmo-v7328-styles')return styles.get('antelmo-v7328-styles')||null;
      if(selector==='#app .antelmo-v7311-direct')return {
        querySelector:()=>null,
        insertAdjacentHTML(position,html){insertedHome=html;}
      };
      if(selector==='#app')return dataApp;
      return null;
    },
    querySelectorAll:()=>[],
    addEventListener(){}
  };
  const context={
    console,
    db:{
      colonies:[{id:'c1',name:'Messor'}],
      collections:[],
      appConfig:{v7326:{activeRound:false},backup:{}}
    },
    route:'more',
    selected:null,
    antelmoV7326InstallHome(){},
    antelmoV7326EnsureData(){return context.db.appConfig.v7326;},
    antelmoV7326SecurityCard:()=>'<section data-v7326-security><button data-v7326-backup>⬇︎ Crear copia ahora</button></section>',
    antelmoV7327BindSecurity(){},
    antelmoV7327Import:async()=>{},
    antelmoV7326HydrateSecurity:async()=>{},
    antelmoV7323BackupPanel:()=>'<section>BASE</section>',
    antelmoV7323BuildBackup:async()=>({
      appVersion:'7.3.27',
      exportedAt:'2026-07-27T10:00:00.000Z',
      database:{appConfig:{}},
      media:[{id:'p1'}]
    }),
    photoAll:async()=>[{id:'p1'}],
    colonyForm(){},
    ensureRoadmapData(){context.db.collections ||= [];},
    speciesAccent:()=> '#3d765c',
    uid:()=> 'collection-1',
    today:()=> '2026-07-27',
    toDisplayDate:value=>String(value),
    esc:value=>String(value??''),
    toast(){},
    alert(message){throw new Error(message);},
    save(){saved++;},
    render(){rendered++;},
    Blob:class Blob{
      constructor(parts,options){this.parts=parts;this.type=options?.type||'';}
    },
    File:class File{
      constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options?.type||'';}
    },
    Event:class Event{
      constructor(type,options){this.type=type;this.bubbles=options?.bubbles;}
    },
    navigator:{
      canShare:({files})=>files?.[0]?.name?.endsWith('.json'),
      share(data){
        shareCalls++;
        assert.equal(data.files[0].name,'ANTELMO-COMPLETO-2026-07-27.json');
        return Promise.resolve();
      }
    },
    URL:{createObjectURL:()=> 'blob:backup',revokeObjectURL(){}},
    setTimeout,
    requestAnimationFrame:callback=>{callback();return 1;},
    document
  };

  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'..','v7-7328.js'),'utf8');
  vm.runInContext(source,context,{filename:'v7-7328.js'});

  context.route='home';
  context.antelmoV7326InstallHome();
  assert.match(insertedHome,/Ronda de revisión/);
  assert.doesNotMatch(insertedHome,/Escudo de datos|data-v7326-security/);

  context.route='stats';
  context.antelmoV7328EnhanceData();
  assert.match(insertedData,/data-v7326-security/);
  assert.match(insertedData,/data-v7328-open-security/);
  assert.doesNotMatch(insertedData,/data-v7326-backup/);

  context.selected='c1';
  context.antelmoV7328ToggleDetail('documentary');
  assert.equal(context.antelmoV7328IsDetailCollapsed('documentary'),true);
  context.antelmoV7328ToggleDetail('documentary');
  assert.equal(context.antelmoV7328IsDetailCollapsed('documentary'),false);

  const select={
    options:[],
    value:'',
    appendChild(option){this.options.push(option);},
    dispatchEvent(event){this.lastEvent=event;}
  };
  const input={value:'Reinas jóvenes',focus(){}};
  const creator={querySelector:selector=>selector.includes('collection-name')?input:null};
  const form={elements:{collectionId:select}};
  const createButton={
    closest(selector){
      if(selector==='[data-v7328-collection-create]')return creator;
      if(selector==='#v72ColonyForm')return form;
      return null;
    }
  };
  context.antelmoV7328CreateCollection(createButton);
  assert.equal(context.db.collections.length,1);
  assert.equal(context.db.collections[0].name,'Reinas jóvenes');
  assert.equal(select.value,'collection-1');
  assert.equal(select.lastEvent.type,'change');

  const panel=context.antelmoV7323BackupPanel();
  assert.match(panel,/Preparar para iCloud/);
  assert.match(panel,/Abrir Archivos \/ iCloud Drive/);
  assert.match(panel,/Descargar archivo/);
  assert.match(panel,/V7\.3\.28/);

  const backup=await context.antelmoV7323BuildBackup();
  assert.equal(backup.appVersion,'7.3.28');

  await context.antelmoV7328PrepareICloud();
  context.antelmoV7328ShareICloud();
  assert.equal(shareCalls,1,'el selector se invoca directamente en el segundo toque');
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(saved>=2);
  assert.ok(rendered>=1);

  const css=styles.get('antelmo-v7328-styles').textContent;
  assert.match(css,/dex-facts>span:last-child/);
  assert.match(css,/data-antelmo-view="records"/);
  assert.match(css,/v7328-cycle\.v7328-is-collapsed/);

  console.log('V7.3.28: ubicación, plegado, colecciones, contraste e iCloud verificados');
}

run().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
