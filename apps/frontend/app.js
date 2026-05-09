const fields = {
  service: document.querySelector("#service"),
  database: document.querySelector("#database"),
  visits: document.querySelector("#visits"),
  timestamp: document.querySelector("#timestamp")
};

async function refresh() {
  const response = await fetch("/api/status");
  const data = await response.json();
  fields.service.textContent = data.service;
  fields.database.textContent = data.database;
  fields.visits.textContent = data.visits;
  fields.timestamp.textContent = data.timestamp;
}

async function writeVisit() {
  await fetch("/api/visits", { method: "POST" });
  await refresh();
}

document.querySelector("#visitButton").addEventListener("click", writeVisit);
document.querySelector("#refreshButton").addEventListener("click", refresh);

refresh().catch((error) => {
  fields.service.textContent = "Unavailable";
  fields.database.textContent = error.message;
});

