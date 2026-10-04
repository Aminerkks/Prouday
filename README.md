# Daybook 📓

> **A privacy-first, fully offline desktop productivity app for Fedora Linux, Ubuntu/Debian, and Windows.**
> Combines a rich text note editor, interactive calendar, and task lists, with notes automatically linked to calendar dates. Zero cloud calls, no accounts, and no telemetry. All data strictly stays on your local machine.

---

## 🌟 Key Updates & Highlights

- **Clean Fresh Slate**: No default or sample notes; start immediately with your own thoughts and tasks.
- **Light Mode Default & Gray Highlights**: Styled with an elegant neutral gray palette, utilizing transparent black accents in Light Mode (`bg-black/5` to `bg-black/10`) and subtle frosted glass highlights.
- **Centered Task & Trash Counters**: Quick workspace overview widget in the sidebar displaying centered live counts of your pending tasks and trash items.
- **Clean Tagless Experience**: Tags have been removed to keep note-taking minimalist, focused on dates, thoughts, and calendar schedules.
- **Expanded Settings Suite**:
  - Theme: Light Mode, Dark Mode, System
  - App Highlight Style: Neutral Gray (Transparent Black), Slate, Zinc
  - Editor Typography: Sans-Serif, Serif (Editorial), Monospace (Code)
  - Editor Font Size: Compact (14px), Standard (16px), Comfortable (18px)
  - Autosave Debounce: Fast (200ms), Balanced (400ms), Relaxed (1000ms)
  - Calendar Starting Day: Monday or Sunday
  - In-text date detection toggle
  - Database Maintenance: Clear All Notes & JSON Backup / Restore
- **Native Fedora Linux Support**: Complete configuration for packaging RPM (`.rpm`) and AppImage packages.

---

## 🏗️ Architecture & Folder Structure

```
daybook/
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx      # Month/Week switch, navigation, day panel wrapper
│   │   │   ├── MonthGrid.tsx         # Custom 7x6 month grid with event & note badges
│   │   │   ├── WeekGrid.tsx          # 7-day hourly time slot grid with resize handles
│   │   │   ├── DayDetailPanel.tsx    # Slide-over showing day's events, tasks, notes
│   │   │   └── EventModal.tsx        # Create/edit/delete events with recurrence
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          # 3-pane desktop shell with neutral gray highlights
│   │   │   ├── Sidebar.tsx           # Navigation with centered tasks & trash counters
│   │   │   └── CommandPalette.tsx    # Global Ctrl+K command and search palette
│   │   ├── notes/
│   │   │   ├── NoteEditor.tsx        # TipTap editor, date chip suggestions, custom fonts
│   │   │   ├── NotesListPane.tsx     # Color filter, sort, search, pinned notes
│   │   │   └── TipTapToolbar.tsx     # Active-state formatting toolbar
│   │   ├── settings/
│   │   │   └── SettingsModal.tsx     # Light mode, gray highlights, Fedora guide, backup
│   │   ├── tasks/
│   │   │   ├── TasksView.tsx         # Task lists, tabs (Today, Upcoming, etc.)
│   │   │   ├── TaskItem.tsx          # Checkbox, subtasks progress, due date picker
│   │   │   └── TaskListModal.tsx     # List creator & color picker
│   │   └── testing/
│   │       └── TestRunnerModal.tsx   # Built-in verification test runner UI
│   ├── context/
│   │   └── DaybookContext.tsx        # Reactive store & transactional database bindings
│   ├── db/
│   │   ├── database.ts               # Universal offline transactional SQLite engine
│   │   ├── migrations.ts             # Versioned schema migrations
│   │   ├── seeds.ts                  # Empty clean slate initialization
│   │   └── types.ts                  # TypeScript types for all models
│   ├── tests/
│   │   └── daybookUnitTests.ts       # Automated unit tests for data layer & linking
│   ├── utils/
│   │   ├── colors.ts                 # Note color presets and neutral styling
│   │   └── dateDetection.ts          # Regex date parser and recurrence calculators
│   ├── App.tsx                       # Root React entrypoint
│   ├── index.css                     # Tailwind CSS, transparent black and gray highlights
│   └── main.tsx                      # Vite React mount
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json              # Tauri 2 security permissions (FS, SQL, Shell)
│   ├── src/
│   │   └── main.rs                   # Rust Tauri 2 backend initializing SQLite plugin
│   ├── build.rs                      # Tauri build script
│   ├── Cargo.toml                    # Rust dependencies (tauri 2.0, tauri-plugin-sql)
│   └── tauri.conf.json               # Fedora (.rpm), Debian (.deb), AppImage, Windows MSI/EXE config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🐧 Fedora Linux Setup & Packaging

Daybook is fully supported on **Fedora Linux** (Workstation 38/39/40+).

### 1. Install Fedora Build Dependencies
```bash
sudo dnf install -y \
  webkit2gtk4.1-devel \
  gtk3-devel \
  openssl-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  rpm-build \
  nodejs
```

### 2. Development Mode
```bash
# Run web preview
npm run dev

# Run in native Tauri desktop window
npx @tauri-apps/cli dev
```

### 3. Packaging for Fedora (`.rpm` and `.AppImage`)
Run the Tauri build command:
```bash
npx @tauri-apps/cli build --bundles rpm,appimage
```

The resulting packages will be generated at:
- **Fedora RPM package**: `src-tauri/target/release/bundle/rpm/Daybook-1.0.0-1.x86_64.rpm`
- **Portable AppImage**: `src-tauri/target/release/bundle/appimage/daybook_1.0.0_amd64.AppImage`

Install on Fedora with:
```bash
sudo dnf install ./src-tauri/target/release/bundle/rpm/Daybook-1.0.0-1.x86_64.rpm
```

---

## 🪟 Windows & Ubuntu/Debian Packaging

### Windows (`.exe` and `.msi`)
```bash
npx @tauri-apps/cli build --bundles nsis,msi
```

### Ubuntu / Debian (`.deb`)
```bash
sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libappindicator3-dev
npx @tauri-apps/cli build --bundles deb
```

---

## 🧪 Unit Testing

Run the automated validation suite directly inside the app:
1. Click **"Run Test Suite"** in the sidebar.
2. Click **"Run All Unit Tests"** to test schema migrations, note CRUD, automatic date linking, text date detection regex, and backup export/restore roundtrip.
