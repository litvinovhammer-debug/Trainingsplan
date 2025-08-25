// Datenstruktur für Athleten, Pläne und Übungen (wird in LocalStorage gespeichert)
let data = {
  athletes: [],
  exercises: []
};
let currentAthleteIndex = null;
let currentPlanIndex = null;
let selectedExerciseName = null;
let selectedExerciseEl = null;

// Referenzen auf DOM-Elemente
const athleteListEl = document.getElementById('athlete-list');
const planListEl = document.getElementById('plan-list');
const exerciseListEl = document.getElementById('exercise-list');
const weekDaysEls = [...document.querySelectorAll('.day-entries')];
const addAthleteBtn = document.getElementById('add-athlete');
const addPlanBtn = document.getElementById('add-plan');
const addExerciseBtn = document.getElementById('add-exercise');

// Daten aus LocalStorage laden (falls vorhanden)
const stored = localStorage.getItem('trainingAppData');
if (stored) {
  try {
    data = JSON.parse(stored);
  } catch (e) {
    console.error('Fehler beim Laden der gespeicherten Daten:', e);
    data = { athletes: [], exercises: [] };
  }
}

// Initiale Auswahl festlegen (ersten Athleten/Plan auswählen, falls vorhanden)
function initSelection() {
  if (data.athletes.length > 0) {
    currentAthleteIndex = 0;
    if (data.athletes[0].plans && data.athletes[0].plans.length > 0) {
      currentPlanIndex = 0;
    } else {
      currentPlanIndex = null;
    }
  } else {
    currentAthleteIndex = null;
    currentPlanIndex = null;
  }
}

// Speichert die aktuellen Daten in LocalStorage
function saveData() {
  localStorage.setItem('trainingAppData', JSON.stringify(data));
}

// UI-Rendering: Athletenliste anzeigen
function renderAthleteList() {
  athleteListEl.innerHTML = '';
  data.athletes.forEach((athlete, index) => {
    const li = document.createElement('li');
    li.textContent = athlete.name;
    // Lösch-Button für Athlet
    const delBtn = document.createElement('button');
    delBtn.textContent = '\u2716';  // "✖" Symbol
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAthlete(index);
    });
    li.appendChild(delBtn);
    // Klick zum Auswählen des Athleten
    li.addEventListener('click', () => {
      selectAthlete(index);
    });
    // Langer Druck (1s) zum Umbenennen
    addLongPressListener(li, () => {
      renameAthlete(index);
    });
    // Kontextmenü (Rechtsklick/Langdruck) deaktivieren
    li.addEventListener('contextmenu', (e) => e.preventDefault());
    // Markierung des aktuell ausgewählten Athleten
    if (index === currentAthleteIndex) {
      li.classList.add('selected');
    }
    athleteListEl.appendChild(li);
  });
}

// UI-Rendering: Pläne-Liste für den aktuellen Athleten
function renderPlanList() {
  planListEl.innerHTML = '';
  if (currentAthleteIndex === null) return;
  const plans = data.athletes[currentAthleteIndex].plans || [];
  plans.forEach((plan, index) => {
    const li = document.createElement('li');
    li.textContent = plan.name;
    // Lösch-Button für Plan
    const delBtn = document.createElement('button');
    delBtn.textContent = '\u2716';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePlan(index);
    });
    li.appendChild(delBtn);
    // Klick zum Auswählen des Plans
    li.addEventListener('click', () => {
      selectPlan(index);
    });
    // Langer Druck zum Umbenennen des Plans
    addLongPressListener(li, () => {
      renamePlan(index);
    });
    li.addEventListener('contextmenu', (e) => e.preventDefault());
    if (index === currentPlanIndex) {
      li.classList.add('selected');
    }
    planListEl.appendChild(li);
  });
}

// UI-Rendering: Übungenliste anzeigen
function renderExerciseList() {
  exerciseListEl.innerHTML = '';
  data.exercises.forEach((exercise, index) => {
    const li = document.createElement('li');
    li.textContent = exercise;
    // Element draggable machen (Drag & Drop)
    li.setAttribute('draggable', 'true');
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', exercise);
    });
    // Lösch-Button für Übung
    const delBtn = document.createElement('button');
    delBtn.textContent = '\u2716';
    delBtn.className = 'delete-btn';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteExercise(index);
    });
    li.appendChild(delBtn);
    // Klick (Tap) auf Übung zum Auswählen für Schnelleinfügen
    li.addEventListener('click', () => {
      if (selectedExerciseName === exercise) {
        // Wenn erneut geklickt, Auswahl aufheben
        selectedExerciseName = null;
        if (selectedExerciseEl) selectedExerciseEl.classList.remove('selected');
        selectedExerciseEl = null;
      } else {
        // Neue Übung auswählen
        selectedExerciseName = exercise;
        if (selectedExerciseEl) selectedExerciseEl.classList.remove('selected');
        selectedExerciseEl = li;
        li.classList.add('selected');
      }
    });
    exerciseListEl.appendChild(li);
  });
}

// UI-Rendering: Wochenplan für den aktuellen Plan anzeigen
function renderWeekSchedule() {
  // Alle Tages-Einträge leeren
  weekDaysEls.forEach(dayEl => {
    dayEl.innerHTML = '';
  });
  if (currentAthleteIndex === null || currentPlanIndex === null) {
    return;
  }
  const schedule = data.athletes[currentAthleteIndex].plans[currentPlanIndex].schedule;
  if (!schedule) return;
  // Sicherstellen, dass 7 Tage-Arrays existieren
  for (let d = 0; d < 7; d++) {
    if (!schedule[d]) schedule[d] = [];
  }
  schedule.forEach((entries, dayIndex) => {
    const dayContainer = document.getElementById('day-' + dayIndex);
    entries.forEach((entry, entryIndex) => {
      const input = createEntryInput(dayIndex, entry, entryIndex);
      dayContainer.appendChild(input);
    });
  });
}

// Hilfsfunktion: Erstellt ein Input-Feld für einen Tages-Eintrag
function createEntryInput(dayIndex, text, entryIndex = null) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  // Beim Verlassen des Feldes (blur): Änderungen speichern oder Eintrag entfernen, falls leer
  input.addEventListener('blur', () => {
    const val = input.value.trim();
    const entries = data.athletes[currentAthleteIndex].plans[currentPlanIndex].schedule[dayIndex];
    if (val === '') {
      // Eintrag löschen, wenn Text geleert wurde
      const idx = (entryIndex !== null) ? entryIndex : entries.indexOf(text);
      if (idx > -1) {
        entries.splice(idx, 1);
      }
      renderWeekSchedule();
    } else {
      // Textänderung speichern
      if (entryIndex !== null) {
        entries[entryIndex] = val;
      } else {
        const idx = entries.indexOf(text);
        if (idx !== -1) {
          entries[idx] = val;
        }
      }
    }
    saveData();
  });
  // Enter-Taste beendet die Eingabe (entfernt Fokus)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
  });
  return input;
}

// Athleten-Auswahl (bei Klick)
function selectAthlete(index) {
  if (currentAthleteIndex === index) return;
  currentAthleteIndex = index;
  // Automatisch ersten Plan auswählen (falls vorhanden)
  const plans = data.athletes[index].plans;
  currentPlanIndex = (plans && plans.length > 0) ? 0 : null;
  renderAthleteList();
  renderPlanList();
  renderWeekSchedule();
  saveData();
}

// Plan-Auswahl (bei Klick)
function selectPlan(index) {
  if (currentPlanIndex === index) return;
  currentPlanIndex = index;
  renderPlanList();
  renderWeekSchedule();
  saveData();
}

// Neuen Athleten hinzufügen
function addAthlete() {
  const name = prompt('Name des Athleten:');
  if (!name) return;
  data.athletes.push({ name: name.trim(), plans: [] });
  // Neu angelegten Athleten auswählen
  currentAthleteIndex = data.athletes.length - 1;
  currentPlanIndex = null;
  renderAthleteList();
  renderPlanList();
  renderWeekSchedule();
  saveData();
}

// Athleten löschen
function deleteAthlete(index) {
  const athleteName = data.athletes[index].name;
  if (!confirm(`Athlet "${athleteName}" wirklich löschen?`)) return;
  data.athletes.splice(index, 1);
  // Auswahl anpassen
  if (data.athletes.length === 0) {
    currentAthleteIndex = null;
    currentPlanIndex = null;
  } else if (index === currentAthleteIndex) {
    // Wenn der gelöschte Athlet der aktuell ausgewählte war
    currentAthleteIndex = (index >= data.athletes.length) ? data.athletes.length - 1 : index;
    const plans = data.athletes[currentAthleteIndex].plans;
    currentPlanIndex = (plans && plans.length > 0) ? 0 : null;
  } else {
    if (index < currentAthleteIndex) {
      currentAthleteIndex -= 1;
    }
    // currentPlanIndex bleibt unverändert (weiterhin gültiger Plan desselben Athleten)
  }
  renderAthleteList();
  renderPlanList();
  renderWeekSchedule();
  saveData();
}

// Athleten umbenennen (per Prompt)
function renameAthlete(index) {
  const newName = prompt('Neuer Name für Athleten:', data.athletes[index].name);
  if (newName) {
    data.athletes[index].name = newName.trim();
    renderAthleteList();
    saveData();
  }
}

// Neuen Plan hinzufügen (für aktuellen Athleten)
function addPlan() {
  if (currentAthleteIndex === null) {
    alert('Kein Athlet ausgewählt.');
    return;
  }
  const planName = prompt('Name des neuen Plans:');
  if (!planName) return;
  const plan = { name: planName.trim(), schedule: [[], [], [], [], [], [], []] };
  data.athletes[currentAthleteIndex].plans.push(plan);
  // Neu angelegten Plan auswählen
  currentPlanIndex = data.athletes[currentAthleteIndex].plans.length - 1;
  renderPlanList();
  renderWeekSchedule();
  saveData();
}

// Plan löschen
function deletePlan(index) {
  if (currentAthleteIndex === null) return;
  const planName = data.athletes[currentAthleteIndex].plans[index].name;
  if (!confirm(`Plan "${planName}" wirklich löschen?`)) return;
  data.athletes[currentAthleteIndex].plans.splice(index, 1);
  if (data.athletes[currentAthleteIndex].plans.length === 0) {
    currentPlanIndex = null;
  } else if (index === currentPlanIndex) {
    // Gelöschter Plan war ausgewählt -> anderen Plan auswählen
    currentPlanIndex = (index >= data.athletes[currentAthleteIndex].plans.length) 
      ? data.athletes[currentAthleteIndex].plans.length - 1 
      : index;
  } else {
    if (index < currentPlanIndex) {
      currentPlanIndex -= 1;
    }
  }
  renderPlanList();
  renderWeekSchedule();
  saveData();
}

// Plan umbenennen
function renamePlan(index) {
  if (currentAthleteIndex === null) return;
  const newName = prompt('Neuer Name für Plan:', data.athletes[currentAthleteIndex].plans[index].name);
  if (newName) {
    data.athletes[currentAthleteIndex].plans[index].name = newName.trim();
    renderPlanList();
    saveData();
  }
}

// Neue Übung hinzufügen
function addExercise() {
  const name = prompt('Name der neuen Übung:');
  if (!name) return;
  data.exercises.push(name.trim());
  renderExerciseList();
  saveData();
}

// Übung löschen
function deleteExercise(index) {
  const exName = data.exercises[index];
  if (!confirm(`Übung "${exName}" wirklich löschen?`)) return;
  if (selectedExerciseName === exName) {
    selectedExerciseName = null;
    selectedExerciseEl = null;
  }
  data.exercises.splice(index, 1);
  renderExerciseList();
  saveData();
}

// Hilfsfunktion: Ereignis für langen Druck (1 Sekunde) registrieren
function addLongPressListener(element, callback) {
  let timer = null;
  const touchDuration = 1000;
  const start = (e) => {
    e.preventDefault();
    timer = setTimeout(() => {
      timer = null;
      callback();
    }, touchDuration);
  };
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  element.addEventListener('mousedown', start);
  element.addEventListener('touchstart', start);
  element.addEventListener('mouseout', cancel);
  element.addEventListener('mouseup', cancel);
  element.addEventListener('mouseleave', cancel);
  element.addEventListener('touchend', cancel);
  element.addEventListener('touchmove', cancel);
}

// Übung in den Wochenplan einfügen (Drag & Drop oder Tap)
function addExerciseToDay(dayIndex, exerciseName) {
  if (currentAthleteIndex === null || currentPlanIndex === null) return;
  const entries = data.athletes[currentAthleteIndex].plans[currentPlanIndex].schedule[dayIndex];
  entries.push(exerciseName);
  // Neuen Eintrag in der UI hinzufügen
  const input = createEntryInput(dayIndex, exerciseName, entries.length - 1);
  document.getElementById('day-' + dayIndex).appendChild(input);
  input.focus();
  saveData();
}

// Auswahl initialisieren und UI rendern
initSelection();
renderAthleteList();
renderPlanList();
renderExerciseList();
renderWeekSchedule();

// Event-Listener für die Plus-Buttons
addAthleteBtn.addEventListener('click', addAthlete);
addPlanBtn.addEventListener('click', addPlan);
addExerciseBtn.addEventListener('click', addExercise);

// Drag & Drop Events für die Tages-Spalten
weekDaysEls.forEach((dayEl, index) => {
  dayEl.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  dayEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const exerciseName = e.dataTransfer.getData('text/plain');
    if (exerciseName) {
      addExerciseToDay(index, exerciseName);
    }
  });
  // Tap auf leere Fläche eines Tages, um ausgewählte Übung hinzuzufügen
  dayEl.addEventListener('click', (e) => {
    if (e.target !== dayEl) return;  // nicht auslösen, wenn auf bestehende Einträge geklickt
    if (selectedExerciseName) {
      addExerciseToDay(index, selectedExerciseName);
      // Übung bleibt ausgewählt, sodass sie in mehrere Tage eingefügt werden kann
    }
  });
});

// Service Worker Registrierung (für PWA-Funktionalität)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.error('ServiceWorker-Registrierung fehlgeschlagen:', err));
  });
}