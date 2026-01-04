# Product Requirements Document (PRD) - ExamScan App

## 1. Product Overview
**App Name:** ExamScan
**Core Value:** AI-powered exam scanning, solving, and flashcard generation to help students master their subjects.
**Target Audience:** Students.

## 2. Design System & Theming
This section defines the visual language derived from the initial design mockups. All screens must adhere to these tokens.

### Colors
- **Primary Purple:** `#8A2BE2` (approximate - used for buttons, active toggles, accents)
- **Primary Gradient:** Vertical gradient from Lighter Purple/White to Primary Purple (seen on Splash).
- **Secondary Accent:** `#FFD700` (Gold/Yellow - used for "Pro Plan" badges, "Cards" icon).
- **Background:** White (`#FFFFFF`) for main screens; Light Purple/White fade (`#F8F0FF`) for Splash.
- **Text Primary:** `#1A1A1A` (Dark Grey/Black).
- **Text Secondary:** `#666666` (Medium Grey for subtitles, placeholders).

### Typography
- **Font Family:** Sans-serif (Geometric/Modern, similar to 'Inter' or 'Plus Jakarta Sans').
- **Headings:**
  - `h1`: Bold, used for "ExamScan" title and "Hello, Alex!".
  - `h2`: Semi-bold, used for section titles ("Recent Scans", "Account").
- **Body:** Regular weight, used for inputs and list items.

### Layout & Spacing
- **Container:** Standard Mobile Viewport (iPhone 15 dimensions).
- **Padding:** ~20px/24px horizontal padding standard.
- **Radius:** Rounded corners (~12px-16px) for cards, buttons, and inputs.

---

## 3. Screen Specifications

### 3.1 Splash Screen
**Goal:** Brand introduction.
**Visuals:**
- Full-screen gradient background.
- Central logo: 3D-style blue/red box/scanner icon.
- Text: "ExamScan" (Large), "Scan. Solve. Master." (Subtitle), "ExamScan AI" (Footer).

### 3.2 Onboarding / Auth (Login & Sign Up)
**Goal:** User authentication.
**Components:**
- **Header:** "ExamScan" text logo + "Welcome back" or "Join ExamScan" subtitle.
- **Forms:**
  - Inputs: Outline style with internal labels ("Email Address", "Password").
  - Buttons: Full-width Primary Purple rounded button ("Sign In", "Create Free Account").
  - Social Auth: "Continue with Google/Apple/Meta" buttons (white with border + icon).
- **Navigation:** "Don't have an account? Create Account" / "Already have an account? Log In" link at bottom.

### 3.3 Home Dashboard
**Goal:** Main hub for scanning and accessing library.
**Layout:**
- **Header:**
  - Left: "Hello, Alex!" + Wave emoji.
  - Subtitle: "Ready to scan your next exam?"
  - Right: Notification Bell icon.
- **Hero Card (Purple):**
  - "Scan Your Mock Exam Now".
  - "Scan Now" button (White pill button).
  - Illustration: 3D books/pencil.
- **Stats Row:**
  - Two cards: "Papers" (Icon + Count), "Cards" (Icon + Count).
- **Recent Scans List:**
  - Vertical list of card items.
  - Each item: Icon (Book/Subject), Title ("Biology Mock Paper"), Subtitle (Time), Arrow icon.
- **Bottom Navigation Bar:**
  - Items: Home, Library, **Scan (Floating Center Button)**, Cards, Profile.

---

## 4. Implementation Tasks (Tickets)
These tasks track the development progress.

- [ ] **Task-001: Setup Project & Design System**
  - Initialize Expo project.
  - Configure `tailwind.config.js` or stylesheet with Colors and Typography from Section 2.
  - Set up navigation (Stack + Tab).

- [ ] **Task-002: Implement Splash Screen**
  - Reference: Spec 3.1.
  - Assets: Logo icon.

- [ ] **Task-003: Implement Auth Screens**
  - Reference: Spec 3.2.
  - Components: `AuthLayout`, `Input`, `PrimaryButton`, `SocialButton`.
  - Screens: `LoginScreen`, `SignUpScreen`.

- [ ] **Task-004: Implement Home Dashboard**
  - Reference: Spec 3.3.
  - Components: `DashboardHeader`, `HeroCard`, `StatCard`, `RecentScanItem`.
  - Layout: `ScrollView` with Bottom Tab Bar.
