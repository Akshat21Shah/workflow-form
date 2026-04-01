# Workflow Configuration Form

A complex enterprise multi-step form with a custom-built state management system, validation engine, and cross-tab dependency handling. Built with **React 18 + TypeScript + Vite**.

> **Live Demo:** _🔗 Coming soon — will be updated with Vercel URL after deployment_

---

## Features

- **4-tab form**: Basic Info, Trigger Config, Actions, Review and Submit
- **Custom state store** - no Redux, Zustand, Jotai, or MobX
- **Granular subscriptions** - components re-render only when their subscribed slice changes
- **Cross-tab dependencies** - workflowType change in Tab 1 resets Tab 2; priority affects Tab 3 derived values
- **Deferred validation** - validates on tab switch and on submit, never on every keystroke
- **Error badges on tab headers** - errors on inactive tabs are always visible
- **Read-only derived value** (estimatedExecutionTime) that auto-recalculates

---

## Tech Stack

| Concern | Choice |
|---|---|
| Language | TypeScript |
| UI Framework | React 18 |
| Build Tool | Vite |
| Styling | Plain CSS |
| State Management | Custom-built (no external libraries) |

---

## Project Structure

```
src/
  store/
    types.ts              All TypeScript types and interfaces
    formStore.ts          Core store: state, immutable updates, subscriptions
  validation/
    validationEngine.ts   All validation rules (field, cross-field, cross-tab)
  hooks/
    useFormStore.ts       React hooks: useFormSlice, useFormState, useFormActions
  components/
    TabBar.tsx            Tab navigation with error badges
  tabs/
    BasicInfoTab.tsx      Tab 1
    TriggerConfigTab.tsx  Tab 2 (conditional on workflowType)
    ActionsConfigTab.tsx  Tab 3 (retry policy and derived values)
    ReviewTab.tsx         Tab 4 (summary, error aggregation, submit)
  styles/
    global.css            All app styles
  App.tsx                 Root: tab routing, validation orchestration, submit
  main.tsx                Entry point
```

---

## Setup and Installation

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Install and Run Locally

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd workflow-form

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

Output goes to `dist/`. Preview the production build locally:

```bash
npm run preview
```

---

## Deploying to Vercel

1. Push the `workflow-form` folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click **New Project**
3. Import your GitHub repository
4. Set framework preset to **Vite**
5. Leave all defaults and click **Deploy**
6. Copy your live URL and add it to the top of this README

---

## Architecture Documentation

### 1. State Shape

A single global `FormState` object is the source of truth for all 4 tabs:

```
basicInfo:     { workflowName, workflowType, priority }
triggerConfig: {
  schedule: { type, time } | null   -- present when workflowType is 'scheduled'
  event:    { source, severity } | null  -- present when workflowType is 'event-based'
}
actionsConfig: { retryPolicy: { enabled, maxRetries }, timeoutSeconds }
derived:       { estimatedExecutionTime }  -- auto-computed, never directly set
```

All updates go through `formStore.setState()` which produces a **new immutable state object** using spread operators, never mutating the previous state.

### 2. Subscription Mechanism

`formStore.subscribe(selector, callback)` registers a listener. The callback fires **only if** the selected slice reference changes (shallow equality). Structural sharing from spread-based updates ensures unchanged slices keep the same reference.

React integration (`useFormSlice`) wraps this in a `useEffect`, calling `useState` only when the slice changes - no unnecessary re-renders.

### 3. Validation Flow

Validation is **deferred** - never runs on keystrokes.

| Trigger | Behaviour |
|---|---|
| Tab switch | Runs full validation, updates error badges on all tab headers |
| Submit | Runs full validation; blocks submission if any tab has errors |

Three rule types: field-level, cross-field, and cross-tab. All tab errors are computed together in one pass.

### 4. Cross-Tab Dependency Handling

| Dependency | Mechanism |
|---|---|
| workflowType change -> Tab 2 fields | updateBasicInfo() resets triggerConfig in same setState call |
| priority change -> estimatedExecutionTime | computeDerived() runs on every setState |
| retryPolicy.enabled -> maxRetries required | Conditional validation rule |
| Circular update prevention | computeDerived returns original ref if value unchanged; setState bails if next === prev |

### 5. Performance Considerations

- Each tab subscribes only to its own state slice - no cross-tab re-renders
- Immutable updates with structural sharing keep unchanged references stable
- Derived value recomputes only when dependencies change
- Validation runs only on tab switch and submit
- `useFormActions` returns stable `useCallback` references - no child re-renders
- Selector stored in a `useRef` inside `useFormSlice` - avoids re-subscribing on every render
