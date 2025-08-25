// Retro Trainingsplan App Skript

// Daten aus localStorage laden (oder Default-Werte, falls nicht vorhanden)
let athletes = JSON.parse(localStorage.getItem('athletesData') || '[]');
let exercises = JSON.parse(localStorage.getItem('exercisesData') || '[]');
let selectedAthleteId = localStorage.getItem('selectedAthleteId');
if (selectedAthleteId) selectedAthleteId = parseInt(selectedAthleteId, 10);

// Hilfsfunktionen zum Speichern der Daten
function saveAthletes() {
  localStorage.setItem('athletesData', JSON.stringify(athletes));
}
function saveExercises() {
  localStorage.setItem('exercisesData', JSON.stringify(exercises));
}
// Hilfsfunktion: aktuell ausgewählten Athleten holen
function getSelectedAthlete() {
  if (selectedAthleteId == null) return null;
  return athletes.find(a => a.id === selectedAthleteId) || null;
}

// UI-Elemente referenzieren
const athleteListEl = document.getElementById('athleteList');
const planTabsEl = document.getElementById('planTabs');
const weekGridEl = document.getElementById('weekGrid');
const exerciseListEl = document.getElementById('exerciseList');
const addAthleteBtn = document.getElementById('addAthleteBtn');
const addPlanBtn = document.getElementById('addPlanBtn');
const newExerciseInput = document.getElementById('newExerciseInput');
const addExerciseBtn = document.getElementById('addExerciseBtn');

// UI aktualisieren: Athletenliste erzeugen
function refreshAthleteList() {
  athleteListEl.innerHTML = '';
  athletes.forEach(athlete => {
    const athleteDiv = document.createElement('div');
    athleteDiv.className = 'athlete';
    if (athlete.id === selectedAthleteId) {
      athleteDiv.classList.add('active');
    }
    athleteDiv.dataset.id = athlete.id;
    // Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = athlete.name;
    athleteDiv.appendChild(nameSpan);
    // Löschen-Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    athleteDiv.appendChild(deleteBtn);
    athleteListEl.appendChild(athleteDiv);
  });
}

// UI aktualisieren: Plan-Tabs für aktuellen Athleten
function refreshPlanTabs() {
  planTabsEl.innerHTML = '';
  const athlete = getSelectedAthlete();
  if (!athlete) return;
  athlete.plans.forEach(plan => {
    const tabDiv = document.createElement('div');
    tabDiv.className = 'plan-tab';
    if (plan.id === athlete.currentPlan) {
      tabDiv.classList.add('active');
    }
    tabDiv.dataset.id = plan.id;
    // Plan-Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'plan-name';
    nameSpan.textContent = plan.name;
    tabDiv.appendChild(nameSpan);
    // Plan löschen Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    tabDiv.appendChild(deleteBtn);
    planTabsEl.appendChild(tabDiv);
  });
}

// UI aktualisieren: Wochenplan-Texte füllen
function refreshWeekView() {
  const athlete = getSelectedAthlete();
  document.querySelectorAll('.day-text').forEach(textarea => {
    const dayIndex = parseInt(textarea.dataset.dayIndex, 10);
    if (athlete && athlete.currentPlan) {
      const plan = athlete.plans.find(p => p.id === athlete.currentPlan);
      textarea.value = plan ? (plan.days[dayIndex] || '') : '';
    } else {
      textarea.value = '';
    }
  });
}

// UI aktualisieren: Übungenliste
function refreshExerciseList() {
  exerciseListEl.innerHTML = '';
  exercises.forEach((exName, index) => {
    const exDiv = document.createElement('div');
    exDiv.className = 'exercise';
    exDiv.dataset.index = index;
    exDiv.textContent = exName;
    // Löschen-Button hinzufügen
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    exDiv.appendChild(deleteBtn);
    exerciseListEl.appendChild(exDiv);
  });
}

// Trainingsplan-Text speichern bei Änderungen
function updatePlanDay(dayIndex, text) {
  const athlete = getSelectedAthlete();
  if (!athlete || !athlete.currentPlan) return;
  const plan = athlete.plans.find(p => p.id === athlete.currentPlan);
  if (!plan) return;
  plan.days[dayIndex] = text;
  saveAthletes();
}

// Zuletzt fokussierter Tag (für Klick-zu-Einfügen von Übungen)
let lastFocusedDayIndex = null;

// Event Listener: Textänderungen und Drag&Drop in Tages-Textfeldern
document.querySelectorAll('.day-text').forEach(textarea => {
  // Textänderung -> speichern
  textarea.addEventListener('input', e => {
    const idx = parseInt(e.target.dataset.dayIndex, 10);
    updatePlanDay(idx, e.target.value);
  });
  // Fokus merken
  textarea.addEventListener('focus', e => {
    lastFocusedDayIndex = parseInt(e.target.dataset.dayIndex, 10);
  });
  // Fokus-Verlust (nach kurzer Zeit resetten)
  textarea.addEventListener('blur', e => {
    setTimeout(() => { lastFocusedDayIndex = null; }, 100);
  });
  // Drag & Drop Events für Übungen
  textarea.addEventListener('dragover', e => {
    e.preventDefault();
  });
  textarea.addEventListener('dragenter', e => {
    e.target.classList.add('drag-over');
  });
  textarea.addEventListener('dragleave', e => {
    e.target.classList.remove('drag-over');
  });
  textarea.addEventListener('drop', e => {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    const exerciseText = e.dataTransfer.getData('text/plain');
    if (exerciseText) {
      const idx = parseInt(e.target.dataset.dayIndex, 10);
      const value = e.target.value;
      // An Einfügeposition oder am Ende einfügen
      let pos = e.target.selectionStart;
      if (pos == null) pos = value.length;
      const newText = value.substring(0, pos) + exerciseText + value.substring(pos);
      e.target.value = newText;
      // Cursor hinter eingefügtem Text setzen
      const cursorPos = pos + exerciseText.length;
      e.target.selectionStart = e.target.selectionEnd = cursorPos;
      updatePlanDay(idx, newText);
    }
  });
});

// Athlet hinzufügen
addAthleteBtn.addEventListener('click', () => {
  const newId = athletes.length > 0 ? Math.max(...athletes.map(a => a.id)) + 1 : 1;
  const defaultName = 'Athlet ' + (athletes.length + 1);
  const newAthlete = {
    id: newId,
    name: defaultName,
    currentPlan: null,
    plans: []
  };
  // Ersten Plan automatisch hinzufügen
  const firstPlanId = 1;
  newAthlete.plans.push({ id: firstPlanId, name: 'Plan 1', days: ['', '', '', '', '', '', ''] });
  newAthlete.currentPlan = firstPlanId;
  athletes.push(newAthlete);
  selectedAthleteId = newAthlete.id;
  localStorage.setItem('selectedAthleteId', selectedAthleteId);
  saveAthletes();
  // UI aktualisieren
  refreshAthleteList();
  refreshPlanTabs();
  refreshWeekView();
});

// Athletenliste: Klick-Events für Auswahl/Löschen
athleteListEl.addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('delete-btn')) {
    // Athlet löschen
    const athleteDiv = target.closest('.athlete');
    if (!athleteDiv) return;
    const athleteId = parseInt(athleteDiv.dataset.id, 10);
    const idx = athletes.findIndex(a => a.id === athleteId);
    if (idx !== -1) {
      athletes.splice(idx, 1);
      saveAthletes();
      // Auswahl wechseln, wenn der gelöschte Athlet ausgewählt war
      if (selectedAthleteId === athleteId) {
        if (athletes.length > 0) {
          const newIndex = idx < athletes.length ? idx : athletes.length - 1;
          selectedAthleteId = athletes[newIndex].id;
        } else {
          selectedAthleteId = null;
        }
        localStorage.setItem('selectedAthleteId', selectedAthleteId || '');
      }
      refreshAthleteList();
      refreshPlanTabs();
      refreshWeekView();
    }
    return;
  }
  // Athlet auswählen
  const athleteDiv = target.closest('.athlete');
  if (athleteDiv) {
    const athleteId = parseInt(athleteDiv.dataset.id, 10);
    if (selectedAthleteId !== athleteId) {
      selectedAthleteId = athleteId;
      localStorage.setItem('selectedAthleteId', selectedAthleteId);
      document.querySelectorAll('.athlete').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.id, 10) === athleteId);
      });
      // Plan-Tabs für neuen Athleten anzeigen
      const athlete = getSelectedAthlete();
      if (athlete) {
        if (athlete.plans.length === 0) {
          athlete.currentPlan = null;
        }
        if (athlete.plans.length > 0 && !athlete.plans.find(p => p.id === athlete.currentPlan)) {
          athlete.currentPlan = athlete.plans[0].id;
        }
      }
      refreshPlanTabs();
      refreshWeekView();
      saveAthletes();
    }
  }
});

// Athletenliste: Doppelklick auf Athlet (Umbenennen)
athleteListEl.addEventListener('dblclick', e => {
  const athleteDiv = e.target.closest('.athlete');
  if (!athleteDiv || e.target.classList.contains('delete-btn')) return;
  // Falls gerade im Bearbeitungsmodus, nichts tun
  if (athleteDiv.querySelector('input')) return;
  const nameSpan = athleteDiv.querySelector('.name');
  const oldName = nameSpan.textContent;
  // Name-Span durch ein Input ersetzen
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldName;
  athleteDiv.insertBefore(input, nameSpan);
  athleteDiv.removeChild(nameSpan);
  input.focus();
  input.select();
  // Eingabe-Events (Enter/Escape/Blur)
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      input.blur();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      cancelEdit();
    }
  });
  input.addEventListener('blur', () => {
    if (!input) return;
    const newName = input.value.trim();
    if (newName === '') {
      cancelEdit();
      return;
    }
    const athleteId = parseInt(athleteDiv.dataset.id, 10);
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      athlete.name = newName;
      saveAthletes();
    }
    finishEdit(newName);
  });
  function finishEdit(name) {
    const newSpan = document.createElement('span');
    newSpan.className = 'name';
    newSpan.textContent = name;
    athleteDiv.insertBefore(newSpan, input);
    athleteDiv.removeChild(input);
  }
  function cancelEdit() {
    finishEdit(oldName);
  }
});

// Neuen Plan hinzufügen
addPlanBtn.addEventListener('click', () => {
  const athlete = getSelectedAthlete();
  if (!athlete) return;
  const newPlanId = athlete.plans.length > 0 ? Math.max(...athlete.plans.map(p => p.id)) + 1 : 1;
  const defaultPlanName = 'Plan ' + (athlete.plans.length + 1);
  const newPlan = { id: newPlanId, name: defaultPlanName, days: ['', '', '', '', '', '', ''] };
  athlete.plans.push(newPlan);
  athlete.currentPlan = newPlan.id;
  saveAthletes();
  refreshPlanTabs();
  refreshWeekView();
});

// Plan-Tabs: Klick (Plan aktivieren oder löschen)
planTabsEl.addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('delete-btn')) {
    // Plan löschen
    const tabDiv = target.closest('.plan-tab');
    if (!tabDiv) return;
    const planId = parseInt(tabDiv.dataset.id, 10);
    const athlete = getSelectedAthlete();
    if (!athlete) return;
    const planIndex = athlete.plans.findIndex(p => p.id === planId);
    if (planIndex !== -1) {
      athlete.plans.splice(planIndex, 1);
      if (athlete.currentPlan === planId) {
        athlete.currentPlan = athlete.plans.length > 0 ? athlete.plans[0].id : null;
      }
      saveAthletes();
      refreshPlanTabs();
      refreshWeekView();
    }
    return;
  }
  const tabDiv = e.target.closest('.plan-tab');
  if (tabDiv) {
    const planId = parseInt(tabDiv.dataset.id, 10);
    const athlete = getSelectedAthlete();
    if (!athlete) return;
    if (athlete.currentPlan !== planId) {
      athlete.currentPlan = planId;
      saveAthletes();
      document.querySelectorAll('.plan-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.id, 10) === planId);
      });
      refreshWeekView();
    }
  }
});

// Plan-Tab Doppelklick (Plan umbenennen)
planTabsEl.addEventListener('dblclick', e => {
  const tabDiv = e.target.closest('.plan-tab');
  if (!tabDiv || e.target.classList.contains('delete-btn')) return;
  if (tabDiv.querySelector('input')) return; // schon im Editiermodus
  const planId = parseInt(tabDiv.dataset.id, 10);
  const athlete = getSelectedAthlete();
  if (!athlete) return;
  const plan = athlete.plans.find(p => p.id === planId);
  if (!plan) return;
  const nameSpan = tabDiv.querySelector('.plan-name');
  const oldName = nameSpan.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldName;
  tabDiv.insertBefore(input, nameSpan);
  tabDiv.removeChild(nameSpan);
  input.focus();
  input.select();
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      input.blur();
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      cancelEdit();
    }
  });
  input.addEventListener('blur', () => {
    if (!input) return;
    const newName = input.value.trim();
    if (newName === '') {
      cancelEdit();
      return;
    }
    plan.name = newName;
    saveAthletes();
    finishEdit(newName);
  });
  function finishEdit(name) {
    const newSpan = document.createElement('span');
    newSpan.className = 'plan-name';
    newSpan.textContent = name;
    tabDiv.insertBefore(newSpan, input);
    tabDiv.removeChild(input);
  }
  function cancelEdit() {
    finishEdit(oldName);
  }
});

// Neue Übung hinzufügen
addExerciseBtn.addEventListener('click', () => {
  const name = newExerciseInput.value.trim();
  if (name === '') return;
  exercises.push(name);
  saveExercises();
  refreshExerciseList();
  newExerciseInput.value = '';
});

// Übungenliste: Klick (Übung einfügen oder löschen)
exerciseListEl.addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('delete-btn')) {
    // Übung löschen
    const exDiv = target.closest('.exercise');
    if (!exDiv) return;
    const index = parseInt(exDiv.dataset.index, 10);
    if (!isNaN(index)) {
      exercises.splice(index, 1);
      saveExercises();
      refreshExerciseList();
    }
    return;
  }
  const exDiv = target.closest('.exercise');
  if (exDiv) {
    // Übung per Klick in aktives Tagesfeld einfügen
    if (lastFocusedDayIndex !== null) {
      const exerciseName = exDiv.textContent.replace('×', '').trim();
      const athlete = getSelectedAthlete();
      if (athlete && athlete.currentPlan) {
        const plan = athlete.plans.find(p => p.id === athlete.currentPlan);
        if (plan) {
          const idx = lastFocusedDayIndex;
          let currentText = plan.days[idx] || '';
          if (currentText !== '') {
            currentText += '\\n';
          }
          currentText += exerciseName;
          plan.days[idx] = currentText;
          saveAthletes();
          // Tages-Textfeld aktualisieren und Fokus setzen
          const textarea = document.querySelector('.day-text[data-day-index=\"' + idx + '\"]');
          if (textarea) {
            textarea.value = currentText;
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
          }
        }
      }
    }
  }
});

// Drag-Start auf Übung (für Drag & Drop)
exerciseListEl.addEventListener('dragstart', e => {
  const exDiv = e.target.closest('.exercise');
  if (!exDiv) return;
  e.dataTransfer.setData('text/plain', exDiv.textContent.replace('×', '').trim());
  e.dataTransfer.effectAllowed = 'copy';
  // Ghost-Effekt (Transparenz)
  exDiv.classList.add('drag-ghost');
});
exerciseListEl.addEventListener('dragend', e => {
  const exDiv = e.target.closest('.exercise');
  if (!exDiv) return;
  exDiv.classList.remove('drag-ghost');
});

// Initiale Darstellung beim Laden
refreshAthleteList();
if (athletes.length > 0) {
  if (!selectedAthleteId || !athletes.find(a => a.id === selectedAthleteId)) {
    selectedAthleteId = athletes[0].id;
    localStorage.setItem('selectedAthleteId', selectedAthleteId);
  }
}
refreshAthleteList(); // erneut aufrufen, um evtl. Auswahl hervorzuheben
refreshPlanTabs();
refreshWeekView();
refreshExerciseList();