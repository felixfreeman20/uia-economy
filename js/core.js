// ============================================================
//  VOX ECONOMY — core.js (Firebase Firestore)
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCDH7tNjj-ru8YRyB15sZ0Kr4q0RFJTARI",
  authDomain: "vox-economy.firebaseapp.com",
  projectId: "vox-economy",
  storageBucket: "vox-economy.firebasestorage.app",
  messagingSenderId: "934068280189",
  appId: "1:934068280189:web:2b3e35451138c9130f0a14"
};

const FB_VER = "10.12.2";

const VOX = (() => {
  let _db = null;

  function loadScripts(urls) {
    return urls.reduce((p, url) => p.then(() => new Promise((res, rej) => {
      if (document.querySelector(`script[src="${url}"]`)) return res();
      const s = document.createElement("script");
      s.src = url; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    })), Promise.resolve());
  }

  async function init() {
    if (_db) return _db;
    await loadScripts([
      `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`,
      `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore-compat.js`
    ]);
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.firestore();
    const adminSnap = await _db.collection("users").doc("admin").get();
    if (!adminSnap.exists) {
      await _db.collection("users").doc("admin").set({
        id: "admin", username: "admin", passwordHash: hash("voxmaster"),
        balance: 999999, approved: true, isAdmin: true, joinedAt: Date.now(), avatar: "👑"
      });
    }
    return _db;
  }

  function db() { return _db; }

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h.toString(36);
  }

  // ── session ───────────────────────────────────────────────
  function currentUser() {
    try { return JSON.parse(sessionStorage.getItem("vox_user")); } catch { return null; }
  }
  function setSession(u) { sessionStorage.setItem("vox_user", JSON.stringify(u)); }
  function logout() { sessionStorage.removeItem("vox_user"); }

  async function refreshUser() {
    const s = currentUser();
    if (!s) return null;
    const snap = await db().collection("users").doc(s.id).get();
    if (!snap.exists) return null;
    setSession(snap.data());
    return snap.data();
  }

  function requireLogin(redirect = "../index.html") {
    if (!currentUser()) { window.location.href = redirect; return null; }
    return currentUser();
  }
  function requireAdmin(redirect = "../index.html") {
    const u = requireLogin(redirect);
    if (u && !u.isAdmin) { window.location.href = redirect; return null; }
    return u;
  }

  // ── auth ──────────────────────────────────────────────────
  async function register(username, password, avatar = "🙂") {
    await init();
    username = username.toLowerCase().trim();
    if (username.length < 2) return { ok: false, msg: "Username too short." };
    const [uSnap, pSnap] = await Promise.all([
      db().collection("users").doc(username).get(),
      db().collection("pending").doc(username).get()
    ]);
    if (uSnap.exists || pSnap.exists) return { ok: false, msg: "Username already taken." };
    await db().collection("pending").doc(username).set({
      id: username, username, passwordHash: hash(password),
      balance: 0, approved: false, isAdmin: false, joinedAt: Date.now(), avatar
    });
    return { ok: true, msg: "Account requested! Wait for admin approval." };
  }

  async function login(username, password) {
    await init();
    username = username.toLowerCase().trim();
    const snap = await db().collection("users").doc(username).get();
    if (!snap.exists) return { ok: false, msg: "User not found." };
    const user = snap.data();
    if (user.passwordHash !== hash(password)) return { ok: false, msg: "Wrong password." };
    setSession(user);
    return { ok: true, user };
  }

  // ── admin ─────────────────────────────────────────────────
  async function approveUser(username) {
    await init();
    const snap = await db().collection("pending").doc(username).get();
    if (!snap.exists) return { ok: false, msg: "Not found." };
    const user = { ...snap.data(), approved: true, balance: 100 };
    const batch = db().batch();
    batch.set(db().collection("users").doc(username), user);
    batch.delete(db().collection("pending").doc(username));
    batch.set(db().collection("transactions").doc(), { from: "MINT", to: username, amount: 100, note: "Welcome bonus", ts: Date.now() });
    await batch.commit();
    return { ok: true };
  }

  async function rejectUser(username) {
    await init();
    await db().collection("pending").doc(username).delete();
    return { ok: true };
  }

  async function allUsers() {
    await init();
    const snap = await db().collection("users").get();
    return snap.docs.map(d => d.data());
  }

  async function pendingUsers() {
    await init();
    const snap = await db().collection("pending").orderBy("joinedAt", "desc").get();
    return snap.docs.map(d => d.data());
  }

  // real-time listeners
  async function onPending(callback) {
    await init();
    return db().collection("pending").orderBy("joinedAt", "desc").onSnapshot(snap => {
      callback(snap.docs.map(d => d.data()));
    });
  }

  async function onUsers(callback) {
    await init();
    return db().collection("users").onSnapshot(snap => {
      callback(snap.docs.map(d => d.data()));
    });
  }

  async function onTx(userId, callback, limit = 25) {
    await init();
    return db().collection("transactions").orderBy("ts", "desc").limit(100).onSnapshot(snap => {
      const txs = snap.docs.map(d => d.data())
        .filter(t => !userId || t.from === userId || t.to === userId)
        .slice(0, limit);
      callback(txs);
    });
  }

  async function onShop(callback) {
    await init();
    return db().collection("shopListings").orderBy("createdAt", "desc").onSnapshot(snap => {
      callback(snap.docs.map(d => ({ ...d.data(), _docId: d.id })));
    });
  }

  // ── transactions ──────────────────────────────────────────
  async function transfer(fromId, toId, amount, note = "") {
    await init();
    amount = parseInt(amount);
    const [fSnap, tSnap] = await Promise.all([
      db().collection("users").doc(fromId).get(),
      db().collection("users").doc(toId).get()
    ]);
    if (!fSnap.exists || !tSnap.exists) return { ok: false, msg: "User not found." };
    if (amount <= 0) return { ok: false, msg: "Amount must be positive." };
    if (fSnap.data().balance < amount) return { ok: false, msg: "Insufficient Vox." };
    const batch = db().batch();
    batch.update(db().collection("users").doc(fromId), { balance: firebase.firestore.FieldValue.increment(-amount) });
    batch.update(db().collection("users").doc(toId), { balance: firebase.firestore.FieldValue.increment(amount) });
    batch.set(db().collection("transactions").doc(), { from: fromId, to: toId, amount, note, ts: Date.now() });
    await batch.commit();
    await refreshUser();
    return { ok: true };
  }

  async function mint(userId, amount, note = "Admin mint") {
    await init();
    amount = parseInt(amount);
    const batch = db().batch();
    batch.update(db().collection("users").doc(userId), { balance: firebase.firestore.FieldValue.increment(amount) });
    batch.set(db().collection("transactions").doc(), { from: "MINT", to: userId, amount, note, ts: Date.now() });
    await batch.commit();
    return { ok: true };
  }

  async function burn(userId, amount, note = "Admin burn") {
    await init();
    amount = parseInt(amount);
    const snap = await db().collection("users").doc(userId).get();
    const actual = Math.min(amount, snap.data().balance);
    const batch = db().batch();
    batch.update(db().collection("users").doc(userId), { balance: firebase.firestore.FieldValue.increment(-actual) });
    batch.set(db().collection("transactions").doc(), { from: userId, to: "BURN", amount: actual, note, ts: Date.now() });
    await batch.commit();
    return { ok: true };
  }

  async function allTx(limit = 50) {
    await init();
    const snap = await db().collection("transactions").orderBy("ts", "desc").limit(limit).get();
    return snap.docs.map(d => d.data());
  }

  // ── shop ──────────────────────────────────────────────────
  async function listItem(sellerId, title, description, price, category = "other") {
    await init();
    await db().collection("shopListings").add({
      sellerId, title, description, price: parseInt(price),
      category, createdAt: Date.now(), sold: false
    });
    return { ok: true };
  }

  async function buyItem(buyerId, docId) {
    await init();
    const itemSnap = await db().collection("shopListings").doc(docId).get();
    if (!itemSnap.exists) return { ok: false, msg: "Item not found." };
    const item = itemSnap.data();
    if (item.sold) return { ok: false, msg: "Already sold." };
    if (item.sellerId === buyerId) return { ok: false, msg: "Can't buy your own listing." };
    const buyerSnap = await db().collection("users").doc(buyerId).get();
    if (buyerSnap.data().balance < item.price) return { ok: false, msg: "Insufficient Vox." };
    const batch = db().batch();
    batch.update(db().collection("users").doc(buyerId), { balance: firebase.firestore.FieldValue.increment(-item.price) });
    batch.update(db().collection("users").doc(item.sellerId), { balance: firebase.firestore.FieldValue.increment(item.price) });
    batch.update(db().collection("shopListings").doc(docId), { sold: true, buyerId, soldAt: Date.now() });
    batch.set(db().collection("transactions").doc(), { from: buyerId, to: item.sellerId, amount: item.price, note: `Bought: ${item.title}`, ts: Date.now() });
    await batch.commit();
    await refreshUser();
    return { ok: true };
  }

  async function deleteItem(docId, requesterId) {
    await init();
    const snap = await db().collection("shopListings").doc(docId).get();
    if (!snap.exists) return { ok: false, msg: "Not found." };
    const item = snap.data();
    const uSnap = await db().collection("users").doc(requesterId).get();
    if (item.sellerId !== requesterId && !uSnap.data()?.isAdmin) return { ok: false, msg: "Not allowed." };
    await db().collection("shopListings").doc(docId).delete();
    return { ok: true };
  }

  // ── leaderboard ───────────────────────────────────────────
  async function leaderboard() {
    const users = await allUsers();
    return users.filter(u => !u.isAdmin).sort((a, b) => b.balance - a.balance);
  }

  // ── gambling ──────────────────────────────────────────────
  async function gambleResult(userId, wager, won) {
    await init();
    wager = parseInt(wager);
    const snap = await db().collection("users").doc(userId).get();
    if (snap.data().balance < wager) return { ok: false, msg: "Insufficient Vox." };
    const delta = won ? wager : -wager;
    const batch = db().batch();
    batch.update(db().collection("users").doc(userId), { balance: firebase.firestore.FieldValue.increment(delta) });
    batch.set(db().collection("transactions").doc(), {
      from: won ? "GAMBLE_WIN" : userId, to: won ? userId : "GAMBLE_LOSE",
      amount: wager, note: won ? "Gambling win" : "Gambling loss", ts: Date.now()
    });
    await batch.commit();
    await refreshUser();
    return { ok: true };
  }

  async function gambleMulti(userId, wager, multiplier) {
    await init();
    wager = parseInt(wager);
    const snap = await db().collection("users").doc(userId).get();
    if (snap.data().balance < wager) return { ok: false, msg: "Insufficient Vox." };
    const delta = multiplier === 0 ? -wager : Math.round(wager * multiplier) - wager;
    const batch = db().batch();
    batch.update(db().collection("users").doc(userId), { balance: firebase.firestore.FieldValue.increment(delta) });
    batch.set(db().collection("transactions").doc(), {
      from: delta >= 0 ? "GAMBLE_WIN" : userId, to: delta >= 0 ? userId : "GAMBLE_LOSE",
      amount: Math.abs(delta) || wager, note: delta >= 0 ? `Slots ${multiplier}×` : "Slots loss", ts: Date.now()
    });
    await batch.commit();
    await refreshUser();
    return { ok: true };
  }

  async function pvpGamble(winnerId, loserId, wager) {
    await init();
    wager = parseInt(wager);
    const [ws, ls] = await Promise.all([
      db().collection("users").doc(winnerId).get(),
      db().collection("users").doc(loserId).get()
    ]);
    if (!ws.exists || !ls.exists) return { ok: false, msg: "User not found." };
    if (ls.data().balance < wager) return { ok: false, msg: `${loserId} doesn't have enough Vox.` };
    if (ws.data().balance < wager) return { ok: false, msg: `${winnerId} doesn't have enough Vox.` };
    const batch = db().batch();
    batch.update(db().collection("users").doc(loserId), { balance: firebase.firestore.FieldValue.increment(-wager) });
    batch.update(db().collection("users").doc(winnerId), { balance: firebase.firestore.FieldValue.increment(wager) });
    batch.set(db().collection("transactions").doc(), { from: loserId, to: winnerId, amount: wager, note: "PvP gamble", ts: Date.now() });
    await batch.commit();
    await refreshUser();
    return { ok: true };
  }

  function fmt(n) { return Number(n || 0).toLocaleString(); }

  return {
    init,
    currentUser, refreshUser, logout, requireLogin, requireAdmin,
    register, login,
    approveUser, rejectUser, allUsers, pendingUsers,
    onPending, onUsers, onTx, onShop,
    transfer, mint, burn, allTx,
    listItem, buyItem, deleteItem,
    leaderboard,
    gambleResult, gambleMulti, pvpGamble,
    fmt
  };
})();
