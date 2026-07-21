
const STORAGE_KEY = "antelmo_data_v1";
const WELCOME_KEY = "antelmo_started";

const defaultData = {
  colonies: [
    {id:1,name:"Colonia 1",species:"Messor barbarus",workers:200,queens:1,status:"Estable",founded:"2023-07-01",location:"Nido de tierra",notes:"Colonia con mayor población y abundante cría."},
    {id:2,name:"Colonia 2",species:"Messor barbarus",workers:120,queens:1,status:"Estable",founded:"2024-07-01",location:"Tubo y hormiguero acrílico",notes:"La reina y la cría permanecen en el tubo."},
    {id:3,name:"Colonia 3",species:"Messor barbarus",workers:25,queens:1,status:"Crecimiento",founded:"2026-07-10",location:"Mini caja de forrajeo",notes:"Semillas de chía, amapola y néctar."},
    {id:4,name:"Colonia 4",species:"Lasius niger",workers:12,queens:1,status:"Estable",founded:"2026-07-16",location:"Tubo de ensayo",notes:"Colonia joven."},
    {id:5,name:"Colonia 5",species:"Lasius flavus",workers:12,queens:1,status:"Estable",founded:"2026-07-14",location:"Tubo de ensayo",notes:"Hormiga ORO."},
    {id:6,name:"Colonia 6",species:"Crematogaster scutellaris",workers:7,queens:1,status:"Estable",founded:"2026-07-16",location:"Tubo de ensayo",notes:"Reina y siete obreras."},
    {id:7,name:"Colonia 7",species:"Camponotus barbaricus",workers:0,queens:1,status:"Pendiente de llegada",founded:"2026-07-21",location:"Sin asignar",notes:"Prevista para el 21 de julio de 2026."}
  ],
  feedings: [
    {id:1,colonyId:1,type:"Semillas",food:"Semillas de chía",date:"2026-07-20",notes:"Pequeña cantidad"},
    {id:2,colonyId:1,type:"Dulce",food:"Néctar azucarado",date:"2026-07-20",notes:"Algodón empapado"},
    {id:3,colonyId:3,type:"Semillas",food:"Semillas de amapola",date:"2026-07-18",notes:"Pequeña cantidad"},
    {id:4,colonyId:1,type:"Proteína",food:"Medio grillo disecado",date:"2026-07-16",notes:"Proteína"}
  ]
};

let data = loadData();
let route = "home";
let selectedColonyId = null;
let feedingFilter = "Todos";

function loadData(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultData);
  }catch{
    return structuredClone(defaultData);
  }
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function el(id){ return document.getElementById(id); }
function fmtDate(s){
  if(!s) return "Sin fecha";
  return new Date(s+"T12:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"});
}
function totalWorkers(){ return data.colonies.reduce((a,c)=>a+(Number(c.workers)||0),0); }

function render(){
  if(!localStorage.getItem(WELCOME_KEY)){
    document.querySelector(".bottom-nav").style.display="none";
    const tpl = el("welcome-template").content.cloneNode(true);
    el("app").replaceChildren(tpl);
    el("start-app").onclick=()=>{
      localStorage.setItem(WELCOME_KEY,"1");
      document.querySelector(".bottom-nav").style.display="grid";
      render();
    };
    return;
  }
  document.querySelector(".bottom-nav").style.display="grid";
  document.querySelectorAll(".bottom-nav button").forEach(b=>{
    b.classList.toggle("active", b.dataset.route===route);
    b.onclick=()=>{ route=b.dataset.route; selectedColonyId=null; render(); };
  });

  if(selectedColonyId!==null) return renderColonyDetail();
  if(route==="home") return renderHome();
  if(route==="colonies") return renderColonies();
  if(route==="feeding") return renderFeeding();
  if(route==="stats") return renderStats();
}

function renderHome(){
  const recent = [...data.colonies].slice(0,4);
  el("app").innerHTML=`
    <header class="header">
      <div><h1>¡Hola, Elmo! 🍃</h1><div class="sub">Bienvenido a tu hormiguero digital.</div></div>
      <button class="icon-btn" id="resetWelcome">↺</button>
    </header>
    <section class="summary">
      <strong>Resumen general</strong>
      <div class="summary-grid">
        <div class="metric"><strong>${data.colonies.length}</strong><span>Colonias</span></div>
        <div class="metric"><strong>${totalWorkers()}</strong><span>Obreras</span></div>
        <div class="metric"><strong>${data.colonies.reduce((a,c)=>a+(Number(c.queens)||0),0)}</strong><span>Reinas</span></div>
      </div>
    </section>
    <div class="section-title"><h2>Mis colonias</h2><button class="small-btn" id="seeAll">Ver todas</button></div>
    <div id="colony-list">${recent.map(colonyCard).join("")}</div>
    <div class="section-title"><h2>Última alimentación</h2></div>
    ${data.feedings.length ? feedingCard([...data.feedings].sort((a,b)=>b.date.localeCompare(a.date))[0]) : '<div class="empty">Sin registros todavía.</div>'}
  `;
  bindColonyCards();
  el("seeAll").onclick=()=>{route="colonies";render();};
  el("resetWelcome").onclick=()=>{localStorage.removeItem(WELCOME_KEY);render();};
}

function colonyCard(c){
  return `
    <article class="card colony-card" data-id="${c.id}">
      <div class="avatar">🐜</div>
      <div>
        <h3>${escapeHtml(c.name)}</h3>
        <div class="meta"><em>${escapeHtml(c.species)}</em><br>👥 ${c.workers} obreras · 👑 ${c.queens}</div>
      </div>
      <div class="status">${escapeHtml(c.status)}</div>
    </article>`;
}
function bindColonyCards(){
  document.querySelectorAll(".colony-card").forEach(card=>{
    card.onclick=()=>{selectedColonyId=Number(card.dataset.id);render();};
  });
}

function renderColonies(){
  el("app").innerHTML=`
    <header class="header"><div><h1>Colonias</h1><div class="sub">Gestiona todas tus colonias.</div></div></header>
    <div>${data.colonies.map(colonyCard).join("") || '<div class="empty">No hay colonias.</div>'}</div>
    <button class="fab" id="addColony">+</button>
  `;
  bindColonyCards();
  el("addColony").onclick=()=>renderColonyForm();
}

function renderColonyForm(colony=null){
  const c=colony||{name:"",species:"",workers:0,queens:1,status:"Estable",founded:"",location:"",notes:""};
  el("app").innerHTML=`
    <header class="header"><div><h1>${colony?"Editar":"Nueva"} colonia</h1></div><button class="icon-btn" id="cancel">✕</button></header>
    <section class="card">
      <form id="colonyForm" class="form-grid">
        <label>Nombre<input name="name" required value="${escapeAttr(c.name)}"></label>
        <label>Especie<input name="species" required value="${escapeAttr(c.species)}"></label>
        <label>Obreras<input name="workers" type="number" min="0" value="${c.workers}"></label>
        <label>Reinas<input name="queens" type="number" min="0" value="${c.queens}"></label>
        <label>Estado
          <select name="status">
            ${["Estable","Crecimiento","Observación","Pendiente de llegada"].map(s=>`<option ${s===c.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </label>
        <label>Fecha de fundación<input name="founded" type="date" value="${escapeAttr(c.founded)}"></label>
        <label>Ubicación<input name="location" value="${escapeAttr(c.location)}"></label>
        <label>Notas<textarea name="notes">${escapeHtml(c.notes)}</textarea></label>
        <button class="primary" type="submit">Guardar colonia</button>
      </form>
    </section>`;
  el("cancel").onclick=()=>render();
  el("colonyForm").onsubmit=e=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const obj=Object.fromEntries(fd.entries());
    obj.workers=Number(obj.workers)||0; obj.queens=Number(obj.queens)||0;
    if(colony){
      Object.assign(colony,obj);
    }else{
      obj.id=Date.now();
      data.colonies.push(obj);
    }
    saveData(); route="colonies"; selectedColonyId=null; render();
  };
}

function renderColonyDetail(){
  const c=data.colonies.find(x=>x.id===selectedColonyId);
  if(!c){selectedColonyId=null;return render();}
  const logs=data.feedings.filter(f=>f.colonyId===c.id).sort((a,b)=>b.date.localeCompare(a.date));
  el("app").innerHTML=`
    <header class="header">
      <button class="icon-btn" id="back">←</button>
      <button class="icon-btn" id="edit">Editar</button>
    </header>
    <section class="detail-hero">
      <div class="ant">🐜</div>
      <h1>${escapeHtml(c.name)}</h1>
      <p>${escapeHtml(c.species)}</p>
      <div class="detail-grid">
        <div class="info-chip"><span>Estado</span><strong>${escapeHtml(c.status)}</strong></div>
        <div class="info-chip"><span>Obreras</span><strong>${c.workers}</strong></div>
        <div class="info-chip"><span>Reinas</span><strong>${c.queens}</strong></div>
        <div class="info-chip"><span>Fundación</span><strong>${fmtDate(c.founded)}</strong></div>
      </div>
    </section>
    <section class="card">
      <h2>Información</h2>
      <p><strong>Ubicación:</strong> ${escapeHtml(c.location||"Sin indicar")}</p>
      <p><strong>Notas:</strong> ${escapeHtml(c.notes||"Sin notas")}</p>
    </section>
    <div class="section-title"><h2>Alimentación</h2><button class="small-btn" id="addFeed">Añadir</button></div>
    ${logs.length?logs.map(feedingCard).join(""):'<div class="empty">Sin registros de alimentación.</div>'}
    <div class="actions"><button class="danger" id="deleteColony">Eliminar colonia</button></div>
  `;
  el("back").onclick=()=>{selectedColonyId=null;render();};
  el("edit").onclick=()=>renderColonyForm(c);
  el("addFeed").onclick=()=>renderFeedingForm(c.id);
  el("deleteColony").onclick=()=>{
    if(confirm("¿Eliminar esta colonia y sus registros?")){
      data.colonies=data.colonies.filter(x=>x.id!==c.id);
      data.feedings=data.feedings.filter(x=>x.colonyId!==c.id);
      saveData();selectedColonyId=null;route="colonies";render();
    }
  };
}

function feedingCard(f){
  const colony=data.colonies.find(c=>c.id===f.colonyId);
  const icon={Semillas:"🌾",Proteína:"🦗",Dulce:"🍯",Otros:"🍃"}[f.type]||"🍃";
  return `<article class="card log-item">
    <div class="log-icon">${icon}</div>
    <div><strong>${escapeHtml(f.food)}</strong><div class="meta">${escapeHtml(colony?.name||"Colonia eliminada")} · ${escapeHtml(f.notes||"")}</div></div>
    <div class="date">${fmtDate(f.date)}</div>
  </article>`;
}

function renderFeeding(){
  const types=["Todos","Semillas","Proteína","Dulce","Otros"];
  let logs=[...data.feedings].sort((a,b)=>b.date.localeCompare(a.date));
  if(feedingFilter!=="Todos") logs=logs.filter(x=>x.type===feedingFilter);
  el("app").innerHTML=`
    <header class="header"><div><h1>Alimentación</h1><div class="sub">Historial de comidas y suplementos.</div></div></header>
    <div class="tabs">${types.map(t=>`<button data-type="${t}" class="${feedingFilter===t?"active":""}">${t}</button>`).join("")}</div>
    <div>${logs.map(feedingCard).join("") || '<div class="empty">Sin registros en esta categoría.</div>'}</div>
    <button class="fab" id="addFeed">+</button>
  `;
  document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{feedingFilter=b.dataset.type;render();});
  el("addFeed").onclick=()=>renderFeedingForm();
}

function renderFeedingForm(preselected=null){
  el("app").innerHTML=`
    <header class="header"><div><h1>Nueva alimentación</h1></div><button class="icon-btn" id="cancel">✕</button></header>
    <section class="card">
      <form id="feedingForm" class="form-grid">
        <label>Colonia<select name="colonyId">${data.colonies.map(c=>`<option value="${c.id}" ${c.id===preselected?"selected":""}>${escapeHtml(c.name)} — ${escapeHtml(c.species)}</option>`).join("")}</select></label>
        <label>Tipo<select name="type"><option>Semillas</option><option>Proteína</option><option>Dulce</option><option>Otros</option></select></label>
        <label>Alimento<input name="food" required placeholder="Ej.: semillas de chía"></label>
        <label>Fecha<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label>
        <label>Notas<textarea name="notes" placeholder="Cantidad, reacción de la colonia..."></textarea></label>
        <button class="primary" type="submit">Guardar registro</button>
      </form>
    </section>`;
  el("cancel").onclick=()=>render();
  el("feedingForm").onsubmit=e=>{
    e.preventDefault();
    const obj=Object.fromEntries(new FormData(e.target).entries());
    obj.id=Date.now(); obj.colonyId=Number(obj.colonyId);
    data.feedings.push(obj); saveData();
    if(preselected){selectedColonyId=preselected;}else{route="feeding";}
    render();
  };
}

function renderStats(){
  const max=Math.max(...data.colonies.map(c=>Number(c.workers)||0),1);
  el("app").innerHTML=`
    <header class="header"><div><h1>Estadísticas</h1><div class="sub">Vista general del proyecto.</div></div></header>
    <section class="card">
      <h2>Obreras por colonia</h2>
      <div class="chart">${data.colonies.map(c=>`
        <div class="bar-wrap">
          <div class="bar" style="height:${Math.max(8,(c.workers/max)*140)}px"></div>
          <span>${escapeHtml(c.name.replace("Colonia ","C"))}<br>${c.workers}</span>
        </div>`).join("")}
      </div>
    </section>
    <section class="card">
      <h2>Resumen</h2>
      <p><strong>${data.colonies.length}</strong> colonias registradas</p>
      <p><strong>${totalWorkers()}</strong> obreras estimadas</p>
      <p><strong>${data.feedings.length}</strong> registros de alimentación</p>
      <p><strong>${new Set(data.colonies.map(c=>c.species)).size}</strong> especies</p>
    </section>
    <div class="actions">
      <button class="secondary" id="exportData">Exportar copia</button>
      <button class="secondary" id="importData">Importar copia</button>
      <input type="file" id="importFile" accept="application/json" hidden>
    </div>
  `;
  el("exportData").onclick=()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="antelmo-copia.json";a.click();URL.revokeObjectURL(a.href);
  };
  el("importData").onclick=()=>el("importFile").click();
  el("importFile").onchange=async e=>{
    try{
      const text=await e.target.files[0].text();
      const parsed=JSON.parse(text);
      if(!parsed.colonies||!parsed.feedings) throw new Error();
      data=parsed;saveData();render();
    }catch{alert("La copia no es válida.");}
  };
}

function escapeHtml(v=""){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}
function escapeAttr(v=""){return escapeHtml(v);}

render();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
