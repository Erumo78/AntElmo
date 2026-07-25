/* ANTELMO V7.3.4 — Corrección de fechas y ayuda de escritura.
   Las fechas se escriben como DD/MM/AAAA y continúan guardándose como AAAA-MM-DD. */

function antelmoDateDigits(value=''){
  return String(value).replace(/\D/g,'').slice(0,8);
}

function antelmoFormatDateInput(value=''){
  const digits=antelmoDateDigits(value);
  if(digits.length<=2)return digits;
  if(digits.length<=4)return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

function antelmoValidLocalDate(value=''){
  const match=String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match)return false;
  const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
  if(year<1900||year>2100)return false;
  const date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}

function antelmoNormalizeLocalDate(value=''){
  const digits=antelmoDateDigits(value);
  if(digits.length!==8)return antelmoFormatDateInput(value);
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

prepareDateInputs=function(root=document){
  root?.querySelectorAll?.('input[type="date"], input[data-antelmo-date="true"]').forEach(input=>{
    const current=input.value;
    input.type='text';
    input.inputMode='numeric';
    input.autocomplete='off';
    input.placeholder='DD/MM/AAAA';
    input.maxLength=10;
    input.removeAttribute('pattern');
    input.dataset.antelmoDate='true';
    delete input.dataset.localDate;
    input.value=toDisplayDate(current).replace(/ ·.*$/,'');

    const validate=()=>{
      const empty=!input.value.trim();
      const valid=empty&&!input.required||antelmoValidLocalDate(input.value);
      input.setCustomValidity(valid?'':'Introduce una fecha real con formato DD/MM/AAAA');
      return valid;
    };

    input.addEventListener('input',()=>{
      const caret=input.selectionStart||input.value.length;
      const before=input.value;
      input.value=antelmoFormatDateInput(input.value);
      if(input.value!==before&&caret>=before.length)input.setSelectionRange(input.value.length,input.value.length);
      input.setCustomValidity('');
    });
    input.addEventListener('blur',()=>{input.value=antelmoNormalizeLocalDate(input.value);validate()});
    input.addEventListener('change',validate);
  });
};

function prepareSpanishWriting(root=document){
  const excluded=new Set(['species','name','tags','query','url','token','icon','collectionId']);
  root?.querySelectorAll?.('input[type="text"], input:not([type]), textarea').forEach(field=>{
    if(field.dataset.antelmoDate==='true'||excluded.has(field.name)||field.closest('[role="search"]'))return;
    field.lang='es';
    field.spellcheck=true;
    field.setAttribute('autocorrect','on');
    field.setAttribute('autocapitalize','sentences');
  });
}

const antelmoHotfixOpenModal=openModal;
openModal=function(html){
  antelmoHotfixOpenModal(html);
  prepareSpanishWriting(document.querySelector('#modalBody'));
};

document.addEventListener('submit',event=>{
  const inputs=[...(event.target.querySelectorAll?.('[data-antelmo-date="true"]')||[])];
  const invalid=inputs.find(input=>{
    const empty=!input.value.trim();
    const valid=empty&&!input.required||antelmoValidLocalDate(input.value);
    input.setCustomValidity(valid?'':'Introduce una fecha real con formato DD/MM/AAAA');
    return !valid;
  });
  if(invalid){
    event.preventDefault();event.stopImmediatePropagation();invalid.reportValidity();invalid.focus();
  }
},true);
