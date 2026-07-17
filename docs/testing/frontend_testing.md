# Frontend Testing Documentation

## Overview
Our frontend testing suite leverages **Vitest** combined with **React Testing Library** (`@testing-library/react`). This combination allows us to execute blazing-fast tests in a simulated DOM environment (`jsdom`) while focusing on user interactions rather than implementation details.

## Core Concepts

### 1. Component Testing
We test our UI components by rendering them in isolation and verifying that the correct elements are displayed based on various states and props.
- **Example Files:** `RepositoriesDashboard.test.tsx`, `PostsHub.test.tsx`, `PostEditor.test.tsx`.
- **Methodology:** We use `render()` from `@testing-library/react` and query the DOM using accessible roles (`screen.getByRole`, `screen.getByText`). We simulate user actions like clicking or typing using `@testing-library/user-event` (or `fireEvent`).

### 2. Context Providers
Many components rely on global state (e.g., `SettingsContext`, `PostsContext`).
To test these components, we wrap them in mock providers. 
```tsx
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <PostsProvider>{ui}</PostsProvider>
    </SettingsProvider>
  );
};
```

### 3. State & Firebase Mocking
Since the frontend heavily relies on Firebase Firestore for state management (`SettingsContext`), we heavily mock `firebase/firestore`.
- We mock functions like `doc`, `setDoc`, `getDoc`, and `onSnapshot` to avoid real database calls during tests.
- **Example File:** `SettingsContext.test.tsx`. We verify that toggling a UI switch correctly dispatches the mock `setDoc` function to update user preferences.

## Writing a New Frontend Test
1. **Locate the Component:** If creating `MyComponent.tsx`, create `test/components/MyComponent.test.tsx`.
2. **Setup:** Import `describe`, `it`, `expect` from `vitest`. Import `render`, `screen` from `@testing-library/react`.
3. **Mock Dependencies:** If the component fetches an API or uses an external library, use `vi.mock()` to intercept those calls.
4. **Assert:** Ensure the UI responds correctly (e.g., loading states appear, buttons are disabled during processing, error modals show up on failures).

## Troubleshooting
- **`implicitly has an 'any' type`**: Ensure `@types/react` and `@types/react-dom` are installed as dev dependencies.
- **`jest-dom` matchers not found**: Ensure `/// <reference types="@testing-library/jest-dom" />` is at the very top of your test file to provide TypeScript definitions for methods like `.toBeInTheDocument()`.
