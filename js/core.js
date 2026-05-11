// ============================================================
//  VOX ECONOMY — core.js
//  All data lives in localStorage under the key "vox_db"
// ============================================================

const VOX = (() => {
  const DB_KEY = "vox_db";
  const ADMIN_SECRET = "voxmaster"; // change this!

  // ── helpers ──────────────────────────────────────────────
  function load() {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || seed(); }
    catch { return seed(); }
  }
  function save(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

  function seed() {
    const db = { users: {}, transactions: [], shopListings: [], pendingUsers: [] };
    // create super-admin account
    db.users["admin"] = {
      id: "admin", username: "admin", passwordHash: hash("voxmaster"),
      balance: 999999, approved: true, isAdmin: true,
      joinedAt: Date.now(), avatar: "👑"
    };
    save(db);
    return db;
  }

  // very simple hash (good enough for a fun school economy)
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h.toString(36);
  }

  // ── auth ─────────────────────────────────────────────────
  function register(username, password, avatar = "🙂") {
    const db = load();
    if (!username || username.length < 2) return { ok: false, msg: "Username too short." };
    if (db.users[username] || db.pendingUsers.find(u => u.username === username))
      return { ok: false, msg: "Username taken." };
    const user = { id: username, username, passwordHash: hash(password), balance: 0, approved: false, isAdmin: false, joinedAt: Date.now(), avatar };
    db.pendingUsers.push(user);
    save(db);
    return { ok: true, msg: "Account requested! Wait for admin approval." };
  }

  function login(username, password) {
    const db = load();
    const user = db.users[username];
    if (!user) return { ok: false, msg: "User not found." };
    if (user.passwordHash !== hash(password)) return { ok: false, msg: "Wrong password." };
    sessionStorage.setItem("vox_session", username);
    return { ok: true, user };
  }

  function logout() { sessionStorage.removeItem("vox_session"); }

  function currentUser() {
    const id = sessionStorage.getItem("vox_session");
    if (!id) return null;
    return load().users[id] || null;
  }

  function requireLogin(redirect = "../index.html") {
    if (!currentUser()) { window.location.href = redirect; }
    return currentUser();
  }

  function requireAdmin(redirect = "../index.html") {
    const u = requireLogin(redirect);
    if (!u.isAdmin) { window.location.href = redirect; }
    return u;
  }

  // ── transactions ─────────────────────────────────────────
  function transfer(fromId, toId, amount, note = "") {
    const db = load();
    const from = db.users[fromId], to = db.users[toId];
    if (!from || !to) return { ok: false, msg: "User not found." };
    if (amount <= 0) return { ok: false, msg: "Amount must be positive." };
    if (from.balance < amount) return { ok: false, msg: "Insufficient Vox." };
    from.balance -= amount;
    to.balance += amount;
    db.transactions.unshift({ id: Date.now(), from: fromId, to: toId, amount, note, ts: Date.now() });
    save(db);
    return { ok: true };
  }

  function mint(userId, amount, note = "Admin mint") {
    const db = load();
    if (!db.users[userId]) return { ok: false, msg: "User not found." };
    db.users[userId].balance += amount;
    db.transactions.unshift({ id: Date.now(), from: "MINT", to: userId, amount, note, ts: Date.now() });
    save(db);
    return { ok: true };
  }

  function burn(userId, amount, note = "Admin burn") {
    const db = load();
    if (!db.users[userId]) return { ok: false, msg: "User not found." };
    db.users[userId].balance = Math.max(0, db.users[userId].balance - amount);
    db.transactions.unshift({ id: Date.now(), from: userId, to: "BURN", amount, note, ts: Date.now() });
    save(db);
    return { ok: true };
  }

  function txHistory(userId, limit = 30) {
    return load().transactions.filter(t => t.from === userId || t.to === userId).slice(0, limit);
  }

  // ── admin ─────────────────────────────────────────────────
  function approveUser(username) {
    const db = load();
    const idx = db.pendingUsers.findIndex(u => u.username === username);
    if (idx === -1) return { ok: false, msg: "Not found." };
    const [user] = db.pendingUsers.splice(idx, 1);
    user.approved = true;
    user.balance = 100; // starter Vox
    db.users[username] = user;
    db.transactions.unshift({ id: Date.now(), from: "MINT", to: username, amount: 100, note: "Welcome bonus", ts: Date.now() });
    save(db);
    return { ok: true };
  }

  function rejectUser(username) {
    const db = load();
    db.pendingUsers = db.pendingUsers.filter(u => u.username !== username);
    save(db);
    return { ok: true };
  }

  function allUsers() { return Object.values(load().users); }
  function pendingUsers() { return load().pendingUsers; }

  // ── shop ──────────────────────────────────────────────────
  function listItem(sellerId, title, description, price, category = "other") {
    const db = load();
    const item = { id: Date.now(), sellerId, title, description, price, category, createdAt: Date.now(), sold: false };
    db.shopListings.unshift(item);
    save(db);
    return { ok: true, item };
  }

  function buyItem(buyerId, itemId) {
    const db = load();
    const item = db.shopListings.find(i => i.id === itemId);
    if (!item) return { ok: false, msg: "Item not found." };
    if (item.sold) return { ok: false, msg: "Already sold." };
    if (item.sellerId === buyerId) return { ok: false, msg: "Can't buy your own listing." };
    const buyer = db.users[buyerId], seller = db.users[item.sellerId];
    if (!buyer || !seller) return { ok: false, msg: "User error." };
    if (buyer.balance < item.price) return { ok: false, msg: "Insufficient Vox." };
    buyer.balance -= item.price;
    seller.balance += item.price;
    item.sold = true;
    item.buyerId = buyerId;
    item.soldAt = Date.now();
    db.transactions.unshift({ id: Date.now(), from: buyerId, to: item.sellerId, amount: item.price, note: `Bought: ${item.title}`, ts: Date.now() });
    save(db);
    return { ok: true };
  }

  function deleteItem(itemId, requesterId) {
    const db = load();
    const idx = db.shopListings.findIndex(i => i.id === itemId);
    if (idx === -1) return { ok: false, msg: "Not found." };
    const item = db.shopListings[idx];
    if (item.sellerId !== requesterId && !db.users[requesterId]?.isAdmin)
      return { ok: false, msg: "Not allowed." };
    db.shopListings.splice(idx, 1);
    save(db);
    return { ok: true };
  }

  function shopListings() { return load().shopListings; }

  // ── leaderboard ───────────────────────────────────────────
  function leaderboard() {
    return allUsers().filter(u => !u.isAdmin).sort((a, b) => b.balance - a.balance);
  }

  // ── gambling helpers ──────────────────────────────────────
  function gambleResult(userId, wager, won) {
    const db = load();
    const user = db.users[userId];
    if (!user) return { ok: false, msg: "User not found." };
    if (wager > user.balance) return { ok: false, msg: "Insufficient Vox." };
    const delta = won ? wager : -wager;
    user.balance = Math.max(0, user.balance + delta);
    db.transactions.unshift({ id: Date.now(), from: won ? "GAMBLE_WIN" : userId, to: won ? userId : "GAMBLE_LOSE", amount: wager, note: won ? "Gambling win" : "Gambling loss", ts: Date.now() });
    save(db);
    return { ok: true, newBalance: user.balance, delta };
  }

  function pvpGamble(winnerId, loserId, wager) {
    const db = load();
    const winner = db.users[winnerId], loser = db.users[loserId];
    if (!winner || !loser) return { ok: false, msg: "User not found." };
    if (loser.balance < wager) return { ok: false, msg: `${loserId} doesn't have enough Vox.` };
    if (winner.balance < wager) return { ok: false, msg: `${winnerId} doesn't have enough Vox.` };
    loser.balance -= wager;
    winner.balance += wager;
    db.transactions.unshift({ id: Date.now(), from: loserId, to: winnerId, amount: wager, note: "PvP gamble", ts: Date.now() });
    save(db);
    return { ok: true };
  }

  function refreshUser() {
    const id = sessionStorage.getItem("vox_session");
    return id ? load().users[id] : null;
  }

  function fmt(n) { return Number(n).toLocaleString(); }

  return {
    register, login, logout, currentUser, requireLogin, requireAdmin, refreshUser,
    transfer, mint, burn, txHistory,
    approveUser, rejectUser, allUsers, pendingUsers,
    listItem, buyItem, deleteItem, shopListings,
    leaderboard,
    gambleResult, pvpGamble,
    fmt, load, save
  };
})();
