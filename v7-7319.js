/* ANTELMO V7.3.19 — corrige el diseño móvil de la galería de Terrarios. */

function antelmoV7319VersionBadge(){
  const eyebrow=document.querySelector('.topbar .eyebrow');
  if(eyebrow)eyebrow.textContent='MI MUNDO DE HORMIGAS · V7.3.19';
}

const antelmoV7319Render=render;
render=function(){
  antelmoV7319Render();
  antelmoV7319VersionBadge();
};

(function(){
  if(document.querySelector('#antelmo-v7319-styles'))return;
  const style=document.createElement('style');
  style.id='antelmo-v7319-styles';
  style.textContent=`
  /* Galería compacta: evita que los controles ocupen toda la altura de la tarjeta. */
  .v7315-gallery{
    display:grid !important;
    grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    gap:10px !important;
    align-items:start !important;
  }
  .v7315-photo{
    display:flex !important;
    flex-direction:column !important;
    align-items:stretch !important;
    justify-content:flex-start !important;
    height:auto !important;
    min-height:0 !important;
    padding:0 !important;
    margin:0 !important;
    overflow:visible !important;
  }
  .v7318-photo-open{
    display:block !important;
    width:100% !important;
    height:auto !important;
    min-height:0 !important;
    padding:0 !important;
    margin:0 !important;
    border:0 !important;
    background:transparent !important;
  }
  .v7318-photo-open>div{
    width:100% !important;
    aspect-ratio:1.25/1 !important;
    height:auto !important;
    min-height:0 !important;
    overflow:hidden !important;
    border-radius:12px !important;
  }
  .v7318-photo-open img{
    display:block !important;
    width:100% !important;
    height:100% !important;
    object-fit:cover !important;
  }
  .v7315-photo>small{
    display:block !important;
    margin:6px 0 1px !important;
    line-height:1.2 !important;
  }
  .v7315-photo>b{
    display:block !important;
    margin:0 !important;
    line-height:1.25 !important;
  }
  .v7318-photo-actions{
    display:flex !important;
    flex-direction:row !important;
    align-items:center !important;
    justify-content:flex-start !important;
    gap:6px !important;
    width:auto !important;
    height:auto !important;
    min-height:0 !important;
    padding:0 !important;
    margin:7px 0 0 !important;
    background:transparent !important;
  }
  .v7318-photo-actions button{
    display:inline-grid !important;
    place-items:center !important;
    flex:0 0 36px !important;
    width:36px !important;
    min-width:36px !important;
    max-width:36px !important;
    height:32px !important;
    min-height:32px !important;
    max-height:32px !important;
    padding:0 !important;
    margin:0 !important;
    border:1px solid var(--line) !important;
    border-radius:9px !important;
    background:var(--surface2) !important;
    font-size:17px !important;
    line-height:1 !important;
  }
  .v7315-photo>i{
    display:block !important;
    margin-top:5px !important;
    line-height:1.2 !important;
  }
  .v7315-photo.is-cover{
    outline:2px solid var(--green) !important;
    outline-offset:3px !important;
  }
  @media (max-width:390px){
    .v7315-gallery{gap:8px !important;}
  }
  `;
  document.head.appendChild(style);
})();
