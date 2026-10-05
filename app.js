'use strict';
const data = window.SCENARIOS_DATA;
const labels = {'Enemy':'Enemigos','Boss':'Jefes','Obstacles':'Obstáculos','Trap':'Trampas','Treasure':'Tesoros','Hazardous Terrain':'Terreno peligroso','Difficult Terrain':'Terreno difícil','Special':'Especiales'};
const scenario = document.querySelector('#scenario'), type = document.querySelector('#type'), search = document.querySelector('#search');
const order = document.querySelector('#order');
let marks = {};
try { marks = JSON.parse(localStorage.getItem('gloomhaven-prepared') || '{}') || {}; } catch {}
const scenarios = [...new Set(data.map(row => row.scenario))].sort((a,b)=>a-b);
scenarios.forEach(n => scenario.add(new Option(`Escenario ${n}`, n)));
Object.keys(labels).filter(t=>data.some(r=>r.type===t)).forEach(t=>type.add(new Option(labels[t],t)));
const requested = Number(new URLSearchParams(location.search).get('scenario'));
if (scenarios.includes(requested)) scenario.value = requested;
function key(row){return `${row.scenario}:${row.id}`;}
function persist(){try{localStorage.setItem('gloomhaven-prepared',JSON.stringify(marks));}catch{}}
function render(){
 const rows=data.filter(r=>r.scenario===Number(scenario.value));
 const bags=[...new Set(rows.map(r=>r.bag).filter(b=>b!=null))].sort((a,b)=>a-b);
 const bagList=document.querySelector('#bags');bagList.replaceChildren();
 for(const bag of bags){const badge=document.createElement('span');badge.textContent=`Bolsa ${bag}`;bagList.append(badge);}
 const missing=rows.filter(r=>r.bag==null).length;
 document.querySelector('#bags-note').textContent=(bags.length?`${bags.length} ${bags.length===1?'bolsa':'bolsas'} para el escenario completo.`:'No hay bolsas indicadas para este escenario.')+(missing?` ${missing} ${missing===1?'componente no tiene bolsa asignada':'componentes no tienen bolsa asignada'}.`:'');
 const term=search.value.trim().toLocaleLowerCase();
 const visible=rows.filter(r=>(!type.value||r.type===type.value)&&[r.name,r.reverse,labels[r.type],r.type,r.bag==null?'':`bolsa ${r.bag}`].filter(Boolean).join(' ').toLocaleLowerCase().includes(term));
 document.querySelector('#title').textContent=`Escenario ${scenario.value}`;
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
   const card=document.createElement('label');card.className='card'+(marks[key(row)]?' checked':'');
   const check=document.createElement('input');check.type='checkbox';check.checked=!!marks[key(row)];
   check.addEventListener('change',()=>{marks[key(row)]=check.checked;persist();render();});
   const content=document.createElement('div'),name=document.createElement('strong');name.textContent=row.name;content.append(name);
   if(row.reverse){const reverse=document.createElement('small');reverse.textContent=`Reverso: ${row.reverse}`;content.append(reverse);}
   const meta=document.createElement('div');meta.className='meta';
   const details=[row.bag==null?'Bolsa sin indicar':`Bolsa ${row.bag}`,row.quantity?`${row.quantity} disponibles`:'Cantidad sin indicar',row.size==null?null:`${row.size} ${row.size===1?'hexágono':'hexágonos'}`];
   for(const text of details.filter(Boolean)){const badge=document.createElement('span');badge.textContent=text;meta.append(badge);}content.append(meta);card.append(check,content);cards.append(card);
  }section.append(cards);container.append(section);
 }
 document.querySelector('#empty').hidden=visible.length>0;
}
scenario.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('scenario',scenario.value);history.replaceState(null,'',url);render();});
type.addEventListener('change',render);search.addEventListener('input',render);order.addEventListener('change',render);
document.querySelector('#reset').addEventListener('click',()=>{data.filter(r=>r.scenario===Number(scenario.value)).forEach(r=>delete marks[key(r)]);persist();render();});
render();
