const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

async function run(){
  const styles=new Map();
  let rendered=0;
  const document={
    head:{appendChild(node){styles.set(node.id,node);}},
    createElement(){
      return {
        className:'',
        dataset:{},
        innerHTML:'',
        children:[],
        appendChild(node){this.children.push(node);},
        querySelector(){return null;}
      };
    },
    querySelector(selector){
      if(selector==='#antelmo-v7329-styles')return styles.get('antelmo-v7329-styles')||null;
      return null;
    }
  };
  const context={
    console,
    ANTELMO_V7327_GROUPS:[
      {key:'data',copy:'Anterior',modules:[
        ['security'],['stats'],['compare'],['ai'],['sync'],['cloud']
      ]}
    ],
    antelmoV7328EnhanceData(){throw new Error('No debe inyectar el Escudo en DATOS');},
    antelmoV7327SecurityView(){return 'anterior';},
    antelmoV7326SecurityCard:()=>'<section>Escudo</section>',
    antelmoV7323BackupPanel:()=>'<section><span class="chip">V7.3.28</span></section>',
    antelmoV7323BuildBackup:async()=>({appVersion:'7.3.28'}),
    antelmoV7328IsDetailCollapsed:()=>false,
    colonyForm(){},
    render(){rendered++;},
    route:'stats',
    selected:null,
    esc:value=>String(value??''),
    document
  };

  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'..','v7-7329.js'),'utf8');
  vm.runInContext(source,context,{filename:'v7-7329.js'});

  assert.deepEqual(
    Array.from(context.ANTELMO_V7327_GROUPS[0].modules,entry=>entry[0]),
    ['security','sync','cloud']
  );
  assert.doesNotThrow(()=>context.antelmoV7328EnhanceData());
  const security=context.antelmoV7327SecurityView();
  assert.match(security,/Escudo/);
  assert.doesNotMatch(security,/Otras opciones|Sincronización portátil|Nube personal/);

  const backup=await context.antelmoV7323BuildBackup();
  assert.equal(backup.appVersion,'7.3.29');
  assert.match(context.antelmoV7323BackupPanel(),/V7\.3\.29/);

  context.render();
  assert.equal(rendered,1);

  const css=styles.get('antelmo-v7329-styles').textContent;
  assert.match(css,/v7327-module-grid\{grid-template-columns:repeat\(2/);
  assert.match(css,/colony-care-actions\{grid-template-columns:repeat\(2/);
  assert.match(css,/dex-metrics\{grid-template-columns:repeat\(2/);
  assert.match(css,/v7328-collection-create\{grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css,/data-v7329-colony-section="cycle"\]\{margin-bottom:84px/);

  console.log('V7.3.29: módulos, Seguridad, colonia y colección verificados');
}

run().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
