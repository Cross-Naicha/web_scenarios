'use strict';
const excludedTypes=new Set(['treasure','special','trap','traps']);
const allowedComponent=row=>!excludedTypes.has(String(row.type).trim().toLowerCase());
const fullCatalog=window.EXTRA_COMPONENTS||[];
function hideExcludedReverse(row){
 const source=fullCatalog.find(component=>component.id===row.id);
 const reverse=fullCatalog.find(component=>component.id===(row.reverseId??source?.reverseId));
 return reverse&&!allowedComponent(reverse)?{...row,reverse:null,reverseId:null}:row;
}
const data = window.SCENARIOS_DATA.filter(allowedComponent).map(hideExcludedReverse);
const rawExtraCatalog = fullCatalog.filter(allowedComponent).map(hideExcludedReverse);
const piecePriority=r=>['Doors','Corridors'].includes(r.type)?0:1;
const extraCatalog = rawExtraCatalog.filter(r=>!rawExtraCatalog.some(other=>other.id===r.reverseId&&(piecePriority(other)<piecePriority(r)||(piecePriority(other)===piecePriority(r)&&other.id<r.id)))).map(r=>({...r,faceIds:[r.id,r.reverseId].filter(id=>id!=null),reverseType:rawExtraCatalog.find(other=>other.id===r.reverseId)?.type}));
function pieceName(row){return row.faceIds&&row.reverse?`${row.name} ↔ ${row.reverse}`:row.name;}
function samePiece(a,b){return (a.faceIds||[a.id]).some(id=>(b.faceIds||[b.id]).includes(id));}
let additions = {};
try { additions = JSON.parse(localStorage.getItem('gloomhaven-additions') || '{}') || {}; } catch {}
function scenarioRows(){
 const original=data.filter(r=>r.scenario===selectedScenario);
 const added=extraCatalog.filter(r=>r.faceIds.some(id=>(additions[selectedScenario]||[]).includes(id))&&!original.some(o=>samePiece(r,o))).map(r=>({...r,scenario:selectedScenario,manual:true}));
 return [...original,...added];
}
function saveAdditions(){try{localStorage.setItem('gloomhaven-additions',JSON.stringify(additions));}catch{}}
const labels = {'Enemy':'Enemigos','Boss':'Jefes','Obstacles':'Obstáculos','Hazardous Terrain':'Terreno peligroso','Difficult Terrain':'Terreno difícil'};
const scenario = document.querySelector('#scenario'), type = document.querySelector('#type'), search = document.querySelector('#search');
const order = document.querySelector('#order');
labels.Doors='Puertas';labels.Corridors='Corredores';
let marks = {};
try { marks = JSON.parse(localStorage.getItem('gloomhaven-prepared') || '{}') || {}; } catch {}
for(const [scenarioId,ids] of Object.entries(additions)){
 const pieces=extraCatalog.filter(r=>r.faceIds.some(id=>ids.includes(id)));
 additions[scenarioId]=pieces.map(r=>r.id);
 for(const piece of pieces){if(piece.faceIds.some(id=>marks[`${scenarioId}:${id}`]))marks[`${scenarioId}:${piece.id}`]=true;}
}
saveAdditions();persist();
const scenarios = [...new Set(data.map(row => row.scenario))].sort((a,b)=>a-b);
scenario.value = scenarios[0];
Object.keys(labels).filter(t=>[...data,...extraCatalog].some(r=>r.type===t)).forEach(t=>type.add(new Option(labels[t],t)));
const requested = Number(new URLSearchParams(location.search).get('scenario'));
if (scenarios.includes(requested)) scenario.value = requested;
let selectedScenario = Number(scenario.value);
let selectedBag = null;
function key(row){return `${row.scenario}:${row.id}`;}
function persist(){try{localStorage.setItem('gloomhaven-prepared',JSON.stringify(marks));}catch{}}
function sizeBadge(size){
 const badge=document.createElement('span');badge.className='size-badge';
 const label=`${size} ${size===1?'hexágono':'hexágonos'}`;badge.setAttribute('aria-label',label);badge.title=label;
 const layouts={1:[[10,10]],2:[[10,10],[26,10]],3:[[18,10],[10,24],[26,24]]};
 if(!layouts[size]){badge.textContent=label;return badge;}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox',size===1?'0 0 20 20':size===2?'0 0 36 20':'0 0 36 34');svg.setAttribute('aria-hidden','true');
 for(const [x,y] of layouts[size]){
  const hex=document.createElementNS(ns,'polygon');
  hex.setAttribute('points',[[0,-9],[8,-4.5],[8,4.5],[0,9],[-8,4.5],[-8,-4.5]].map(([dx,dy])=>`${x+dx},${y+dy}`).join(' '));svg.append(hex);
 }
 badge.append(svg);return badge;
}
const componentDialog=document.querySelector('#component-dialog');
document.querySelector('#component-close').addEventListener('click',()=>componentDialog.close());
componentDialog.addEventListener('click',event=>{if(event.target===componentDialog){const box=componentDialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)componentDialog.close();}});
function showComponent(row){
 document.querySelector('#component-title').textContent=pieceName(row);
 const image=document.querySelector('#component-image'), note=document.querySelector('#component-image-note');
 const source=(window.COMPONENT_IMAGES||{})[row.id]||`img/${row.id}.jpeg`;
 image.hidden=true;note.hidden=!!source;
 image.onload=()=>{image.hidden=false;note.hidden=true;};
 image.onerror=()=>{image.hidden=true;note.hidden=false;};
 image.alt=row.name;
 if(source)image.src=source;else image.removeAttribute('src');
 let faces=document.querySelector('#component-faces');
 if(!faces){faces=document.createElement('div');faces.id='component-faces';image.after(faces);}
 faces.replaceChildren();faces.hidden=!row.faceIds;
 if(row.faceIds){image.onload=null;image.onerror=null;image.hidden=true;note.hidden=true;appendFaces(faces,row);}
 const details=document.querySelector('#component-details');details.replaceChildren();
 for(const [label,value] of [['Bolsa',row.bag??'Sin asignar'],['Tipo',labels[row.type]||row.type],['Cantidad disponible',row.quantity||'Sin indicar'],['Tamaño',row.size==null?'Sin indicar':`${row.size} ${row.size===1?'hexágono':'hexágonos'}`],['Reverso',row.reverse||'Sin indicar'],['ID del componente',row.id]]){
  const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=label;description.textContent=value;details.append(term,description);
 }
 componentDialog.showModal();
}
function render(){
 const rows=scenarioRows();
 const bags=[...new Set(rows.map(r=>r.bag).filter(b=>b!=null))].sort((a,b)=>a-b);
 const bagList=document.querySelector('#bags');bagList.replaceChildren();
 for(const bag of bags){
  const badge=document.createElement('button');badge.type='button';badge.textContent=`Bolsa ${bag}`;badge.dataset.bag=bag;
  badge.setAttribute('aria-pressed',String(selectedBag===bag));
  badge.addEventListener('click',()=>{selectedBag=selectedBag===bag?null:bag;render();document.querySelector(`#bags button[data-bag="${bag}"]`)?.focus();});
  bagList.append(badge);
 }
 const missing=rows.filter(r=>r.bag==null).length;
 document.querySelector('#bags-note').textContent=(bags.length?`${bags.length} ${bags.length===1?'bolsa':'bolsas'} para el escenario completo.`:'No hay bolsas indicadas para este escenario.')+(missing?` ${missing} ${missing===1?'componente no tiene bolsa asignada':'componentes no tienen bolsa asignada'}.`:'');
 const visible=rows.filter(r=>(selectedBag===null||r.bag===selectedBag)&&(!type.value||r.type===type.value||r.reverseType===type.value));
 document.querySelector('#title').textContent=`Escenario ${selectedScenario}`;
 const completed=rows.filter(r=>marks[key(r)]).length;
 document.querySelector('#progress').textContent=`${completed} de ${rows.length} componentes listos`;
 document.querySelector('#bar').max=rows.length||1;document.querySelector('#bar').value=completed;
 const container=document.querySelector('#groups');container.replaceChildren();
 const byBag=order.value==='bag';
 const categories=[...new Set(visible.map(r=>byBag?r.bag:r.type))];
 if(byBag) categories.sort((a,b)=>a==null?1:b==null?-1:a-b);
 for(const category of categories){
  const section=document.createElement('section');section.className='group';
  const title=document.createElement('h3');title.textContent=byBag?(category==null?'Sin bolsa asignada':`Bolsa ${category}`):(labels[category]||category);
  const count=document.createElement('span');const items=visible.filter(r=>(byBag?r.bag:r.type)===category);if(byBag)items.sort((a,b)=>a.name.localeCompare(b.name));count.textContent=items.length;title.append(count);section.append(title);
  const cards=document.createElement('div');cards.className='cards';
  for(const row of items){
   const card=document.createElement('div');card.className='card'+(marks[key(row)]?' checked':'');
   card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',`${row.name}: ${marks[key(row)]?'preparado; tocar para desmarcar':'pendiente; tocar para marcar'}`);
   card.addEventListener('click',event=>{if(event.target.closest('button, input'))return;marks[key(row)]=!marks[key(row)];persist();render();});
   card.addEventListener('keydown',event=>{if(event.target!==card||!['Enter',' '].includes(event.key))return;event.preventDefault();const index=[...document.querySelectorAll('.card')].indexOf(card);marks[key(row)]=!marks[key(row)];persist();render();document.querySelectorAll('.card')[index]?.focus();});
   const check=document.createElement('input');check.type='checkbox';check.checked=!!marks[key(row)];check.setAttribute('aria-label',`Preparado: ${row.name}`);
   check.addEventListener('change',()=>{marks[key(row)]=check.checked;persist();render();});
   const content=document.createElement('div'),name=document.createElement('strong');name.textContent=pieceName(row);content.append(name);
   if(row.reverse){const reverse=document.createElement('small');reverse.textContent=`Reverso: ${row.reverse}`;content.append(reverse);}
   const meta=document.createElement('div');meta.className='meta';
   const details=[row.bag==null?null:`B${row.bag}`,row.quantity?`${String(row.quantity).replace(/^x/i,'')} u.`:null];
   for(const text of details.filter(Boolean)){const badge=document.createElement('span');badge.textContent=text;meta.append(badge);}
   if(row.size!=null)meta.append(sizeBadge(row.size));content.append(meta);
   const view=document.createElement('button');view.type='button';view.className='component-view';view.textContent='!';view.setAttribute('aria-label',`Ver imagen y detalles de ${row.name}`);view.title='Ver imagen y detalles';view.addEventListener('click',event=>{event.stopPropagation();showComponent(row);});
   card.append(check,content,view);cards.append(card);
   if(row.manual){const remove=document.createElement('button');remove.type='button';remove.className='extra-remove';remove.textContent='Quitar del escenario';remove.addEventListener('click',event=>{event.stopPropagation();additions[selectedScenario]=(additions[selectedScenario]||[]).filter(id=>!row.faceIds.includes(id));for(const id of row.faceIds)delete marks[`${selectedScenario}:${id}`];saveAdditions();persist();render();});content.append(remove);}
  }section.append(cards);container.append(section);
 }
 document.querySelector('#empty').hidden=visible.length>0;
 renderExtraResults();
 renderCatalogResults();
}
function appendFaces(container,row){
 container.classList.add('piece-faces');
 for(const [id,name] of [[row.id,row.name],[row.reverseId,row.reverse]].filter(([id])=>id!=null)){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=name;
  const source=(window.COMPONENT_IMAGES||{})[id]||`img/${id}.jpeg`;
  if(source){const image=document.createElement('img');image.src=source;image.alt=name;image.loading='lazy';image.addEventListener('error',()=>{const missing=document.createElement('span');missing.textContent='Sin imagen';image.replaceWith(missing);});figure.append(image);}else{const missing=document.createElement('span');missing.textContent='Sin imagen';figure.append(missing);}
  figure.append(caption);container.append(figure);
 }
}
function renderExtraResults(){
 renderComponentResults(document.querySelector('#extra-results'),document.querySelector('#extra-search').value,extraCatalog.filter(r=>['Doors','Corridors'].includes(r.type)));
}
function renderCatalogResults(){
 const results=document.querySelector('#catalog-results');
 if(!search.value.trim()){results.replaceChildren();return;}
 renderComponentResults(results,search.value,extraCatalog);
}
function renderComponentResults(results,query,catalog){
 results.replaceChildren();
 const term=query.trim().toLocaleLowerCase();
 const current=scenarioRows();
 const matches=catalog.filter(r=>[r.name,r.reverse,labels[r.type],labels[r.reverseType],r.type,r.reverseType,`id ${r.id}`,r.reverseId==null?'':`id ${r.reverseId}`,`bolsa ${r.bag}`,`${r.size} hexágonos`].join(' ').toLocaleLowerCase().includes(term));
 for(const row of matches){
  const item=document.createElement('div');item.className='extra-result';
  const preview=document.createElement('button');preview.type='button';preview.className='extra-preview';preview.setAttribute('aria-label',`Ver detalles de ${row.name}`);preview.addEventListener('click',()=>showComponent(row));
  appendFaces(preview,row);
  const text=document.createElement('div');text.className='extra-caption';
  const name=document.createElement('strong');name.textContent=pieceName(row);
  const description=document.createElement('small');description.textContent=`${labels[row.type]} · ${row.size} ${row.size===1?'hexágono':'hexágonos'}${row.bag==null?'':` · Bolsa ${row.bag}`}${row.reverse?` · Reverso: ${row.reverse}`:''}`;text.append(name,description);
  const add=document.createElement('button');add.type='button';add.disabled=current.some(r=>samePiece(r,row));add.textContent=add.disabled?'Agregado':'Agregar';
  add.addEventListener('click',()=>{additions[selectedScenario]=[...new Set([...(additions[selectedScenario]||[]),row.id])];saveAdditions();selectedBag=null;type.value='';render();});item.append(preview,text,add);results.append(item);
 }
 if(!matches.length){const empty=document.createElement('p');empty.textContent='No hay componentes que coincidan.';results.append(empty);}
}
document.querySelector('#extra-search').addEventListener('input',renderExtraResults);
function chooseScenario(){
 const value=String(scenario.value).trim();
 const number=Number(value);
 const valid=/^[0-9]+$/.test(value)&&scenarios.includes(number);
 const error=document.querySelector('#scenario-error');
 error.hidden=valid;
 error.textContent=valid?'':'Ingresá el número de un escenario disponible.';
 scenario.setAttribute('aria-invalid',String(!valid));
 if(!valid)return;
 if(selectedScenario!==number)selectedBag=null;
 selectedScenario=number;scenario.value=number;
 const url=new URL(location.href);url.searchParams.set('scenario',number);history.replaceState(null,'',url);render();
}
scenario.addEventListener('change',chooseScenario);
scenario.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();chooseScenario();if(scenario.getAttribute('aria-invalid')==='false')scenario.blur();}});
scenario.addEventListener('focus',()=>scenario.select());
type.addEventListener('change',render);search.addEventListener('input',renderCatalogResults);order.addEventListener('change',render);
document.querySelector('#reset').addEventListener('click',()=>{scenarioRows().forEach(r=>delete marks[key(r)]);persist();render();});
render();
const sectionTabs=[document.querySelector('#scenario-tab'),document.querySelector('#level-tab')];
function switchSection(index){
 sectionTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
 document.querySelector('#scenario-panel').hidden=index!==0;
 document.querySelector('#level-panel').hidden=index!==1;
 document.querySelector('.section-switch').classList.toggle('show-level',index===1);
}
sectionTabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>switchSection(index));
 tab.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;
  switchSection(next);sectionTabs[next].focus();
 });
});
const partyInputs=[...document.querySelectorAll('.party-level')];
const difficulty=document.querySelector('#difficulty');
const levelTableBody=document.querySelector('#level-table-body');
const goldConversion=[2,2,3,3,4,4,5,6];
for(let level=0;level<=7;level++){
 const row=document.createElement('tr');row.dataset.level=level;
 for(const [index,value] of [level,level,goldConversion[level],level+2,4+level*2].entries()){
  const cell=document.createElement(index===0?'th':'td');cell.textContent=value;if(index===0)cell.setAttribute('scope','row');row.append(cell);
 }
 levelTableBody.append(row);
}
function calculatePartyLevel(values,modifier){
 if(values.some(value=>value!==''&&(!Number.isInteger(Number(value))||Number(value)<1||Number(value)>9)))return {error:'Ingresá niveles enteros entre 1 y 9.'};
 const levels=values.filter(value=>value!=='').map(Number);
 if(!levels.length)return {error:'Ingresá los niveles para calcular la fila correspondiente.'};
 const average=levels.reduce((sum,level)=>sum+level,0)/levels.length;
 const normal=Math.ceil(average/2);
 const adjusted=normal+modifier;
 return {average,normal,adjusted,level:Math.max(0,Math.min(7,adjusted)),count:levels.length};
}
function updatePartyLevel(){
 const result=calculatePartyLevel(partyInputs.map(input=>input.value.trim()),Number(difficulty.value));
 for(const row of levelTableBody.children){
  const selected=!result.error&&Number(row.dataset.level)===result.level;
  row.classList.toggle('selected-level',selected);
  if(selected)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');
 }
 for(const input of partyInputs){input.setAttribute('aria-invalid',String(input.value!==''&&(!Number.isInteger(Number(input.value))||Number(input.value)<1||Number(input.value)>9)));}
 const output=document.querySelector('#level-result');output.replaceChildren();
 if(result.error){output.textContent=result.error;return;}
 const heading=document.createElement('strong');heading.textContent=`Nivel de escenario: ${result.level}`;
 const detail=document.createElement('p');detail.textContent=`${result.count} ${result.count===1?'personaje':'personajes'} · Promedio: ${result.average.toLocaleString('es-AR',{maximumFractionDigits:2})} · Nivel normal: ${result.normal} · Ajuste: ${Number(difficulty.value)>0?'+':''}${difficulty.value}`;
 output.append(heading,detail);
 if(result.level!==result.adjusted){const note=document.createElement('p');note.textContent='Se aplicó el límite permitido de niveles 0 a 7.';output.append(note);}
}
partyInputs.forEach(input=>input.addEventListener('input',updatePartyLevel));
difficulty.addEventListener('change',updatePartyLevel);
updatePartyLevel();
let scenarioNotes={};
try{scenarioNotes=JSON.parse(localStorage.getItem('gloomhaven-scenario-notes')||'{}')||{};}catch{}
function currentNotes(){return scenarioNotes[selectedScenario]??= {traps:[],treasure:''};}
function saveNotes(){try{localStorage.setItem('gloomhaven-scenario-notes',JSON.stringify(scenarioNotes));}catch{}}
function trapDamageText(){
 const result=calculatePartyLevel(partyInputs.map(input=>input.value.trim()),Number(difficulty.value));
 return result.error?'Ingresá los niveles para calcular el daño.':`${result.level+2} de daño (nivel ${result.level})`;
}
function renderScenarioNotes(){
 document.querySelector('#notes-scenario').textContent=`Escenario ${selectedScenario}`;
 const notes=currentNotes(),list=document.querySelector('#trap-list');list.replaceChildren();
 if(!notes.traps.length){notes.traps.push({effects:'',selectedEffects:[],damage:false});saveNotes();}
 notes.traps.forEach((trap,index)=>{
  const item=document.createElement('div');item.className='trap-entry';
  const label=document.createElement('div');label.className='trap-effects';
  const heading=document.createElement('p');heading.textContent=`Trampa ${index+1} · Elegí uno o varios efectos`;label.append(heading);
  const options=[['Wound','Herida'],['Immobilize','Inmovilización'],['Curse','Maldición'],['Disarm','Desarme'],['Muddle','Confusión']];
  if(!Array.isArray(trap.selectedEffects)){const previous=String(trap.effects||'').toLocaleLowerCase();trap.selectedEffects=options.filter(([id,name])=>previous.includes(id.toLowerCase())||previous.includes(name.toLowerCase())).map(([id])=>id);}
  const buttons=document.createElement('div');buttons.className='trap-effect-buttons';buttons.setAttribute('role','group');buttons.setAttribute('aria-label',`Efectos de trampa ${index+1}`);
  for(const [id,name] of options){
   const button=document.createElement('button');button.type='button';button.textContent=name;button.title=`${id} Trap`;button.setAttribute('aria-pressed',String(trap.selectedEffects.includes(id)));
   button.addEventListener('click',()=>{trap.selectedEffects=trap.selectedEffects.includes(id)?trap.selectedEffects.filter(effect=>effect!==id):[...trap.selectedEffects,id];button.setAttribute('aria-pressed',String(trap.selectedEffects.includes(id)));saveNotes();});buttons.append(button);
  }
  label.append(buttons);
  if(trap.effects){const previous=document.createElement('small');previous.textContent=`Nota anterior: ${trap.effects}`;label.append(previous);}
  const damageLabel=document.createElement('label');damageLabel.className='damage-toggle';
  const damage=document.createElement('input');damage.type='checkbox';damage.checked=!!trap.damage;
  const text=document.createElement('span');text.textContent='Daño';damageLabel.append(damage,text);
  buttons.append(damageLabel);
  const output=document.createElement('span');output.className='trap-damage';output.hidden=!trap.damage;output.textContent=trapDamageText();
  damage.addEventListener('change',()=>{trap.damage=damage.checked;output.hidden=!trap.damage;output.textContent=trapDamageText();saveNotes();});
  const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.setAttribute('aria-label',`Quitar trampa ${index+1}`);remove.addEventListener('click',()=>{notes.traps.splice(index,1);saveNotes();renderScenarioNotes();});
  item.append(label,output,remove);list.append(item);
 });
 document.querySelector('#treasure-number').value=notes.treasure;
}
function refreshTrapDamage(){document.querySelectorAll('.trap-damage').forEach(output=>output.textContent=trapDamageText());}
document.querySelector('#treasure-number').addEventListener('input',event=>{event.target.value=event.target.value.replace(/[^0-9]/g,'');currentNotes().treasure=event.target.value;saveNotes();});
partyInputs.forEach(input=>input.addEventListener('input',refreshTrapDamage));difficulty.addEventListener('change',refreshTrapDamage);
scenario.addEventListener('change',renderScenarioNotes);scenario.addEventListener('keydown',event=>{if(event.key==='Enter')renderScenarioNotes();});
renderScenarioNotes();

function buildLevelMessage(){
 const values=partyInputs.map(input=>input.value.trim());
 const result=calculatePartyLevel(values,Number(difficulty.value));
 if(result.error)return {error:result.error};
 const notes=currentNotes();
 const effectNames={Wound:'Herida',Immobilize:'Inmovilización',Curse:'Maldición',Disarm:'Desarme',Muddle:'Confusión'};
 const difficultyNames={'-1':'Fácil','0':'Normal','1':'Difícil','2':'Muy difícil'};
 const lines=[`*Gloomhaven · Escenario ${selectedScenario}*`,'','*Personajes*'];
 values.forEach((value,index)=>{if(value){const name=document.querySelectorAll('.party-name')[index].value.trim()||`Personaje ${index+1}`;lines.push(`${name}: nivel ${value}`);}});
 lines.push('',`Dificultad: ${difficultyNames[difficulty.value]}`,`Nivel del escenario: ${result.level}`,'','*Valores del escenario*',`Nivel de monstruos: ${result.level}`,`Conversión de oro: ${goldConversion[result.level]} por ficha`,`Daño de trampas: ${result.level+2}`,`Experiencia adicional: ${4+result.level*2}`,'','*Trampas*');
 const traps=notes.traps.filter(trap=>trap.damage||(trap.selectedEffects||[]).length||trap.effects);
 if(!traps.length)lines.push('Sin efectos indicados.');
 traps.forEach((trap,index)=>{
  const effects=(trap.selectedEffects||[]).map(effect=>effectNames[effect]||effect);
  if(trap.damage)effects.push(`${result.level+2} de daño`);
  if(trap.effects)effects.push(`Nota: ${trap.effects}`);
  lines.push(`Trampa ${index+1}: ${effects.join(' + ')}`);
 });
 lines.push('',`Tesoro: ${notes.treasure||'Sin indicar'}`);
 return {message:lines.join('\n')};
}
document.querySelector('#share-level-whatsapp').addEventListener('click',()=>{
 const result=buildLevelMessage(),note=document.querySelector('#share-level-note');
 if(result.error){note.textContent=result.error;return;}
 note.textContent='El mensaje está listo en WhatsApp. Elegí el contacto y pulsá Enviar.';
 window.open(`https://wa.me/?text=${encodeURIComponent(result.message)}`,'_blank','noopener,noreferrer');
});
const partyNameInputs=[...document.querySelectorAll('.party-name')];
let rememberedNames=[];
try{rememberedNames=JSON.parse(localStorage.getItem('gloomhaven-party-names')||'[]');if(!Array.isArray(rememberedNames))rememberedNames=[];const names=JSON.parse(localStorage.getItem('gloomhaven-current-names')||'[]');partyNameInputs.forEach((input,index)=>input.value=names[index]||'');}catch{}
function renderNameOptions(){const list=document.querySelector('#party-names');list.replaceChildren();for(const name of rememberedNames){const option=document.createElement('option');option.value=name;list.append(option);}}
partyNameInputs.forEach(input=>input.addEventListener('change',()=>{
 const names=partyNameInputs.map(field=>field.value.trim());rememberedNames=[...new Set([...rememberedNames,...names.filter(Boolean)])].sort((a,b)=>a.localeCompare(b));
 try{localStorage.setItem('gloomhaven-party-names',JSON.stringify(rememberedNames));localStorage.setItem('gloomhaven-current-names',JSON.stringify(names));}catch{}
 renderNameOptions();
}));
renderNameOptions();
