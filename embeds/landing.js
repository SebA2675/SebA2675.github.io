const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);
function fmtUp(s) {
  if (s == null) return "—";
  s = Math.floor(s);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return d + "d " + h + "h";
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}
(async () => {
  try {
    const res = await fetch(API_URL + "/health");
    const d = await res.json();
    $("liveText").textContent = (d.ready ? "Online" : "Starting") + (d.discord_latency_ms != null ? " · " + d.discord_latency_ms + " ms" : "");
    $("stSrv").textContent = d.servers ?? "—";
    $("stPing").textContent = d.discord_latency_ms != null ? d.discord_latency_ms + " ms" : "—";
    $("stUp").textContent = fmtUp(d.uptime_seconds);
  } catch (e) {
    $("liveText").textContent = "Offline";
  }
})();