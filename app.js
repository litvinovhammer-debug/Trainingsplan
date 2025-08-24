// ===== Speicher laden =====
let data = JSON.parse(localStorage.getItem("trainer-data") || "{}");

if (!data.athletes) data.athletes = [];
if (!data.exercises) data.exercises = ["Reißen"];
save();

function save() {
  localStorage.setItem("trainer-data", JSON.stringify(data));
}

// ===== DOM Referenzen =====
const athleteList = document.getElementById("athleteList");
const planTabs = document.getElementById("planTabs");
const week = document.getElementById("week");
const exerciseList = document.getElementById("exerciseList");

// ===== Athleten =====
function renderAthletes() {
  athleteList.innerHTML = "";
  data.athletes.forEach((a, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = a.name;
    li.appendChild(span);

    // Auswahl
    li.onclick = () => {
      data.selectedAthlete = i;
      data.selectedPlan = 0;
      save();
      render();
    };

    // Entfernen
    const del = document.createElement("button");
    del.textContent = "–";
    del.className = "btn small";
    del.onclick = e => {
      e.stopPropagation();
      data.athletes.splice(i,1);
      save();
      render();
    };
    li.appendChild(del);

    if (i === data.selectedAthlete) li.classList.add("selected");
    athleteList.appendChild(li);
  });
}

document.getElementById("addAthlete").onclick = () => {
  const name = prompt("Neuer Athlet:");
  if (!name) return;
  data.athletes.push({ name, plans: [] });
  data.selectedAthlete = data.athletes.length-1;
  data.selectedPlan = 0;
  save();
  render();
};

// ===== Pläne =====
function renderPlans() {
  planTabs.innerHTML = "";
  const athlete = data.athletes[data.selectedAthlete];
  if (!athlete) return;

  athlete.plans.forEach((p, i) => {
    const tab = document.createElement("div");
    tab.className = "tab" + (i === data.selectedPlan ? " active" : "");
    tab.textContent = p.title;
    tab.onclick = () => {
      data.selectedPlan = i;
      save();
      render();
    };
    planTabs.appendChild(tab);
  });
}

document.getElementById("addPlan").onclick = () => {
  const athlete = data.athletes[data.selectedAthlete];
  if (!athlete) return;
  const title = prompt("Neuer Plan:");
  if (!title) return;
  athlete.plans.push({ title, days:{} });
  data.selectedPlan = athlete.plans.length-1;
  save();
  render();
};

// ===== Übungen =====
function renderExercises() {
  exerciseList.innerHTML = "";
  data.exercises.forEach((ex, i) => {
    const li = document.createElement("li");
    li.textContent = ex;
    li.draggable = true;

    li.ondragstart = e => {
      e.dataTransfer.setData("text/plain", ex);
    };

    exerciseList.appendChild(li);
  });
}

document.getElementById("addExercise").onclick = () => {
  const val = document.getElementById("newExercise").value.trim();
  if (!val) return;
  data.exercises.push(val);
  document.getElementById("newExercise").value = "";
  save();
  renderExercises();
};

// ===== Wochenplan =====
const days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

function renderWeek() {
  week.innerHTML = "";
  const athlete = data.athletes[data.selectedAthlete];
  if (!athlete) return;
  const plan = athlete.plans[data.selectedPlan];
  if (!plan) return;

  // 2 Zeilen Layout (3+4)
  const row1 = document.createElement("div");
  row1.className = "grid2";
  days.slice(0,3).forEach(d => row1.appendChild(renderDay(d, plan)));
  week.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "grid2";
  days.slice(3).forEach(d => row2.appendChild(renderDay(d, plan)));
  week.appendChild(row2);
}

function renderDay(day, plan) {
  const box = document.createElement("div");
  box.className = "day";
  box.innerHTML = `<h3>${day}</h3>`;
  const ta = document.createElement("textarea");
  ta.value = plan.days[day] || "";
  ta.oninput = () => {
    plan.days[day] = ta.value;
    save();
  };

  // Drag&Drop Ziel
  box.ondragover = e => {
    e.preventDefault();
    box.classList.add("dragover");
  };
  box.ondragleave = ()=> box.classList.remove("dragover");
  box.ondrop = e => {
    e.preventDefault();
    const ex = e.dataTransfer.getData("text/plain");
    plan.days[day] = (plan.days[day]||"") + (plan.days[day] ? "\n" : "") + ex;
    ta.value = plan.days[day];
    box.classList.remove("dragover");
    save();
  };

  box.appendChild(ta);
  return box;
}

// ===== Render All =====
function render() {
  renderAthletes();
  renderPlans();
  renderExercises();
  renderWeek();
}

render();