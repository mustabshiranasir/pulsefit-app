# PulseFit

A female-focused fitness tracker built with React Native and Expo. PulseFit combines workout discovery, active training, nutrition logging, and progress analytics into a single mobile application — all with offline-first local persistence.

## Features

- **Workout Discovery** — Browse curated workouts across 6 categories: New, Fast HIIT, Yoga, 7-Min, Stretch, and Seasonal themes
- **Active Workout Tracking** — Real-time countdown timer with exercise auto-advance and kcal burn logging
- **Nutrition Logging** — Track meals across Breakfast, Lunch, Dinner, and Snacks with daily calorie and macro breakdown
- **Progress Analytics** — Weight history with SVG charts, auto-calculated BMI with color-coded status, and workout stats
- **AI Fitness Coach** — Keyword-aware chat assistant that reads your data to give personalized advice
- **User Profiles** — Editable avatar, personal metrics, and comprehensive app settings
- **Streak Tracking** — Consecutive day counter to maintain workout motivation
- **6 Color Themes** — Selectable accent themes with metric/imperial unit support

## Tech Stack

| Technology | Purpose |
|---|---|
| React Native 0.81 + Expo SDK 54 | Core framework |
| React Navigation 7 | Stack + bottom tab navigation |
| AsyncStorage | Offline-first local persistence |
| React Native SVG | Charts and progress rings |
| Expo Linear Gradient | UI gradients |
| Expo Image Picker | Avatar selection |
| Google Fonts (Outfit + Poppins) | Typography |

## Project Structure

```
pulsefit/
├── src/
│   ├── components/       # Reusable UI (DrawerMenu, StickyNavbar, DraggableCoach)
│   ├── context/          # AuthContext for authentication state
│   ├── hooks/            # Custom hooks (scaffolded)
│   ├── navigation/       # AppNavigator, BottomTabs
│   ├── screens/          # 10 screens (Home, Workouts, Progress, Nutrition, Coach, Profile, etc.)
│   ├── storage/          # AsyncStorage wrappers and fitnessStorage CRUD layer
│   ├── theme/            # Color palette and design tokens
│   ├── types/            # TypeScript type definitions (scaffolded)
│   └── utils/            # Utility functions (scaffolded)
├── assets/               # App icons, splash screen, coach avatar
├── App.js                # Root component with font loading and AuthProvider
└── app.json              # Expo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

```bash
# Clone the repository
git clone https://github.com/mustabshiranasir/pulsefit-app.git
cd pulsefit-app

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running

| Platform | Command |
|---|---|
| iOS | `npx expo start --ios` |
| Android | `npx expo start --android` |
| Web | `npx expo start --web` |

## Screens

| Screen | Description |
|---|---|
| **Login** | Authentication with registration, height/weight pickers, and form validation |
| **Home** | Dashboard with challenge carousel, daily picks, and categorized workout cards |
| **Workouts** | Tabbed browser with 6 workout categories and search |
| **Workout Detail** | Exercise list with metadata and start-training action |
| **Log Workout** | Active timer screen with exercise progression |
| **Progress** | Stats summary, weight chart, and BMI calculator |
| **Nutrition** | Meal tracking with calorie ring and macro breakdown |
| **Coach** | AI chat assistant with context-aware responses |
| **Profile** | User settings, personal info, theme selection, and data management |
| **Settings** | Standalone settings for timers, appearance, and body metrics |

## License

Private project. All rights reserved.
