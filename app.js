let athletes = JSON.parse(localStorage.getItem("athletes")) || [];
let plans = JSON.parse(localStorage.getItem("plans")) || {};
let exercises = JSON.parse(localStorage.getItem("exercises")) || [];

let selectedAthlete = null;
let selectedPlan = null;

// ---- Athleten ----
function renderAthletes() {
  const list = document.getElementById("athleteList");
  list.innerHTML = "";
  athletes.forEach((athlete, i) => {
    const li = document.createElement("li");
    li.textContent = athlete;
    li.onclick = () => selectAthlete(athlete);
    list.appendChild(li);
  });
}
function addAthlete() {
  const name = prompt("Name des Athleten?");
  if (name) {
    athletes.push(name);
    localStorage.setItem("athletes", JSON.stringify(athletes));
    renderAthletes();
  }
}
function selectAthlete(name) {
  selectedAthlete = name;
  selectedPlan = null;
  renderPlans();
  renderWeek();
}

// ---- Pläne ----
function renderPlans() {
  const list = document.getElementById("planList");
  list.innerHTML = "";
  if (!selectedAthlete) return;
  const athletePlans = plans[selectedAthlete] || [];
  athletePlans.forEach((plan, i) => {
    const li = document.createElement("li");
    li.textContent = plan.name;
    li.onclick = () => {
      selectedPlan = plan;
      renderWeek();
    };
    list.appendChild(li);
  });
}
function addPlan() {
  if (!selectedAthlete) {
    alert("Wähle zuerst einen Athleten!");
    return;
  }
  const name = prompt("Name des Plans?");
  if (name) {
    if (!plans[selectedAthlete]) plans[selectedAthlete] = [];
    plans[selectedAthlete].push({ name, days: {} });
    localStorage.setItem("plans", JSON.stringify(plans));
    renderPlans();
  }
}

// ---- Übungen ----
function renderExercises() {
  const list = document.getElementById("exerciseList");
  list.innerHTML = "";
  exercises.forEach((exercise, i) => {
    const li = document.createElement("li");
    li.textContent = exercise;
    li.draggable = true;
    li.ondragstart = (e) => e.dataTransfer.setData("text/plain", exercise);
    list.appendChild(li);
  });
}
function addExercise() {
  const input = document.getElementById("newExerciseInput");
  const name = input.value.trim();
  if (name) {
    exercises.push(name);
    localStorage.setItem("exercises", JSON.stringify(exercises));
    input.value = "";
    renderExercises();
  }
}

// ---- Wochenplan ----
function renderWeek() {
  const week = document.getElementById("week");
  week.innerHTML = "";
  if (!selectedPlan) return;
  const days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
  days.forEach(day => {
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `<h3>${day}</h3>`;
    div.ondragover = (e) => e.preventDefault();
    div.ondrop = (e) => {
      const exercise = e.dataTransfer.getData("text/plain");
      if (!selectedPlan.days[day]) selectedPlan.days[day] = [];
      selectedPlan.days[day].push(exercise);
      localStorage.setItem("plans", JSON.stringify(plans));
      renderWeek();
    };
    if (selectedPlan.days[day]) {
      selectedPlan.days[day].forEach(ex => {
        const p = document.createElement("p");
        p.textContent = ex;
        div.appendChild(p);
      });
    }
    week.appendChild(div);
  });
}

// ---- Init ----
renderAthletes();
renderExercises();
renderWeek();