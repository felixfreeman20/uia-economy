# VOX Economy 💎

A fully-featured friend-group economy with a currency, marketplace, gambling, and leaderboard.

## Features
- 🔐 User registration with admin approval
- 💸 Send Vox between users
- 🛍 Marketplace — list real items, services, food, anything
- 🎰 Casino — Solo coinflip, PvP coinflip, Slots, Card War vs friends
- 🏆 Leaderboard / Rich List
- ⚙️ Admin panel — approve users, mint/burn Vox, manage shop

## Zero backend — runs on localStorage
All data is stored in the browser. This means:
- **Free to host** on GitHub Pages
- **No server** required
- Data is per-browser (everyone uses the same deployed URL but their data is local)

> ⚠️ For a shared economy across devices, you'd need a backend. For now, this works great as a demo or single-device admin system.

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `vox-economy`)
2. Upload all files maintaining this structure:
   ```
   index.html
   css/style.css
   js/core.js
   js/nav.js
   pages/dashboard.html
   pages/send.html
   pages/shop.html
   pages/gamble.html
   pages/leaderboard.html
   pages/admin.html
   ```
3. Go to **Settings → Pages → Source: Deploy from branch → main → / (root)**
4. Your site will be live at `https://yourusername.github.io/vox-economy/`

## Admin Login
- Username: `admin`
- Password: `voxmaster`

**Change the password** by editing `js/core.js` — find `"voxmaster"` in the `seed()` and `ADMIN_SECRET` lines.

## Customizing

### Change starting Vox
In `js/core.js`, find `approveUser()` and change `balance: 100`.

### Change the currency name
Search and replace `VOX` / `Vox` / `vox` across all files.

### Slots payouts
In `gamble.html`, find `JACKPOTS` and adjust multipliers.

## Structure
```
vox/
├── index.html          ← Login / Register
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── core.js         ← All data logic (auth, transactions, shop, gambling)
│   └── nav.js          ← Nav bar generator
└── pages/
    ├── dashboard.html  ← Balance + recent tx
    ├── send.html       ← Transfer Vox
    ├── shop.html       ← Marketplace
    ├── gamble.html     ← Casino games
    ├── leaderboard.html← Rich list
    └── admin.html      ← Admin panel
```
