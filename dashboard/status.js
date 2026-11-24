const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);

async function check() {
  const b = $("stBadge");
  const d = $("stDetail");
  b.textContent = "Checking...";
  b.className = "badge";
  const t0 = performance.now();
  try {
    const res = await fetch(API_URL + "/health");
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) throw new Error("HTTP " + res.status);
    b.textContent = "Online";
    b.className = "badge ok";
    d.textContent = "API & Bot responded in " + ms + " ms (" + new Date().toLocaleTimeString() + ").";
  } catch (e) {
    b.textContent = "Offline / Unreachable";
    b.className = "badge bad";
    d.textContent = "Could not reach the bot API: " + e.message;
  }
}

$("stRefresh").onclick = check;
check();