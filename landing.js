const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);

function fmtUp(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return d + "d " + h + "h";
  if (h) return h + "h " + m + "m";
  return m + "m";
}

function initLandingTheme() {
  const apply = (t, a) => {
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    if (a) document.documentElement.style.setProperty("--accent", a);
    try { localStorage.setItem("ui_theme_v2", t); } catch (e) {}
    const btn = $("landThemeBtn");
    if (btn) btn.textContent = t === "dark" ? "Light mode" : "Dark mode";
  };
  let t = "light", a = "#8b5cf6";
  try { t = localStorage.getItem("ui_theme_v2") || "light"; a = localStorage.getItem("ui_accent") || "#8b5cf6"; } catch (e) {}
  apply(t, a);
  const btn = $("landThemeBtn");
  if (btn) btn.onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    apply(cur === "dark" ? "light" : "dark", a);
  };
}

async function loadLiveStats() {
  try {
    const r = await fetch(API_URL + "/health", { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    const ping = d.discord_ping_ms != null ? d.discord_ping_ms + " ms" : "Online";
    if ($("liveText")) $("liveText").textContent = "Online · " + ping;
    if ($("stSrv")) $("stSrv").textContent = d.guilds != null ? String(d.guilds) : "—";
    if ($("stPing")) $("stPing").textContent = ping;
    if ($("stUp")) $("stUp").textContent = fmtUp(d.uptime_s);
  } catch (e) {
    if ($("liveText")) $("liveText").textContent = "Status unavailable";
  }
}

initLandingTheme();
loadLiveStats();
