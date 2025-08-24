// ---------- Daten & Helpers ----------
const LS = {
  athletes: "tp_athletes",
  plans:    "tp_plans",
  exercises:"tp_exercises",
};

let athletes  = JSON.parse(localStorage.getItem(LS.athletes))  || ["Emma","Filipp"];
let plans     = JSON.parse(localStorage.getItem(LS.plans))     || {};
let exercises = JSON.parse(localStorage.getItem(LS.exercises)) || ["Test","Reißen"];

let selectedAthlete = null;
let selectedPlanIdx = null; // Index im Array des Athleten

function saveAll(){
  localStorage.setItem(LS.athletes, JSON.stringify(athletes));
  localStorage.setItem(LS.plans,    JSON.stringify(plans));
  localStorage.setItem(LS.exercises,JSON.stringify(exercises));
}
function ensurePlanArray(name){
  if(!plans[name]) plans[name] = [];
}

// ---------- Render Athleten ----------
function renderAthletes(){
  const ul = document.getElementById("athleteList");
  ul.innerHTML = "";
  athletes.forEach((name, idx) => {
    const li = document.createElement("li"); li.className = "item";
    const title = document.createElement("span"); title.className="title"; title.textContent = name;
    li.onclick = (e)=>{
      // Klick auf freie Fläche selektiert
      if(e.target.tagName === "BUTTON") return;
      selectedAthlete = name; selectedPlanIdx = null;
      renderAthletes(); renderPlans(); renderWeek();
    };
    if(selectedAthlete === name) li.classList.add("active");

    const btns = document.createElement("span"); btns.className="row-btns";
    const rename = document.createElement("button"); rename.className="mini rename"; rename.textContent="✎";
    rename.onclick = (ev)=>{
      ev.stopPropagation();
      const nn = prompt("Neuer Name:", name);
      if(!nn) return;
      // umhängen: Plans mit umbenennen
      plans[nn] = plans[name] || [];
      if(selectedAthlete === name) selectedAthlete = nn;
      delete plans[name];
      athletes[idx] = nn;
      saveAll(); renderAthletes(); renderPlans(); renderWeek();
    };
    const del = document.createElement("button"); del.className="mini del"; del.textContent="×";
    del.onclick = (ev)=>{
      ev.stopPropagation();
      if(!confirm(`Athlet „${name}“ löschen?`)) return;
      athletes.splice(idx,1);
      delete plans[name];
      if(selectedAthlete===name){ selectedAthlete=null; selectedPlanIdx=null; }
      saveAll(); renderAthletes(); renderPlans(); renderWeek();
    };
    btns.append(rename,del);
    li.append(title, btns);
    ul.appendChild(li);
  });
}
function addAthlete(){
  const name = prompt("Name des Athleten?");
  if(!name) return;
  athletes.push(name); ensurePlanArray(name); saveAll();
  renderAthletes();
}

// ---------- Render Pläne (abh. Athlet) ----------
function renderPlans(){
  const ul = document.getElementById("planList");
  ul.innerHTML = "";
  if(!selectedAthlete){ return; }
  ensurePlanArray(selectedAthlete);
  plans[selectedAthlete].forEach((pl, idx)=>{
    const li = document.createElement("li"); li.className="item";
    if(selectedPlanIdx===idx) li.classList.add("active");
    const title = document.createElement("span"); title.className="title"; title.textContent = pl.name;

    li.onclick = (e)=>{
      if(e.target.tagName === "BUTTON") return;
      selectedPlanIdx = idx; renderPlans(); renderWeek();
    };

    const btns = document.createElement("span"); btns.className="row-btns";
    const rename = document.createElement("button"); rename.className="mini rename"; rename.textContent="✎";
    rename.onclick = (ev)=>{
      ev.stopPropagation();
      const nn = prompt("Neuer Plan-Name:", pl.name);
      if(!nn) return;
      pl.name = nn; saveAll(); renderPlans(); renderWeek();
    };
    const del = document.createElement("button"); del.className="mini del"; del.textContent="×";
    del.onclick = (ev)=>{
      ev.stopPropagation();
      if(!confirm(`Plan „${pl.name}“ löschen?`)) return;
      plans[selectedAthlete].splice(idx,1);
      if(selectedPlanIdx===idx) selectedPlanIdx=null;
      saveAll(); renderPlans(); renderWeek();
    };
    btns.append(rename,del);
    li.append(title, btns);
    ul.appendChild(li);
  });
}
function addPlan(){
  if(!selectedAthlete){ alert("Bitte zuerst einen Athleten wählen."); return; }
  const name = prompt("Plan-Name?");
  if(!name) return;
  ensurePlanArray(selectedAthlete);
  plans[selectedAthlete].push({name, days:{}}); saveAll();
  renderPlans();
}

// ---------- Übungen ----------
function renderExercises(){
  const ul = document.getElementById("exerciseList");
  ul.innerHTML = "";
  exercises.forEach((ex, idx)=>{
    const li = document.createElement("li"); li.className="item";
    const title = document.createElement("span"); title.className="title"; title.textContent = ex;

    // Drag
    li.draggable = true;
    li.ondragstart = (e)=> e.dataTransfer.setData("text/plain", ex);

    const btns = document.createElement("span"); btns.className="row-btns";
    const del = document.createElement("button"); del.className="mini del"; del.textContent="×";
    del.onclick = ()=>{
      if(!confirm(`Übung „${ex}“ löschen?`)) return;
      exercises.splice(idx,1); saveAll(); renderExercises();
    };
    btns.append(del);
    li.append(title, btns);
    ul.appendChild(li);
  });
}
function addExercise(){
  const input = document.getElementById("newExerciseInput");
  const val = input.value.trim();
  if(!val) return;
  exercises.push(val); input.value=""; saveAll(); renderExercises();
}

// ---------- Wochenplan (2 Reihen, editierbar + Drop) ----------
const TOP = ["Montag","Dienstag","Mittwoch"];
const BOTTOM = ["Donnerstag","Freitag","Samstag","Sonntag"];

function renderWeek(){
  const top = document.getElementById("row-top");
  const bottom = document.getElementById("row-bottom");
  top.innerHTML = ""; bottom.innerHTML="";

  const plan = (selectedAthlete && Number.isInteger(selectedPlanIdx))
    ? plans[selectedAthlete][selectedPlanIdx] : null;

  function makeDay(dayName){
    const wrap = document.createElement("div"); wrap.className="day";
    const h = document.createElement("h3"); h.textContent = dayName; wrap.appendChild(h);

    const ta = document.createElement("textarea");
    const text = plan?.days?.[dayName] || "";
    ta.value = Array.isArray(text) ? text.join("\n") : text;
    // Tippen => speichern
    ta.oninput = ()=>{
      if(!plan) return;
      plan.days[dayName] = ta.value;
      saveAll();
    };
    // Drop
    wrap.ondragover = e=>{ e.preventDefault(); wrap.classList.add("drag-over"); };
    wrap.ondragleave = ()=> wrap.classList.remove("drag-over");
    wrap.ondrop = (e)=>{
      e.preventDefault(); wrap.classList.remove("drag-over");
      const ex = e.dataTransfer.getData("text/plain");
      if(!ex) return;
      ta.value = (ta.value ? ta.value + "\n" : "") + ex;
      if(plan){ plan.days[dayName] = ta.value; saveAll(); }
    };

    wrap.appendChild(ta);
    return wrap;
  }

  TOP.forEach(d=> top.appendChild(makeDay(d)));
  BOTTOM.forEach(d=> bottom.appendChild(makeDay(d)));
}

// ---------- Init ----------
renderAthletes();
renderExercises();
renderPlans();
renderWeek();