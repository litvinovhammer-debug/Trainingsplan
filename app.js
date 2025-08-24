.// ===== Model & Persistenz =====
const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const STORE_KEY = "trainer-data-v2"; // neue Version wegen Plan-Auswahl

let data = loadData() || migrateOld(loadOld()) || seedData();
let selectedAthleteId = data.athletes.length ? data.athletes[0].id : null;

function seedData() {
  const p1 = emptyPlan("Plan 1");
  return {
    athletes: [
      { id: uuid(), name: "Emma",   plans: [p1], selectedPlanId: p1.id },
      { id: uuid(), name: "Filipp", plans: [emptyPlan("Plan 1")], selectedPlanId: null }
    ],
    exercises: ["Test", "Reißen"]
  };
}
function emptyPlan(title = "Neuer Plan") {
  const days = {}; DAYS.forEach(d => days[d] = "");
  return { id: uuid(), title, days };
}
function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function saveData() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function loadData() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || ""); } catch { return null; } }
// Migration von v1 -> v2 (falls vorhanden)
function loadOld() { try { return JSON.parse(localStorage.getItem("trainer-data-v1") || ""); } catch { return null; } }
function migrateOld(old) {
  if (!old) return null;
  old.athletes?.forEach(a => { if (!a.selectedPlanId && a.plans?.length) a.selectedPlanId = a.plans[0].id; });
  return old;
}

// ===== Helpers =====
function getSelectedAthlete() {
  return data.athletes.find(a => a.id === selectedAthleteId) || null;
}
function getCurrentPlan(athlete) {
  if (!athlete || !athlete.plans.length) return null;
  let p = athlete.plans.find(p => p.id === athlete.selectedPlanId);
  if (!p) { p = athlete.plans[0]; athlete.selectedPlanId = p.id; saveData(); }
  return p;
}

// ===== Rendering =====
function renderAll() {
  renderAthletes();
  renderPlans();
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
      // falls kein selectedPlan gesetzt ist, auf ersten setzen
      if (!a.selectedPlanId && a.plans.length) a.selectedPlanId = a.plans[0].id;
      saveData();
      renderAll();
    });

    const input = document.createElement("input");
    input.value = a.name;
    input.addEventListener("change", () => {
      a.name = input.value.trim() || "Athlet";
      saveData();
      renderAthletes();
    });

    const del = document.createElement("button");
    del.className = "tiny-btn glow-blue";
    del.textContent = "−";
    del.title = "Athlet löschen";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = data.athletes.findIndex(x => x.id === a.id);
      if (idx >= 0) {
        data.athletes.splice(idx, 1);
        selectedAthleteId = data.athletes[0]?.id || null;
        saveData();
        renderAll();
      }
    });

    row.appendChild(input);
    row.appendChild(del);
    wrap.appendChild(row);
  });
}

// -- NEU: Pläne-Spalte
function renderPlans() {
  const wrap = document.getElementById("planList");
  wrap.innerHTML = "";
  const athlete = getSelectedAthlete();
  if (!athlete) return;

  athlete.plans.forEach(p => {
    const row = document.createElement("div");
    row.className = "plan" + (p.id === athlete.selectedPlanId ? " active" : "");
    row.addEventListener("click", () => {
      athlete.selectedPlanId = p.id;
      saveData();
      renderWeek();
      renderPlans();
    });

    const input = document.createElement("input");
    input.value = p.title;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });
    input.addEventListener("change", () => {
      p.title = input.value.trim() || "Plan";
      saveData();
      renderPlans();
      renderWeekTitleOnly();
    });

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "×";
    del.title = "Plan löschen";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = athlete.plans.findIndex(x => x.id === p.id);
      if (idx >= 0) {
        athlete.plans.splice(idx, 1);
        if (athlete.selectedPlanId === p.id) {
          athlete.selectedPlanId = athlete.plans[0]?.id || null;
        }
        saveData();
        renderPlans();
        renderWeek();
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

  renderWeekTitleOnly();

  const athlete = getSelectedAthlete();
  const plan = getCurrentPlan(athlete);

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

    // Drag-&-Drop Ziel
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

function renderWeekTitleOnly() {
  const athlete = getSelectedAthlete();
  const plan = getCurrentPlan(athlete);
  document.getElementById("planTitle").textContent = plan ? plan.title : "WOCHENPLAN";
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

    div.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", name);
      if (e.dataTransfer.setDragImage) {
        const ghost = document.createElement("canvas"); ghost.width = 1; ghost.height = 1;
        e.dataTransfer.setDragImage(ghost, 0, 0);
      }
    });
    // Touch-Fallback: Tippen fügt in fokussiertes Feld ein
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

// ===== Aktionen =====
document.getElementById("addAthleteBtn").addEventListener("click", () => {
  const p = emptyPlan("Plan 1");
  const a = { id: uuid(), name: "Neuer Athlet", plans: [p], selectedPlanId: p.id };
  data.athletes.push(a);
  selectedAthleteId = a.id;
  saveData();
  renderAll();
});

document.getElementById("addPlanBtn").addEventListener("click", () => {
  const athlete = getSelectedAthlete();
  if (!athlete) return;
  const p = emptyPlan("Neuer Plan");
  athlete.plans.unshift(p);
  athlete.selectedPlanId = p.id;
  saveData();
  renderPlans();
  renderWeek();
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

// ===== Init =====
renderAll();