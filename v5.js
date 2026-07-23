/* ANTELMO V5 — AntDex enciclopédica, cronología, logros y AntScan */
const v5BaseBind=bind, v5BaseMore=more, v5BaseHome=home, v5BaseColonyDetail=colonyDetail, v5BaseStats=stats;

function ensureV5Data(){
  db.achievements ||= [];
  db.speciesProfiles ||= {};
  db.scanReports ||= [];
  db.appConfig ||= {};
  db.appConfig.moreTab ||= 'tools';
}
const v5BaseSave=save;
save=function(){ensureV5Data();db.metadata={...(db.metadata||{}),schemaVersion:'5.0.0',updatedAt:new Date().toISOString()};localStorage.setItem('antelmo.v4',JSON.stringify(db));};

function speciesKey(name=''){return name.trim().toLowerCase().replace(/\s+/g,' ')}
function profileFor(c){
  ensureV5Data();const k=speciesKey(c.species||c.name);return db.speciesProfiles[k]||{};
}
function rankFor(c){const w=+c.workers||0, feeds=db.feedings.filter(x=>String(x.colonyId)===String(c.id)).length, events=db.events.filter(x=>String(x.colonyId)===String(c.id)).length, photos=0;return Math.max(1,Math.min(99,Math.floor(w/10)+feeds+events+photos+1));}
function progressToNext(c){const level=rankFor(c),current=(+c.workers||0)+db.feedings.filter(x=>String(x.colonyId)===String(c.id)).length*5;return Math.min(100,current%100)}

function achievementDefinitions(){
 const t=totals(),photoCount=db.metadata?.photoCount||0;
 return [
  ['first-colony','🌱','Primera colonia','Registra tu primera colonia',t.colonies>=1],
  ['seven-colonies','7️⃣','AntDex 7','Alcanza siete colonias',t.colonies>=7],
  ['hundred-workers','👑','Reino de 100','Supera 100 obreras en total',t.workers>=100],
  ['first-feed','🍯','Primer banquete','Registra una alimentación',db.feedings.length>=1],
  ['fifty-feed','🏅','Cuidador experto','Registra 50 alimentaciones',db.feedings.length>=50],
  ['first-growth','📈','Crecimiento documentado','Registra un recuento',db.growthRecords.length>=1],
  ['first-move','🏠','Nueva casa','Registra una mudanza',db.events.some(x=>/muda|hormiguero|traslado/i.test(`${x.title||''} ${x.type||''} ${x.notes||''}`))],
  ['first-photo','📸','Memoria visual','Guarda una fotografía',photoCount>=1],
  ['hundred-photo','🎞️','Archivo naturalista','Guarda 100 fotografías',photoCount>=100],
  ['scanner','🔎','Primera inspección','Completa un AntScan',db.scanReports.length>=1]
 ];
}
function achievementsView(){const defs=achievementDefinitions(),won=defs.filter(x=>x[4]).length;return `<div class="section-title"><div><h2>🏆 Logros</h2><p>${won} de ${defs.length} desbloqueados</p></div></div><div class="achievement-progress"><span style="width:${won/defs.length*100}%"></span></div><div class="achievement-grid">${defs.map(([id,icon,title,text,ok])=>`<article class="achievement ${ok?'unlocked':'locked'}"><div>${icon}</div><b>${esc(title)}</b><span>${esc(text)}</span><small>${ok?'DESBLOQUEADO':'PENDIENTE'}</small></article>`).join('')}</div>`}

function timelineItems(c){
 const rows=[];
 if(c.founded)rows.push({date:c.founded,icon:'🐣',title:'Fundación de la colonia',text:c.origin||''});
 db.feedings.filter(x=>String(x.colonyId)===String(c.id)).forEach(x=>rows.push({date:x.date,icon:'🍯',title:x.food||'Alimentación',text:x.notes||''}));
 db.events.filter(x=>String(x.colonyId)===String(c.id)).forEach(x=>rows.push({date:x.date,icon:/muda|traslado/i.test(`${x.title||''} ${x.type||''}`)?'🏠':'📅',title:x.title||x.type||'Evento',text:x.notes||''}));
 db.growthRecords.filter(x=>String(x.colonyId)===String(c.id)).forEach(x=>rows.push({date:x.date,icon:'📈',title:`${x.workers??'—'} obreras`,text:[x.eggs!=null?`${x.eggs} huevos`:null,x.larvae!=null?`${x.larvae} larvas`:null].filter(Boolean).join(' · ')}));
 db.scanReports.filter(x=>String(x.colonyId)===String(c.id)).forEach(x=>rows.push({date:x.date,icon:'🔎',title:'Inspección AntScan',text:x.summary||''}));
 return rows.sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,40);
}
function timelineHtml(c){const items=timelineItems(c);return `<div class="evolution-line">${items.map((x,i)=>`<article class="evolution-item"><div class="evolution-icon">${x.icon}</div><div><time>${esc(x.date||'Sin fecha')}</time><b>${esc(x.title)}</b>${x.text?`<p>${esc(x.text)}</p>`:''}</div></article>`).join('')||'<div class="empty">Registra alimentaciones, recuentos y eventos para construir su historia.</div>'}</div>`}

function speciesDossier(c){const p=profileFor(c);return `<section class="dossier card"><div class="dossier-head"><div><span class="eyebrow">FICHA DE ESPECIE</span><h3>${esc(c.species||'Especie sin confirmar')}</h3></div><button class="button secondary" data-edit-species="${esc(c.id)}">Editar ficha</button></div><div class="dossier-grid">
 <div><b>🌍 Distribución</b><span>${esc(p.distribution||'Añade sus regiones de distribución')}</span></div>
 <div><b>📏 Tamaño</b><span>${esc(p.size||'Añade tamaño de reina y obreras')}</span></div>
 <div><b>🎯 Dificultad</b><span>${esc(p.difficulty||'Sin valorar')}</span></div>
 <div><b>🌡️ Temperatura</b><span>${esc(p.temperature||'Añade el intervalo recomendado')}</span></div>
 <div><b>💧 Humedad</b><span>${esc(p.humidity||'Añade el intervalo recomendado')}</span></div>
 <div><b>🍽️ Alimentación</b><span>${esc(p.diet||'Añade su dieta habitual')}</span></div>
 </div>${p.curiosities?`<div class="dossier-note"><b>💡 Curiosidades</b><p>${esc(p.curiosities)}</p></div>`:''}</section>`}

colonyDetail=function(id){const c=db.colonies.find(x=>String(x.id)===String(id));if(!c)return colonies();const base=v5BaseColonyDetail(id),level=rankFor(c);return base.replace('</section>',`<div class="level-panel"><span>NIVEL ${level}</span><div class="level-track"><i style="width:${progressToNext(c)}%"></i></div></div></section>`)+`${speciesDossier(c)}<div class="section-title"><div><h2>📜 Evolución</h2><p>La historia completa de la colonia</p></div><button class="button secondary" data-scan-for="${esc(c.id)}">🔎 AntScan</button></div>${timelineHtml(c)}<div class="section-title"><div><h2>🏅 Logros relacionados</h2><p>Hitos de tu colección</p></div><button class="link-btn" data-open-achievements>Ver todos</button></div>${achievementDefinitions().filter(x=>x[4]).slice(-3).map(x=>`<div class="mini-achievement"><span>${x[1]}</span><div><b>${esc(x[2])}</b><small>${esc(x[3])}</small></div></div>`).join('')||'<div class="empty">Todavía no hay logros desbloqueados.</div>'}`}

function speciesForm(colonyId){const c=db.colonies.find(x=>String(x.id)===String(colonyId));if(!c)return;const k=speciesKey(c.species||c.name),p=db.speciesProfiles[k]||{};openModal(`<h2>📖 Ficha de especie</h2><p class="modal-intro">Información editable de tu enciclopedia. Los campos vacíos no inventan datos.</p><form id="speciesForm" class="form">${field('Distribución',`<input name="distribution" value="${esc(p.distribution||'')}" placeholder="Península ibérica, Europa…">`)}${field('Tamaño',`<input name="size" value="${esc(p.size||'')}" placeholder="Reina 14–16 mm · obreras 6–12 mm">`)}<div class="row">${field('Dificultad',`<select name="difficulty">${['','Fácil','Media','Alta','Experta'].map(x=>`<option ${p.difficulty===x?'selected':''}>${x}</option>`).join('')}</select>`)}${field('Temperatura',`<input name="temperature" value="${esc(p.temperature||'')}" placeholder="22–27 °C">`)}</div>${field('Humedad',`<input name="humidity" value="${esc(p.humidity||'')}" placeholder="Zona húmeda / zona seca">`)}${field('Alimentación',`<textarea name="diet" placeholder="Semillas, insectos, líquidos azucarados…">${esc(p.diet||'')}</textarea>`)}${field('Curiosidades',`<textarea name="curiosities">${esc(p.curiosities||'')}</textarea>`)}<button class="button">Guardar en la AntDex</button></form>`);$('#speciesForm').onsubmit=e=>{e.preventDefault();db.speciesProfiles[k]=Object.fromEntries(new FormData(e.target));save();closeModal();toast('Ficha de especie guardada');render()}}

function scanForm(colonyId=''){openModal(`<h2>🔎 AntScan asistido</h2><p class="modal-intro">Revisión local y guiada. La app no envía la foto ni afirma identificar automáticamente la especie.</p><form id="scanForm" class="form">${field('Colonia',`<select name="colonyId">${colonyOptions(colonyId)}</select>`)}${field('Foto para revisar',`<input name="photo" type="file" accept="image/*" required>`)}<div id="scanPreview" class="scan-preview">Selecciona una fotografía</div><div class="scan-checks"><label><input type="checkbox" name="queen"> Veo la reina</label><label><input type="checkbox" name="eggs"> Veo huevos</label><label><input type="checkbox" name="larvae"> Veo larvas</label><label><input type="checkbox" name="pupae"> Veo pupas</label><label><input type="checkbox" name="mold"> Posible moho o suciedad</label><label><input type="checkbox" name="condensation"> Condensación excesiva</label><label><input type="checkbox" name="stress"> Actividad o estrés inusual</label></div>${field('Obreras visibles (aprox.)',`<input name="workers" type="number" min="0" placeholder="Opcional">`)}${field('Observaciones',`<textarea name="notes" placeholder="Qué te preocupa o qué quieres comprobar"></textarea>`)}<button class="button">Generar informe local</button><button type="button" class="button secondary" id="shareScan">Compartir foto para consulta</button></form>`);
 const input=$('#scanForm input[name=photo]');input.onchange=()=>{const f=input.files[0];if(f)$('#scanPreview').innerHTML=`<img src="${URL.createObjectURL(f)}" alt="Vista previa">`};
 $('#shareScan').onclick=async()=>{const f=input.files[0];if(!f)return toast('Selecciona una fotografía');const file=new File([f],f.name||'antscan.jpg',{type:f.type||'image/jpeg'}),text='Analiza esta fotografía de mi colonia de hormigas. Indica lo observable, posibles señales de cría, reina, estrés, humedad o moho, y separa claramente hechos de hipótesis.';try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],text,title:'Consulta AntScan'});else{await navigator.clipboard?.writeText(text);toast('Texto de consulta copiado')}}catch{}}
 $('#scanForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),flags=['queen','eggs','larvae','pupae','mold','condensation','stress'].filter(k=>fd.get(k)==='on'),recommendations=[];if(flags.includes('mold'))recommendations.push('Retira restos y revisa ventilación sin perturbar la cámara de cría.');if(flags.includes('condensation'))recommendations.push('Reduce ligeramente la hidratación y mejora la ventilación de forma gradual.');if(flags.includes('stress'))recommendations.push('Reduce luz, vibraciones y manipulaciones durante las próximas horas.');if(!flags.some(x=>['eggs','larvae','pupae'].includes(x)))recommendations.push('La cría puede estar oculta: observa de nuevo con luz suave y sin mover el nido.');if(flags.includes('queen'))recommendations.push('La reina ha sido localizada visualmente; evita exposiciones prolongadas.');const summary=[fd.get('workers')?`${fd.get('workers')} obreras visibles`:null,flags.includes('queen')?'reina visible':null,flags.filter(x=>['eggs','larvae','pupae'].includes(x)).map(x=>({eggs:'huevos',larvae:'larvas',pupae:'pupas'}[x])).join(', ')].filter(Boolean).join(' · ')||'Inspección visual registrada';db.scanReports.push({id:uid('scan'),colonyId:fd.get('colonyId'),date:today(),summary,flags,notes:fd.get('notes'),recommendations});save();closeModal();openModal(`<h2>Informe AntScan</h2><div class="scan-report"><b>${esc(summary)}</b>${recommendations.map(x=>`<p>• ${esc(x)}</p>`).join('')}<small>Estas sugerencias son orientativas y se basan en lo que has marcado.</small></div><button class="button" onclick="closeModal();render()">Cerrar</button>`)}
}

function scansView(){const arr=db.scanReports.slice().reverse();return `<div class="section-title"><div><h2>🔎 AntScan</h2><p>Revisión visual guiada de colonias</p></div><button class="button" data-new-scan>＋ Inspección</button></div><div class="cards">${arr.map(x=>`<div class="card"><b>${esc(x.date)} · ${esc(colonyName(x.colonyId))}</b><div class="sub">${esc(x.summary)}</div>${x.notes?`<div class="sub">${esc(x.notes)}</div>`:''}</div>`).join('')||'<div class="empty">Todavía no has realizado inspecciones.</div>'}</div>`}

function encyclopediaView(){return `<div class="section-title"><div><h2>📖 Enciclopedia</h2><p>Fichas de las especies de tu AntDex</p></div></div><div class="cards">${db.colonies.map(c=>{const p=profileFor(c);return `<article class="card encyclopedia-row" data-colony="${esc(c.id)}"><div class="avatar" id="cover-${esc(c.id)}">🐜</div><div><b>${esc(c.species||c.name)}</b><div class="sub">${esc(p.difficulty||'Dificultad sin valorar')} · ${esc(p.temperature||'Temperatura pendiente')}</div></div><button class="icon-btn" data-edit-species="${esc(c.id)}">✎</button></article>`}).join('')}</div>`}

more=function(){ensureV5Data();const tab=db.appConfig.moreTab||'tools';const tabs=[['tools','Herramientas'],['encyclopedia','Enciclopedia'],['scanner','AntScan'],['achievements','Logros'],['calendar','Calendario'],['fauna','Fauna'],['environment','Ambiente'],['search','Buscar']];if(tab==='achievements')return `<div class="tabs pro-tabs">${tabs.map(([k,l])=>`<button class="${tab===k?'active':''}" data-more-tab="${k}">${l}</button>`).join('')}</div>${achievementsView()}`;if(tab==='scanner')return `<div class="tabs pro-tabs">${tabs.map(([k,l])=>`<button class="${tab===k?'active':''}" data-more-tab="${k}">${l}</button>`).join('')}</div>${scansView()}`;if(tab==='encyclopedia')return `<div class="tabs pro-tabs">${tabs.map(([k,l])=>`<button class="${tab===k?'active':''}" data-more-tab="${k}">${l}</button>`).join('')}</div>${encyclopediaView()}`;const html=v5BaseMore();return html.replace(/<div class="tabs pro-tabs">[\s\S]*?<\/div>/,`<div class="tabs pro-tabs">${tabs.map(([k,l])=>`<button class="${tab===k?'active':''}" data-more-tab="${k}">${l}</button>`).join('')}</div>`).replace('ANTELMO V4.2','ANTELMO V5.0');}

home=function(){const unlocked=achievementDefinitions().filter(x=>x[4]).length;return v5BaseHome()+`<div class="section-title"><div><h2>Tu aventura AntDex</h2><p>Progreso de colección</p></div></div><div class="adventure-card"><div><span>🏆</span><b>${unlocked}/${achievementDefinitions().length} logros</b><small>Sigue documentando tus colonias</small></div><button class="button secondary" data-open-achievements>Ver logros</button></div>`}

stats=function(){return v5BaseStats()+`<div class="section-title"><div><h2>Rangos AntDex</h2><p>Nivel estimado por actividad y población</p></div></div><div class="cards">${db.colonies.map(c=>`<div class="card rank-row"><div><b>${esc(c.name)}</b><div class="sub">Nivel ${rankFor(c)}</div></div><div class="level-track"><i style="width:${progressToNext(c)}%"></i></div></div>`).join('')}</div>`}

bind=function(){v5BaseBind();ensureV5Data();$$('[data-edit-species]').forEach(b=>b.onclick=e=>{e.stopPropagation();speciesForm(b.dataset.editSpecies)});$$('[data-scan-for]').forEach(b=>b.onclick=()=>scanForm(b.dataset.scanFor));$('[data-new-scan]')&&($('[data-new-scan]').onclick=()=>scanForm());$$('[data-open-achievements]').forEach(b=>b.onclick=()=>{route='more';db.appConfig.moreTab='achievements';save();render()});}

const v5BaseBoot=boot;
boot=async function(){await v5BaseBoot();ensureV5Data();save();};
