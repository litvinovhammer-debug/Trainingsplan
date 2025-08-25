// ===== Model =====
const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const STORE_KEY = "trainer-data-v1";

let data = loadData() || seedData();
let selectedAthleteId = data.athletes[0]?.id || null;
let selectedPlanId = data.athletes[0]?.plans[0]?.id || null;

function seedData() {
  return {
    athletes: [
      { id: uuid(), name: "Emma", plans: [emptyPlan("Plan 1")] },
      { id: uuid(), name: "Filipp", plans: [emptyPlan("Plan 1")] }
    ],
    exercises: ["Reißen","Stoßen"]
  };
}
function emptyPlan(title) {
  const days = {}; DAYS.forEach(d => days[d] = "");
  return { id: uuid(), title, days };
}
function uuid() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function saveData() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function loadData() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; } }

function getSelectedAthlete() { return data.athletes.find(a => a.id === selectedAthleteId) || null; }
function getSelectedPlan() {
  const athlete = getSelectedAthlete();
  return athlete?.plans.find(p => p.id === selectedPlanId) || null;
}

// ===== Rendering =====
function renderAll() {
  renderAthletes();
  renderPlans();
  renderWeek();
  renderExercises();
}

// -- Athleten
function renderAthletes() {
  const wrap = document.getElementById("athleteList");
  wrap.innerHTML = "";
  data.athletes.forEach(a => {
    const row = document.createElement("div");
    row.className = "athlete" + (a.id===selectedAthleteId?" active":"");
    row.addEventListener("click",()=>{selectedAthleteId=a.id; selectedPlanId=a.plans[0]?.id||null; saveData(); renderAll();});
    const inp=document.createElement("input"); inp.value=a.name;
    inp.addEventListener("change",()=>{a.name=inp.value||"Athlet"; saveData(); renderAthletes();});
    const del=document.createElement("button"); del.textContent="−"; del.className="tiny-btn glow-blue";
    del.addEventListener("click",(e)=>{e.stopPropagation(); data.athletes=data.athletes.filter(x=>x.id!==a.id); selectedAthleteId=data.athletes[0]?.id||null; saveData(); renderAll();});
    row.append(inp,del); wrap.appendChild(row);
  });
}

// -- Pläne Tabs
function renderPlans() {
  const tabs=document.getElementById("planTabs");
  tabs.innerHTML="";
  const athlete=getSelectedAthlete(); if(!athlete) return;
  athlete.plans.forEach(p=>{
    const tab=document.createElement("div");
    tab.className="plan-tab"+(p.id===selectedPlanId?" active":"");
    tab.textContent=p.title;
    tab.addEventListener("click",()=>{selectedPlanId=p.id; saveData(); renderAll();});
    tabs.appendChild(tab);
  });
}

// -- Woche
function renderWeek() {
  const grid=document.getElementById("weekGrid");
  grid.innerHTML="";
  const plan=getSelectedPlan(); if(!plan) return;
  DAYS.forEach(day=>{
    const card=document.createElement("div"); card.className="day-card";
    const head=document.createElement("div"); head.className="day-head"; head.textContent=day;
    const ta=document.createElement("textarea"); ta.className="day-text"; ta.value=plan.days[day];
    ta.addEventListener("input",()=>{plan.days[day]=ta.value; saveData();});
    card.append(head,ta); grid.appendChild(card);
  });
}

// -- Übungen
function renderExercises() {
  const list=document.getElementById("exerciseList");
  list.innerHTML="";
  data.exercises.forEach((ex,i)=>{
    const div=document.createElement("div"); div.className="exercise"; div.draggable=true;
    const span=document.createElement("span"); span.textContent=ex;
    const del=document.createElement("button"); del.className="delete-btn"; del.textContent="×";
    del.addEventListener("click",()=>{data.exercises.splice(i,1); saveData(); renderExercises();});
    div.addEventListener("dragstart",(e)=>{e.dataTransfer.setData("text/plain",ex);});
    div.addEventListener("touchend",()=>{const active=document.activeElement;if(active&&active.classList.contains("day-text")){active.value+=(active.value?"\n":"")+ex; active.dispatchEvent(new Event("input"));}});
    div.append(span,del); list.appendChild(div);
  });
}

// ===== Events =====
document.getElementById("addAthleteBtn").addEventListener("click",()=>{const a={id:uuid(),name:"Neuer Athlet",plans:[emptyPlan("Plan 1")]};data.athletes.push(a);selectedAthleteId=a.id;selectedPlanId=a.plans[0].id;saveData();renderAll();});
document.getElementById("newPlanBtn").addEventListener("click",()=>{const a=getSelectedAthlete();if(!a)return;a.plans.push(emptyPlan("Neuer Plan"));selectedPlanId=a.plans[a.plans.length-1].id;saveData();renderAll();});
document.getElementById("commitExerciseBtn").addEventListener("click",()=>{const inp=document.getElementById("newExerciseInput");const name=inp.value.trim();if(name&&!data.exercises.includes(name)){data.exercises.push(name);saveData();renderExercises();}inp.value="";});
document.getElementById("addExerciseBtn").addEventListener("click",()=>{document.getElementById("newExerciseInput").focus();});

// ===== Init =====
renderAll();