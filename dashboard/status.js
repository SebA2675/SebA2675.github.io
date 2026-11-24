const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);

function fmtUptime(sec) {
  if (sec === undefined || sec === null) return "—";
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return d + "d " + h + "h " + m + "m";
  if (h > 0) return h + "h " + m + "m";
  if (m > 0) return m + "m " + s + "s";
  return s + "s";
}

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
    const data = await res.json();
    const ready = data.ready !== false;
    b.textContent = ready ? "Online" : "Starting";
    b.className = "badge " + (ready ? "ok" : "warn");
    $("stSub").textContent = ready ? "All systems operational" : "Bot is connecting to Discord...";
    $("stBot").textContent = data.bot || "Online";
    $("stPing").textContent = data.discord_latency_ms !== null && data.discord_latency_ms !== undefined ? data.discord_latency_ms + " ms" : "—";
    $("stApi").textContent = ms + " ms";
    $("stUptime").textContent = fmtUptime(data.uptime_seconds);
    $("stServers").textContent = data.servers !== undefined ? String(data.servers) : "—";
    $("stTime").textContent = new Date().toLocaleTimeString();
    d.textContent = "";
  } catch (e) {
    b.textContent = "Offline";
    b.className = "badge bad";
    $("stSub").textContent = "Bot API unreachable";
    $("stTime").textContent = new Date().toLocaleTimeString();
    d.textContent = "Could not reach the bot API: " + e.message;
  }
}

$("stRefresh").onclick = check;
check();
setInterval(check, 30000);