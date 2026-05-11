// nav.js — inject nav into any page
function buildNav(activePage) {
  const user = VOX.currentUser();
  if (!user) return;

  const links = [
    { href: "dashboard.html", label: "Dashboard", icon: "⬡" },
    { href: "send.html", label: "Send", icon: "↗" },
    { href: "shop.html", label: "Shop", icon: "🛍" },
    { href: "gamble.html", label: "Gamble", icon: "🎲" },
    { href: "leaderboard.html", label: "Rich List", icon: "🏆" },
  ];
  if (user.isAdmin) links.push({ href: "admin.html", label: "Admin", icon: "⚙" });

  const base = location.pathname.includes("pages/") ? "" : "pages/";

  const nav = document.createElement("nav");
  nav.innerHTML = `
    <a class="nav-logo" href="${base}pages/dashboard.html">VOX ◈</a>
    ${links.map(l => `
      <a href="${base}pages/${l.href}" class="${activePage === l.href ? 'active' : ''}">
        <span style="margin-right:0.3rem">${l.icon}</span><span>${l.label}</span>
      </a>`).join("")}
    <span class="nav-balance" id="nav-bal">⬡ ${VOX.fmt(user.balance)}</span>
    <a href="#" onclick="VOX.logout();location.href='${base}index.html'" style="margin-left:0.5rem" class="">
      <span>⏻</span>
    </a>
  `;
  document.body.insertBefore(nav, document.body.firstChild);
}

function refreshNavBalance() {
  const el = document.getElementById("nav-bal");
  if (!el) return;
  const u = VOX.refreshUser();
  if (u) el.textContent = "⬡ " + VOX.fmt(u.balance);
}
