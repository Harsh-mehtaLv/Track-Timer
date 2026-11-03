# ⏱️ Track Timer

> **The Distraction-Free Focus & Productivity Cockpit**  
> An experimental, privacy-first interval timer and task manager built for builders, developers, students, and deep workers.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tracktime--app.vercel.app-f97316?style=for-the-badge&logo=vercel)](https://tracktime-app.vercel.app)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Live Application
**Production Website:** [https://tracktime-app.vercel.app](https://tracktime-app.vercel.app)

---

## 📖 The Story Behind Track Timer (Creator Disclosure)

**Track Timer** is an independent passion project created for fun using modern **vibe coding** workflows (human-guided AI pair programming).

### Why this project was built:
* **Tracking my coding journey:** I am currently learning coding and built this tool for myself to track my own daily learning process, study time, and focus habits.
* **The Inspiration:** During my learning journey, I came across the **[TimeArena](https://timearena.vercel.app/)** project created by a student of **[ChaiCode](https://chaicode.com/)**. I was deeply inspired and asked myself: *"Why not try vibe-coding—something I had never attempted before—and build my own custom time tracker to track my coding journey?"* And that is how Track Timer was born!
* **Visual Theme:** The warm amber, orange, and clean dark/light UI palette was inspired by **[ChaiUI by ChaiCode](https://ui.chaicode.com/)**.

### Honest Background & Bug Transparency:
* **HTML & CSS Foundation:** Before embarking on this project, my prior coding knowledge was limited strictly to **HTML and CSS**. I am not an advanced software engineer, backend architect, or cybersecurity specialist.
* **AI Pair Programming:** The entire application—including React state management, multi-device cloud synchronization, and responsive design—was vibe-coded with AI assistance.
* **Bugs & Quirks:** Because I created this as a learner exploring vibe-coding, there might be occasional bugs, visual quirks, or unexpected UI behaviors. The app is provided strictly on an **"as is"** basis for personal productivity.

### Why Authentication Uses ONLY a Username, Password & Security Question:
* Because I do not possess engineering or cybersecurity knowledge beyond HTML and CSS right now, I intentionally designed the authentication system to **never collect, store, or process sensitive personal data**.
* **Zero Sensitive Data:** We never ask for your email address, phone number, real name, social media logins, or payment details.
* **Safe Recovery:** Password recovery is handled through a private **secret security question and answer** stored with salted cryptographic hashing, so you can safely reset your password without linking an email address.
* **Total Peace of Mind:** By keeping sensitive personal information completely out of the database, your real-world identity cannot be leaked, compromised, or exposed.

---

## 🚀 Key Features

### ⏱️ 1. Distraction-Free Focus Timer
* **Dual Timer Modes:** Switch effortlessly between a freeform Stopwatch and a structured 25-minute Pomodoro timer.
* **Silent Focus by Default:** 100% distraction-free timer with zero disruptive audio tracks, background audio permissions, or loud sound alarms.
* **Background Continuation:** Timers continue ticking reliably even when switching browser tabs or navigating between pages.

### 📋 2. Task Backlog & Granular Statuses
* Organize tasks with custom categories, priority levels (*Low*, *Medium*, *High*), and optional notes.
* **Workflow Statuses:** Track your progress with granular statuses:
  * 🔴 *Urgent Basis*
  * 🟡 *Will do it later*
  * 🔵 *In Progress*
  * 🟢 *Completed*
* **1-Click Launch:** Start a focused timer session directly from any backlog task.

### 🏷️ 3. Personalized Custom Categories
* Add, edit, or delete custom categories with custom icons and color-coded badges to match your personal workflow (e.g., *Frontend*, *Backend*, *DSA*, *Reading*, *Design*).

### 📊 4. Productivity Heatmap & Weekly Analytics
* Visual 7-day bar chart showing daily focus duration vs. daily targets.
* Breakdown of time spent across different project categories.
* Daily streak milestones and consistency tracking to build habits.

### ☁️ 5. Multi-Device Cloud Synchronization
* Powered by hosted **Supabase PostgreSQL**.
* Create an account on your mobile phone and log in seamlessly on your laptop or tablet with real-time state synchronization.
* **Offline-First Resilience:** Tasks and sessions persist instantly in local browser storage (`localStorage`) and sync automatically when connected.

### 💾 6. 100% Data Ownership & CSV Export
* **Export Anytime:** Download your complete focus session history as a `.csv` spreadsheet at any time from the Session History tab.
* **Local Data Wipe:** Clear local session records or reset your profile credentials directly from the app interface with a single click.

### 📈 7. Privacy-Preserving Web Analytics
* Integrated with **Vercel Web Analytics**.
* Cookieless, privacy-friendly, GDPR/CCPA-compliant traffic metrics (pageviews, visitor countries, and devices) with zero personal profiling, zero tracking pixels, and zero advertising cookies.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | [React 18](https://react.dev/), [Vite 6](https://vitejs.dev/), JavaScript (ES Modules) |
| **Styling & Design** | [Tailwind CSS](https://tailwindcss.com/), Color Scheme inspired by [ChaiUI](https://ui.chaicode.com/) |
| **Icons & UI Extras** | [Lucide React](https://lucide.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti), [clsx](https://www.npmjs.com/package/clsx), [tailwind-merge](https://www.npmjs.com/package/tailwind-merge) |
| **Cloud Database** | [Supabase](https://supabase.com/) (PostgreSQL & Realtime REST API) |
| **Analytics & Hosting** | [Vercel](https://vercel.com/), [@vercel/analytics](https://www.npmjs.com/package/@vercel/analytics) |

---

## 💻 Getting Started (Local Development)

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18.x or 20.x recommended)
* `npm` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/track-timer.git
   cd track-timer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (you can copy `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   *(Note: The app also allows entering custom Supabase credentials directly through the app UI in the profile modal!)*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔒 Privacy Policy & Data Principles

* **No Sensitive Data:** We do not collect names, emails, phone numbers, or social media handles.
* **Zero Ad Trackers:** Zero advertising pixels, zero Meta pixels, zero third-party marketing cookies.
* **Cookieless Analytics:** Traffic telemetry is strictly aggregated and privacy-compliant via Vercel Web Analytics.
* **Complete Data Portability:** Users own 100% of their data and can export their sessions to CSV anytime.

For full legal documentation, visit the live [Privacy Policy & Terms of Use](https://tracktime-app.vercel.app) directly from the application footer.

---

## 📜 Terms of Use & Disclaimers

* **"As-Is" Software:** Track Timer is an experimental passion project built for fun and educational purposes using vibe-coding. It is provided on an **"as is" and "as available" basis** without warranties of any kind.
* **Personal Accountability:** While multi-device cloud synchronization is provided, we advise exporting CSV backups periodically if you rely on long-term time audits.

---

## ☕ Credits & Acknowledgments

* **TimeArena:** Project concept inspired by [TimeArena](https://timearena.vercel.app/) built by a student of [ChaiCode](https://chaicode.com/).
* **ChaiUI:** Design language, aesthetic, and warm amber color palette inspired by [ChaiUI by ChaiCode](https://ui.chaicode.com/).
* **Community:** Special thanks to **Hitesh Choudhary**, the ChaiCode community, and the open-source React & Vite community for making web craftsmanship exciting and accessible to everyone.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built with passion, curiosity, and vibe coding!* 🚀