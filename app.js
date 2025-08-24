// ===== Model & Persistenz =====
const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const STORE_KEY = "trainer-data-v1";

let data = loadData() || seedData();
let selectedAthleteId = data.athletes.length ? data.athletes[0].id : null;

function seedData() {
  return {
    athletes: [
      { id: uuid(), name: "Emma",    plans: [emptyPlan("Plan 1")] },
      { id: uuid(), name: "Filipp",  plans: [emptyPlan("Plan 1")] }
    ],
    exercises: ["Test", "Reißen"]
  };
}
function emptyPlan(title = "Neuer Plan") {
  const days = {};
  DAYS.forEach(d => days[d] = "");
  return { id: uuid(), title, days };
}
function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function saveData() {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || ""); }
  catch { return null; }
}

// ===== Helpers =====
function getSelectedAthlete() {
  return data.athletes.find(a => a.id === selectedAthleteId) || null;
}
function getCurrentPlan(athlete) {
  // aktuell: immer Plan 0 (du kannst später Plan-Auswahl ergänzen)
  if (!athlete) return null;
  return athlete.plans[0] || null;
}

// ===== Rendering =====
function renderAll() {
  renderAthletes();
  renderWeek();
  renderExercises();
}

// -- Athleten links
function renderAthletes() {
  const wrap = document.getElementById("athleteList");
  wrap.innerHTML = "";

  data.athletes.forEach(a => {
    const row = document.createElement("div");
    row.className = "athlete" + (a.id === selectedAthleteId ? " active" : "");
    row.addEventListener("click", () => {
      selectedAthleteId = a.id;
      saveData();
      renderAll();
    });

    // kurzer/long press: Name editieren
    const input = document.createElement("input");
    input.value = a.name;
    input.addEventListener("change", () => {
      a.name = input.value.trim() || "Athlet";
      saveData();
      renderAthletes();
    });

    // Entfernen-Button (optional)
    const del = document.createElement("button");
    del.className = "tiny-btn glow-blue";
    del.textContent = "−";
    del.title = "Athlet löschen";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = data.athletes.findIndex(x => x.id === a.id);
      if (idx >= 0) {
        data.athletes.splice(idx, 1);
        if (data.athletes.length) selectedAthleteId = data.athletes[0].id;
        else selectedAthleteId = null;
        saveData();
        renderAll();
      }
    });

    row.appendChild(input);
    row.appendChild(del);
    wrap.appendChild(row);
  });
}

// -- Wochenplan Mitte
function renderWeek() {
  const grid = document.getElementById("weekGrid");
  grid.innerHTML = "";

  const athlete = getSelectedAthlete();
  const plan = getCurrentPlan(athlete);

  const title = document.getElementById("planTitle");
  title.textContent = plan ? plan.title : "WOCHENPLAN";

  DAYS.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";

    const head = document.createElement("div");
    head.className = "day-head";
    head.textContent = day;

    const body = document.createElement("div");
    body.className = "day-body";

    const ta = document.createElement("textarea");
    ta.className = "day-text";
    ta.placeholder = "Hierhin Übungen ziehen oder tippen…";
    ta.value = plan ? (plan.days[day] || "") : "";
    ta.addEventListener("input", () => {
      if (plan) {
        plan.days[day] = ta.value;
        saveData();
      }
    });

    // Drop-Targets
    ta.addEventListener("dragover", (e) => { e.preventDefault(); ta.classList.add("drag-over"); });
    ta.addEventListener("dragleave", () => ta.classList.remove("drag-over"));
    ta.addEventListener("drop", (e) => {
      e.preventDefault();
      ta.classList.remove("drag-over");
      const txt = e.dataTransfer.getData("text/plain");
      if (txt) {
        ta.value = (ta.value ? ta.value + "\n" : "") + txt;
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    body.appendChild(ta);
    card.appendChild(head);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

// -- Übungen rechts (mit Löschen & Touch-Fallback)
function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";

  data.exercises.forEach((name, i) => {
    const div = document.createElement("div");
    div.className = "exercise";
    div.draggable = true;

    const label = document.createElement("span");
    label.textContent = name;

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.title = "Übung löschen";
    del.textContent = "×";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      data.exercises.splice(i, 1);
      saveData();
      renderExercises();
    });

    // Drag (Maus/Trackpad)
    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", name);
      // kleines transparentes Ghost, damit iPad den Drag akzeptiert
      if (e.dataTransfer.setDragImage) {
        const ghost = document.createElement("canvas");
        ghost.width = 1; ghost.height = 1;
        e.dataTransfer.setDragImage(ghost, 0, 0);
      }
    });

    // Touch-Fallback: Tippen fügt in das fokussierte Textfeld ein
    div.addEventListener("touchend", () => {
      const active = document.activeElement;
      if (active && active.classList && active.classList.contains("day-text")) {
        active.value = (active.value ? active.value + "\n" : "") + name;
        active.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, { passive: true });

    div.appendChild(label);
    div.appendChild(del);
    list.appendChild(div);
  });
}

// ===== Logik: Neues anlegen =====
document.getElementById("addAthleteBtn").addEventListener("click", () => {
  const a = { id: uuid(), name: "Neuer Athlet", plans: [emptyPlan("Plan 1")] };
  data.athletes.push(a);
  selectedAthleteId = a.id;
  saveData();
  renderAll();
});

document.getElementById("newPlanBtn").addEventListener("click", () => {
  const athlete = getSelectedAthlete();
  if (!athlete) return;
  athlete.plans.unshift(emptyPlan("Neuer Plan"));
  saveData();
  renderAll();
});

document.getElementById("addExerciseBtn").addEventListener("click", () => {
  document.getElementById("newExerciseInput").focus();
});

document.getElementById("commitExerciseBtn").addEventListener("click", addExerciseFromInput);
document.getElementById("newExerciseInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); addExerciseFromInput(); }
});

function addExerciseFromInput() {
  const inp = document.getElementById("newExerciseInput");
  const name = (inp.value || "").trim();
  if (!name) return;
  if (!data.exercises.includes(name)) {
    data.exercises.push(name);
    saveData();
    renderExercises();
  }
  inp.value = "";
}

// -- Pläne-Spalte rendern
function renderPlans() {
  const wrap = document.getElementById("planList");
  if (!wrap) return; // falls alte Version ohne Pläne geladen
  wrap.innerHTML = "";

  const athlete = getSelectedAthlete();
  if (!athlete) return;

  athlete.plans.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "athlete"; // nutzt das gleiche Styling wie Athleten

    const input = document.createElement("input");
    input.value = p.title;
    input.addEventListener("change", () => {
      p.title = input.value.trim() || "Plan";
      saveData();
      renderPlans();
      renderWeek();
    });

    const del = document.createElement("button");
    del.className = "tiny-btn glow-blue";
    del.textContent = "−";
    del.title = "Plan löschen";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      athlete.plans.splice(i, 1);
      saveData();
      renderPlans();
      renderWeek();
    });

    row.addEventListener("click", () => {
      // wenn man den Plan anklickt, diesen als aktuellen nehmen
      data.selectedPlanIndexByAthlete = data.selectedPlanIndexByAthlete || {};
      data.selectedPlanIndexByAthlete[athlete.id] = i;
      saveData();
      renderWeek();
      renderPlans();
    });

    row.appendChild(input);
    row.appendChild(del);
    wrap.appendChild(row);
  });
}

// Button für neuen Plan
const addPlanBtn = document.getElementById("addPlanBtn");
if (addPlanBtn) {
  addPlanBtn.addEventListener("click", () => {
    const athlete = getSelectedAthlete();
    if (!athlete) return;
    athlete.plans.push(emptyPlan("Neuer Plan"));
    saveData();
    renderPlans();
    renderWeek();
  });
}

// ===== Init =====
renderAll();

