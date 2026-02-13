# Apex StudyOS 🚀

<div align="center">

![Apex Icon](resources/icon.ico)

# 🎓 Apex StudyOS

### _Your Complete Study Companion for CMA/CA Exam Preparation_

**A premium desktop application designed to supercharge your learning journey**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.3.0-success.svg?style=flat-square)](package.json)
[![Downloads](https://img.shields.io/github/downloads/Tamil-Venthan/Apex-StudyOS/total?style=flat-square&color=brightgreen)](https://github.com/Tamil-Venthan/Apex-StudyOS/releases)
[![Electron](https://img.shields.io/badge/Electron-39.x-47848F.svg?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[🎁 Download](#-download) • [✨ Features](#-key-features) • [🚀 Get Started](#-getting-started) • [🤝 Contribute](#-contributing) • [📄 License](#-license)

</div>

---

## 📖 About

Apex StudyOS is a premium, all-in-one productivity and study tracking application built for serious learners. It combines advanced task management, detailed analytics, and immersive focus tools into a beautiful, modern desktop experience.

Whether you're preparing for CMA, CA, or any other exam, Apex StudyOS helps you stay organized, focused, and motivated throughout your study journey.

## 🎁 Download

<div align="center">

### 📥 Get Apex StudyOS - Ready to Use!

**Pre-built executable is available for Windows!**

[![Download Latest Release](https://img.shields.io/badge/Download-Latest%20Release-brightgreen?style=for-the-badge&logo=github)](https://github.com/Tamil-Venthan/Apex-StudyOS/releases/latest)

|    Platform    |                                    Download                                    |      Installation       |
| :------------: | :----------------------------------------------------------------------------: | :---------------------: |
| 🪟 **Windows** | [Download .exe](https://github.com/Tamil-Venthan/Apex-StudyOS/releases/latest) | Double-click to install |

**No compilation needed!** Just download and run. 🚀

</div>

## 🌟 Why Choose Apex StudyOS?

<table>
<tr>
<td width="33%" align="center">
<h3>🎯 Stay Focused</h3>
<p>Advanced Pomodoro timer with immersive fullscreen mode keeps distractions away</p>
</td>
<td width="33%" align="center">
<h3>📈 Track Progress</h3>
<p>Beautiful visualizations show exactly where you stand in your preparation</p>
</td>
<td width="33%" align="center">
<h3>🔒 Privacy First</h3>
<p>100% offline - your data never leaves your computer</p>
</td>
</tr>
<tr>
<td width="33%" align="center">
<h3>⚡ Lightning Fast</h3>
<p>Native desktop app built for speed and performance</p>
</td>
<td width="33%" align="center">
<h3>🎨 Beautiful UI</h3>
<p>Modern glassmorphism design with smooth animations</p>
</td>
<td width="33%" align="center">
<h3>🆓 Free & Open</h3>
<p>Completely free to use, forever. Apache 2.0 licensed</p>
</td>
</tr>
</table>

## ✨ Key Features

**Transform your study routine with these powerful tools:**

### 🎯 Focus Mode

- **Advanced Pomodoro Timer**: Customizable work and break durations
- **Immersive Fullscreen Mode**: Distraction-free studying
- **Audio Notifications**: Customizable sounds for session transitions
- **Session Tracking**: Monitor your daily focus time

### 📚 Subject Tracking

- **Hierarchical Organization**: Subjects → Modules → Topics
- **Video Progress Tracking**: Track watched duration for video courses
- **Resource Management**: Attach and manage study materials
- **Progress Visualization**: Beautiful circular progress indicators

### 📊 Analytics Dashboard

- **Daily Statistics**: Track your study time and completion rates
- **Weekly Breakdown**: Visualize your study patterns over time
- **Subject-wise Analytics**: Identify strengths and areas for improvement
- **Interactive Charts**: Powered by Recharts for beautiful data visualization

### ⚡ Smart Workflow

- **Keyboard Shortcuts**: Navigate and control without touching the mouse
- **Quick Notes**: Rich text editor powered by TipTap
- **Important Flags**: Mark and filter critical topics
- **PDF Export**: Generate study reports and summaries

### 🎨 Modern UI/UX

- **Glassmorphism Design**: Premium, modern aesthetic
- **Smooth Animations**: Powered by Framer Motion
- **Dark Mode**: Easy on the eyes during long study sessions
- **Responsive Layout**: Collapsible sidebar for maximum screen space

### 💾 Local First

- **Privacy Focused**: All data stays on your machine
- **SQLite Database**: Fast, reliable local storage
- **Prisma ORM**: Type-safe database operations
- **No Internet Required**: Work completely offline

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript 5, Tailwind CSS 3, Framer Motion 12
- **Backend**: Electron 39, Node.js
- **Database**: SQLite, Prisma ORM 5
- **UI Components**: Custom components with Shadcn/UI patterns
- **Build Tool**: Electron-Vite, Vite 7
- **State Management**: Zustand 5
- **Rich Text**: TipTap 3

## 🚀 Getting Started

### 🎯 For Users - Quick Start

**Just want to use Apex StudyOS?** Head over to the [**Releases**](https://github.com/Tamil-Venthan/Apex-StudyOS/releases/latest) page and download the installer for your platform. No setup required!

---

### 🛠️ For Developers - Build from Source

Want to contribute or customize? Follow these steps:

#### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download](https://git-scm.com/)

#### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Tamil-Venthan/Apex-StudyOS.git
   cd Apex-StudyOS
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npx prisma migrate dev
   ```

### 🎮 Usage

#### Running Locally

Start the development server:

```bash
npm run dev
```

The application will launch automatically in development mode with hot reload enabled.

#### Building for Production

Create a native executable for your operating system:

**Windows:**

```bash
npm run build:win
```

Output: `dist/Apex StudyOS Setup 1.3.0.exe`

## ⌨️ Keyboard Shortcuts

### Focus Mode

| Key     | Action               |
| :------ | :------------------- |
| `Space` | Start/Pause Timer    |
| `R`     | Reset Timer          |
| `S`     | Skip Current Session |
| `F`     | Toggle Fullscreen    |
| `M`     | Toggle Mute          |

### Global

| Key            | Action               |
| :------------- | :------------------- |
| `Ctrl/Cmd + S` | Save Current Changes |
| `Ctrl/Cmd + N` | Create New Subject   |
| `Ctrl/Cmd + ,` | Open Settings        |

## 📂 Project Structure

```
Apex-StudyOS/
├── .github/                 # GitHub templates and workflows
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   └── pull_request_template.md
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts
│   │   └── ipc-handlers.ts # IPC communication
│   ├── preload/            # Electron preload scripts
│   │   └── index.ts
│   └── renderer/           # React frontend
│       ├── src/
│       │   ├── components/ # Reusable UI components
│       │   ├── pages/      # Page components
│       │   ├── stores/     # Zustand state management
│       │   └── utils/      # Utility functions
│       ├── index.html
│       └── index.css       # Global styles
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── dev.db             # SQLite database
├── resources/              # App resources (icons, etc.)
├── build/                  # Build configuration
├── LICENSE                 # Apache 2.0 License
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md        # Contribution guidelines
├── SECURITY.md            # Security policy
└── package.json
```

## 🤝 Contributing

Contributions are welcome! We love to receive contributions from the community and appreciate your help in making Apex StudyOS better.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add: AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on our code of conduct and the process for submitting pull requests.

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please check our [issue tracker](https://github.com/Tamil-Venthan/Apex-StudyOS/issues) first to avoid duplicates.

- **Bug Report**: Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature Request**: Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

```
Copyright 2026 Tamil Venthan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Database management with [Prisma](https://www.prisma.io/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Icons from [Lucide React](https://lucide.dev/)

## 📧 Contact

**Tamil Venthan** - Project Maintainer

- GitHub: [@Tamil-Venthan](https://github.com/Tamil-Venthan)
- Project Link: [https://github.com/Tamil-Venthan/Apex-StudyOS](https://github.com/Tamil-Venthan/Apex-StudyOS)

## ✨ What's New in v1.3.0 (Quick Wins Update)

- 📋 **Session History Page** — Full-page table of all study sessions with search, filter by subject/date, sort, and delete. Access from the new sidebar link.
- 🔔 **Toast Notification System** — Beautiful animated notifications (success/error/info) for all user actions. Auto-dismiss with smooth slide-in animations.
- 🖥️ **System Tray Quick-Add** — App minimizes to system tray on close. Right-click the tray icon to quickly log 15m, 30m, or 1h focus sessions without opening the app.
- 🔥 **Enhanced Streak Counter** — Dashboard streak card now shows best streak record, motivational messages based on streak length, and a 7-day activity dot grid.
- ⏳ **Subject Countdown Badges** — Subjects with target dates now show color-coded countdown badges (red ≤7 days, amber ≤30 days, blue otherwise) on the Dashboard.
- 📅 **Manual Focus Entry with Date Picker** — Log focus sessions for past dates, not just today.

## ✨ What's New in v1.2.0 (AI Supercharge Update)

- 🤖 **AI Personalization** - The AI Coach now knows your name, active exams, and due dates for tailored advice.
- ⚡ **Response Length Controls** - Toggle between "Short Answer" for quick concepts or "Long Answer" for deep dives.
- 🌍 **OpenRouter Integration** - Connect to 100+ AI models (Llama 3, DeepSeek, Mistral, etc.) for free or paid access.
- 🎨 **Enhanced UI** - Cleaner typography, beautiful lists, and "Glassmorphism" styling for a premium feel.
- 📝 **Improved Markdown** - Better rendering for tables, quotes, and code blocks in AI responses.

## ✨ What's New in v1.1.0

- ✅ **Video Progress Tracking** - Track watched duration for video courses
- ✅ **Important Flags** - Mark and filter critical topics
- ✅ **PDF Export** - Generate study reports and summaries
- ✅ **Enhanced Analytics** - More detailed insights into your study patterns
- ✅ **Collapsible Sidebar** - Maximize your screen space
- ✅ **Improved Performance** - Faster loading and smoother animations

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## 🌟 Show Your Support

If you find Apex StudyOS useful, please:

- ⭐ **Star this repository** on GitHub
- 🐛 [**Report bugs**](https://github.com/Tamil-Venthan/Apex-StudyOS/issues) to help us improve
- 💡 [**Suggest features**](https://github.com/Tamil-Venthan/Apex-StudyOS/issues) you'd like to see
- 🤝 **Share** with fellow students who might benefit

---

<div align="center">

**Made with ❤️ for students everywhere**

</div>
