# 🎧 Spotinize - Web Frontend

The official modern web client for **Spotinize** — the ultimate music guessing game inspired by Heardle, SongPop, and Wordle with Spotify design aesthetics.

---

## 🌟 Key Features

- **Progressive Reveal Player**: Progressive audio clues from `0.1s → 0.5s → 1.0s → 2.0s → 3.0s → 4.0s → 5.0s`.
- **Zero-Latency Audio Preloading**: Pre-buffers multi-tier reveal clips into browser cache for instant playback.
- **Thinking Time Scoring**: Dynamic countdown scoring with live millisecond precision.
- **Spotify Catalog Autocomplete**: Search across millions of Spotify songs with instant debounced queries and album art preview.
- **Real-Time Multiplayer**: Room lobby with 6-character room codes (`ROOMCODE`), host controls, player ready states, and live rankings via Socket.IO.
- **Instagram Story Share**: Export clean 9:16 story cards featuring custom scores, avatar, and rankings.
- **Mobile Responsive Design**: Glassmorphic bottom navigation bar, fluid touch targets, and mobile-first layouts.
- **Resilient Multi-Tier Avatars**: Seamless fallbacks (Spotify profile picture → DiceBear Bottts SVG → custom vector avatars).

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS (Custom Design System, HSL Tokens, Spotify Dark Theme)
- **Icons**: Lucide React
- **Real-Time**: Socket.IO Client
- **Image Generation**: HTML-to-Image / Canvas API
- **HTTP Client**: Axios

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or yarn

### 2. Installation
```bash
# Clone or navigate to the web directory
cd /root/app/spotinize/web

# Install dependencies
npm install
```

### 3. Development Server
```bash
npm run dev
```
The app will run locally at `http://localhost:5173`.

### 4. Production Build
```bash
npm run build
```
Build outputs are generated in `dist/` ready to be served by Nginx or any static file server.

---

## 📁 Directory Structure

```text
src/
├── components/          # Reusable UI components (Navbar, Avatar, Card, Button, Modals)
├── hooks/               # Custom hooks (useAuth, useGame)
├── pages/
│   ├── Landing/         # Welcome & Login / Guest entry
│   ├── Dashboard/       # Game mode & category selector, Global Leaderboard
│   ├── RoomLobby/       # Multiplayer room lobby & player management
│   ├── Game/            # Main gameplay canvas, timer, progressive player
│   ├── Profile/         # User statistics & match history
│   ├── Friends/         # Real player search & duel invitations
│   └── Result/          # Final round results & scoreboard
├── services/            # API client (Axios) & Socket.IO client
└── styles/              # Design system tokens, variables, & responsive components
```

---

## 📜 License
MIT License.
