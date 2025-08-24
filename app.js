// ===== Persistenz =====
const LS_KEY = "trainer-data-v1";
let data = (() => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
})();
if (!data.athletes) data.athletes = [{ name: "Emma", plans: [] }, { name: "Filipp", plans: [] }];
if (!data.exercises) data.exercises = ["Test", "Reißen"];
if (data.selectedAthlete == null) data.selectedAthlete = 0;
if (data.selectedPlan == null) data.selectedPlan = 0;
function save() { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

// ===== DOM =====
const $athleteList  = document.getElementById("athleteList");
const $planTabs     = document.getElementById("planTabs");
const $week         = document.getElementById("week");
const $exerciseList = document.getElementById("exerciseList");
const $addAthlete   = document.getElementById("addAthlete");
const $addPlan      = document.getElementById("addPlan");
const $addExercise  = document.getElementById("addExercise");
const $newExercise  = document.getElementById("newExercise");

// ===== Helpers =====
const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const getAthlete = () => data.athletes[data.selectedAthlete];
const getPlan    = () => (getAthlete() || {}).plans?.[data.selectedPlan];

function render() {
  renderAthletes();
  renderPlans();
  renderWeek();
  renderExercises();
}

function renderAthletes() {
  $athleteList.innerHTML = "";
  data.athletes.forEach((a, i) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = a.name;
    li.appendChild(name);

    // auswählen
    li.addEventListener("click", () => {
      data.selectedAthlete = i;
      data.selectedPlan = 0;
      save(); render();
    });

    // löschen
    const del = document.createElement("button");
    del.className = "btn small crtAmber";
    del.textContent = "–";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      data.athletes.splice(i,1);
      if (data.selectedAthlete >= data.athletes.length) data.selectedAthlete = data.athletes.length-1;
      save(); render();
    });
    li.appendChild(del);

    if (i === data.selectedAthlete) li.classList.add("selected");
    $athleteList.appendChild(li);
  });
}

$addAthlete.addEventListener("click", () => {
  const name = prompt("Neuer Athlet:");
  if (!name) return;
  data.athletes.push({ name, plans: [] });
  data.selectedAthlete = data.athletes.length - 1;
  data.selectedPlan = 0;
  save(); render();
});

function renderPlans() {
  $planTabs.innerHTML = "";
  const a = getAthlete(); if (!a) return;
  a.plans.forEach((p, i) => {
    const tab = document.createElement("div");
    tab.className = "tab" + (i === data.selectedPlan ? " active" : "");
    tab.textContent = p.title;
    tab.addEventListener("click", () => {
      data.selectedPlan = i; save(); render();
    });
    $planTabs.appendChild(tab);
  });
}

$addPlan.addEventListener("click", () => {
  const a = getAthlete(); if (!a) return;
  const title = prompt("Neuer Plan:");
  if (!title) return;
  a.plans.push({ title, days: {} });
  data.selectedPlan = a.plans.length - 1;
  save(); render();
});

function renderWeek() {
  $week.innerHTML = "";
  const p = getPlan(); if (!p) return;

  const top = document.createElement("div");
  top.className = "topRow";
  DAYS.slice(0,3).forEach(d => top.appendChild(makeDayBox(d, p)));
  $week.appendChild(top);

  const bottom = document.createElement("div");
  bottom.className = "botRow";
  DAYS.slice(3).forEach(d => bottom.appendChild(makeDayBox(d, p)));
  $week.appendChild(bottom);
}

function makeDayBox(day, plan) {
  const box = document.createElement("div");
  box.className = "day";
  box.dataset.day = day;

  const h = document.createElement("h3");
  h.className = "crtGreen";
  h.textContent = day;

  const ta = document.createElement("textarea");
  ta.value = plan.days[day] || "";
  ta.addEventListener("input", () => {
    plan.days[day] = ta.value; save();
  });

  // markiere als Drop-Ziel (für Pointer-Fallback)
  box.addEventListener("dragover", e => e.preventDefault());

  box.appendChild(h);
  box.appendChild(ta);
  return box;
}

// ===== Übungen + Pointer-Drag Fallback =====
function renderExercises() {
  $exerciseList.innerHTML = "";
  data.exercises.forEach((ex, i) => {
    const li = document.createElement("li");
    li.style.touchAction = "none"; // wichtig für iPad
    const text = document.createElement("span");
    text.textContent = ex;
    li.appendChild(text);

    // Pointer-Fallback aktivieren
    enablePointerDrag(li, ex);

    // optional: löschen per Doppeltipp
    li.addEventListener("dblclick", () => {
      if (!confirm(`„${ex}“ löschen?`)) return;
      data.exercises.splice(i,1); save(); renderExercises();
    });

    $exerciseList.appendChild(li);
  });
}

$addExercise.addEventListener("click", () => {
  const v = $newExercise.value.trim();
  if (!v) return;
  data.exercises.push(v);
  $newExercise.value = "";
  save(); renderExercises();
});
$newExercise.addEventListener("keydown", e => {
  if (e.key === "Enter") $addExercise.click();
});

// ---- Pointer-Drag (funktioniert in PWA/Safari auf iPad) ----
let dragState = null;
function enablePointerDrag(el, label) {
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    // Ghost erzeugen
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.textContent = label;
    document.body.appendChild(ghost);

    const moveTo = (x,y) => { ghost.style.left = x+"px"; ghost.style.top = y+"px"; };

    const onMove = (ev) => {
      moveTo(ev.pageX, ev.pageY);
      // Drop-Ziel hervorheben
      highlightDrop(ev.clientX, ev.clientY);
    };

    const onUp = (ev) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      ghost.remove();
      const target = findDayAt(ev.clientX, ev.clientY);
      const plan = getPlan();
      if (target && plan) {
        const day = target.dataset.day;
        const old = plan.days[day] || "";
        const text = old ? old + "\n" + label : label;
        plan.days[day] = text;
        // Textarea aktualisieren
        const ta = target.querySelector("textarea");
        if (ta) ta.value = text;
        save();
      }
      clearHighlight();
    };

    moveTo(e.pageX, e.pageY);
    document.addEventListener("pointermove", onMove, { passive:false });
    document.addEventListener("pointerup", onUp, { passive:false, once:true });
  });
}

function findDayAt(cx, cy) {
  const el = document.elementFromPoint(cx, cy);
  return el ? el.closest?.(".day") : null;
}
function highlightDrop(cx, cy) {
  clearHighlight();
  const d = findDayAt(cx, cy);
  if (d) d.classList.add("dragover");
}
function clearHighlight() {
  document.querySelectorAll(".day.dragover").forEach(n => n.classList.remove("dragover"));
}

// ===== Start =====
render();