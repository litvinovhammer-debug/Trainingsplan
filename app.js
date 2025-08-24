// ----- Persistenter State -----
const KEY = "trainer-state-v1";

const emptyDays = () => ({ mo:"", di:"", mi:"", do:"", fr:"", sa:"", so:"" });
const newPlan = (title="Neuer Plan") => ({ id: crypto.randomUUID(), title, days: emptyDays() });
const newAthlete = (name="Neuer Athlet") => ({ id: crypto.randomUUID(), name, plans: [newPlan("Neuer Plan")] });

let state = {
  athletes: [ newAthlete("Emma"), newAthlete("Filipp") ],
  selectedAthleteId: null,
  selectedPlanId: null,
  exercises: ["Reißen"]
};
try { const d = JSON.parse(localStorage.getItem(KEY)); if (d?.athletes) state = d; } catch {}
const save = () => localStorage.setItem(KEY, JSON.stringify(state));

// ----- Helpers -----
const $ = s => document.querySelector(s);
const el = (t,p={},...k) => { const n=document.createElement(t); Object.assign(n,p); k.flat().forEach(x=>n.append(x)); return n; };
const getAthlete = () => state.athletes.find(a=>a.id===state.selectedAthleteId);
const getPlan = a => a?.plans.find(p=>p.id===state.selectedPlanId);

// Tap vs Long-press
function press(node,{onTap,onLongPress,ms=600}){let id=null,long=false;
  node.addEventListener('pointerdown',()=>{long=false; id=setTimeout(()=>{long=true; onLongPress?.();},ms);});
  const end=()=>{clearTimeout(id); if(!long) onTap?.();};
  node.addEventListener('pointerup',end); node.addEventListener('pointerleave',()=>clearTimeout(id));
}

// ----- Rendering -----
function render(){ renderAthletes(); renderPlansAndWeek(); renderExercises(); }

function renderAthletes(){
  const ul=$("#athleteList"); ul.innerHTML="";
  state.athletes.forEach(a=>{
    const li=el("li");
    const name=el("span",{textContent:a.name||"Athlet"});
    const del=el("button",{className:"btn small",textContent:"–",title:"Löschen"});
    press(li,{
      onTap:()=>{ state.selectedAthleteId=a.id; state.selectedPlanId=(getPlan(a)?.id ?? a.plans[0]?.id ?? null); save(); render(); },
      onLongPress:()=>{ const n=prompt("Athletenname ändern",a.name); if(n!=null){ a.name=n.trim(); save(); render(); } }
    });
    del.onclick=()=>{ if(!confirm(`„${a.name}“ löschen?`))return;
      state.athletes=state.athletes.filter(x=>x.id!==a.id);
      if(state.selectedAthleteId===a.id){state.selectedAthleteId=null; state.selectedPlanId=null;}
      save(); render();
    };
    if(state.selectedAthleteId===a.id) li.classList.add("selected");
    li.append(name,del); ul.append(li);
  });
  $("#addAthlete").onclick=()=>{ const a=newAthlete(); state.athletes.unshift(a); state.selectedAthleteId=a.id; state.selectedPlanId=a.plans[0].id; save(); render(); };
}

function renderPlansAndWeek(){
  const tabs=$("#planTabs"); const week=$("#week"); tabs.innerHTML=""; week.innerHTML="";
  const a=getAthlete(); if(!a){ week.append(el("p",{textContent:"Athleten wählen…"})); return; }

  a.plans.forEach(p=>{
    const t=el("div",{className:"tab",textContent:p.title||"Plan"}); if(p.id===state.selectedPlanId) t.classList.add("active");
    press(t,{
      onTap:()=>{ state.selectedPlanId=p.id; save(); renderWeek(week,p); setActive(p.id); },
      onLongPress:()=>{ const n=prompt("Planname ändern",p.title); if(n!=null){ p.title=n.trim(); save(); render(); } }
    });
    tabs.append(t);
  });
  $("#addPlan").onclick=()=>{ const p=newPlan(); a.plans.unshift(p); state.selectedPlanId=p.id; save(); render(); };

  const cur=getPlan(a) || a.plans[0]; if(cur && !state.selectedPlanId){ state.selectedPlanId=cur.id; save(); }
  if(cur) renderWeek(week,cur);

  function setActive(id){[...tabs.children].forEach((c,i)=>c.classList.toggle("active", a.plans[i].id===id));}
}

function renderWeek(container, plan){
  container.innerHTML="";
  const daysTop=[["Montag","mo"],["Dienstag","di"],["Mittwoch","mi"]];
  const daysBot=[["Donnerstag","do"],["Freitag","fr"],["Samstag","sa"],["Sonntag","so"]];
  const top=el("div",{className:"grid2 topRow topRowWrap"}); const bot=el("div",{className:"grid2 botRow"});

  const box=([label,key])=>{
    const wrap=el("div",{className:"day"});
    const h=el("h3",{textContent:label});
    const ta=el("textarea",{value:plan.days[key]||""});
    ta.addEventListener("input",()=>{plan.days[key]=ta.value; save();});
    ta.addEventListener("dragover",e=>{e.preventDefault(); wrap.classList.add("dragover");});
    ta.addEventListener("dragleave",()=>wrap.classList.remove("dragover"));
    ta.addEventListener("drop",e=>{
      e.preventDefault(); wrap.classList.remove("dragover");
      const txt=e.dataTransfer.getData("text/plain"); if(!txt) return;
      ta.value=(ta.value?ta.value+"\n":"")+txt; plan.days[key]=ta.value; save();
    });
    wrap.append(h,ta); return wrap;
  };
  daysTop.forEach(d=>top.append(box(d))); daysBot.forEach(d=>bot.append(box(d)));
  container.append(top,bot);
}

function renderExercises(){
  const ul=$("#exerciseList"); ul.innerHTML="";
  state.exercises.forEach((name,idx)=>{
    const li=el("li",{draggable:true});
    const s=el("span",{textContent:name});
    const del=el("button",{className:"btn small",textContent:"–",title:"Löschen"});
    li.addEventListener("dragstart",e=>{ e.dataTransfer.setData("text/plain",name); });
    press(li,{ onLongPress:()=>{ const n=prompt("Übung umbenennen",name); if(n!=null){ state.exercises[idx]=n.trim(); save(); renderExercises(); } } });
    del.onclick=()=>{ state.exercises.splice(idx,1); save(); renderExercises(); };
    li.append(s,del); ul.append(li);
  });
  $("#addExercise").onclick=()=>{ const v=$("#newExercise").value.trim(); if(!v) return;
    state.exercises.unshift(v); $("#newExercise").value=""; save(); renderExercises();
  };
}

// Service Worker (für Offline)
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }); }

render();
