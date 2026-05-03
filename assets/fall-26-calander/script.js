const semesterStart = new Date(2026, 7, 24);
const semesterEnd = new Date(2026, 11, 18);
const weekCount = 17;
const storageKey = "ou-fall-2026-calendar-v2";
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortWeekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hatchDates = new Set([
  "2026-09-07",
  "2026-10-01",
  "2026-10-02",
  "2026-10-08",
  "2026-10-09",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",
  "2026-11-28",
  "2026-11-29"
]);
const dayNotes = {
  "2026-09-07": "Labor Day",
  "2026-10-01": "ACSA",
  "2026-10-02": "ACSA",
  "2026-10-08": "ACSP",
  "2026-10-09": "ACSP",
  "2026-10-10": "OU VS. TX",
  "2026-11-25": "Thanksgiving"
};

const recurringClassEvents = makeRecurringClassEvents();
let events = loadEvents();

const calendarGrid = document.querySelector("#calendarGrid");
const eventTemplate = document.querySelector("#eventTemplate");

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeRecurringClassEvents() {
  const blocks = [
    { start: "09:00", end: "10:15" },
    { start: "12:00", end: "13:15" }
  ];
  const generated = [];

  for (let week = 1; week <= 15; week += 1) {
    if (week === 14) continue;

    [1, 3].forEach((dayOffset) => {
      const date = addDays(semesterStart, (week - 1) * 7 + dayOffset);

      blocks.forEach((block) => {
        generated.push({
          id: `class-w${week}-${dateKey(date)}-${block.start}`,
          title: `Class meeting · Week ${week}`,
          date: dateKey(date),
          start: block.start,
          end: block.end,
          type: "class"
        });
      });
    });
  }

  return generated;
}

function loadEvents() {
  const fixedEvents = [...recurringClassEvents];
  const saved = localStorage.getItem(storageKey);
  if (!saved) return fixedEvents;

  try {
    const parsed = JSON.parse(saved);
    const customEvents = Array.isArray(parsed) ? parsed.filter((event) => event.custom) : [];
    return [...fixedEvents, ...customEvents];
  } catch {
    return fixedEvents;
  }
}

function saveEvents() {
  localStorage.setItem(storageKey, JSON.stringify(events.filter((event) => event.custom)));
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${shortWeekday[date.getDay()]}, ${monthNames[month - 1]} ${day}`;
}

function toDisplayTime(value) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function timeParts(value) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  return {
    time: `${hour % 12 || 12}:${minute}`,
    suffix: hour >= 12 ? "PM" : "AM"
  };
}

function formatTime(event) {
  if (!event.start && !event.end) return "All day";
  if (event.start && event.end) {
    const start = timeParts(event.start);
    const end = timeParts(event.end);
    const startText = start.suffix === end.suffix ? start.time : `${start.time} ${start.suffix}`;
    return `${startText} - ${end.time} ${end.suffix}`;
  }
  return toDisplayTime(event.start || event.end);
}

function eventsForDate(key) {
  return events
    .filter((event) => event.date === key)
    .sort((a, b) => (a.start || "99:99").localeCompare(b.start || "99:99"));
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  for (let week = 1; week <= weekCount; week += 1) {
    const weekRow = document.createElement("section");
    weekRow.className = "week-row";

    const weekStart = addDays(semesterStart, (week - 1) * 7);
    const weekLabel = document.createElement("header");
    weekLabel.className = "week-label";

    const label = document.createElement("strong");
    label.textContent = `Week ${week}`;
    weekLabel.append(label);

    if (week === 16) {
      const review = document.createElement("span");
      review.className = "week-note";
      review.textContent = "Final Review TBD";
      weekLabel.append(review);
    }

    weekRow.append(weekLabel);

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const currentDate = addDays(weekStart, dayOffset);
      const key = dateKey(currentDate);
      const dayEvents = eventsForDate(key);
      const cell = document.createElement("article");
      cell.className = "day-cell";

      if (currentDate < semesterStart || currentDate > semesterEnd) {
        cell.classList.add("is-muted");
      }

      if (key === "2026-08-24") {
        cell.classList.add("is-semester-start");
      }

      if (hatchDates.has(key)) {
        cell.classList.add("is-holiday");
      }

      if (key >= "2026-12-14" && key <= "2026-12-18") {
        cell.classList.add("is-finals");
      }

      if (week === 17) {
        cell.classList.add("is-finals");
      }

      const dateHeader = document.createElement("div");
      dateHeader.className = "date-number";
      const dateText = document.createElement("span");
      dateText.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}`;
      dateHeader.append(dateText);

      if (dayEvents.length) {
        const count = document.createElement("small");
        count.textContent = dayEvents.length;
        dateHeader.append(count);
      }

      const stack = document.createElement("div");
      stack.className = "event-stack";

      if (dayNotes[key]) {
        const note = document.createElement("div");
        note.className = "day-note";
        note.textContent = dayNotes[key];
        stack.append(note);
      }

      dayEvents.forEach((event) => {
        const pill = eventTemplate.content.firstElementChild.cloneNode(true);
        pill.dataset.type = event.type;
        pill.textContent = formatTime(event);
        pill.title = `${event.title} - ${formatDate(event.date)} - ${formatTime(event)}`;
        stack.append(pill);
      });

      cell.append(dateHeader, stack);
      weekRow.append(cell);
    }

    calendarGrid.append(weekRow);
  }
}

function render() {
  renderCalendar();
}

render();
