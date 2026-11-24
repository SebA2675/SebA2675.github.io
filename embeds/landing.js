const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);

$("reqSubmit").onclick = async () => {
  const guild_id = $("reqGuildId").value.trim();
  const guild_name = $("reqGuildName").value.trim();
  const username = $("reqUsername").value.trim();
  const st = $("reqStatus");
  if (!/^\d{15,25}$/.test(guild_id)) { st.textContent = "Enter a valid numeric Discord Server ID."; return; }
  if (!guild_name || !username) { st.textContent = "Please fill in your server name and username."; return; }
  $("reqSubmit").disabled = true;
  st.textContent = "Sending request...";
  try {
    const res = await fetch(API_URL + "/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guild_id, guild_name, username }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.detail || "Error " + res.status);
    st.textContent = "Request submitted! The bot owner will review it shortly.";
    $("reqGuildId").value = "";
    $("reqGuildName").value = "";
    $("reqUsername").value = "";
  } catch (e) {
    st.textContent = "Failed: " + e.message;
  }
  $("reqSubmit").disabled = false;
};