# Bug Report: Undefined isDarkMode Variable

## Summary
Multiple pages in the SaaS store admin portal are using the `isDarkMode` variable without properly defining or importing it from the theme context, causing potential runtime errors.

## Affected Files

### 1. Branches Page
- **File**: `/src/app/(protected)/branches/page.tsx`
- **Issue**: Uses `isDarkMode` variable without defining it
- **Lines affected**: 213, 214, 215, 318, 326, 327, 338, 345, 352, 364
- **Example**:
  ```typescript
  blue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
  ```

### 2. Categories Page
- **File**: `/src/app/(protected)/categories/page.tsx`
- **Issue**: Uses `isDarkMode` variable without defining it
- **Lines affected**: 342, 343, 356, 363, 370
- **Example**:
  ```typescript
  ? isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
  ```

### 3. Orders Page
- **File**: `/src/app/(protected)/orders/page.tsx`
- **Issue**: Uses `isDarkMode` variable without defining it
- **Lines affected**: 401, 420, 426
- **Example**:
  ```typescript
  : isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
  ```

## Root Cause
The pages import the `useTheme` hook and access the `theme` value, but do not properly convert it to an `isDarkMode` boolean variable. The correct pattern, as used in the settings page, is to define:
```typescript
const isDarkMode = theme === 'dark';
```

## Solution
For each affected page, add the following line after accessing the theme from the context:
```typescript
const { theme } = useTheme();
const isDarkMode = theme === 'dark';
```

## Correct Usage Examples
- **Settings Page**: Correctly defines `isDarkMode` as `const isDarkMode = theme === 'dark';`
- **Users Page**: Correctly uses a state variable `const [isDarkMode, setIsDarkMode] = useState(true);`

## Severity
Medium - Could cause runtime errors if the `isDarkMode` variable is referenced before being defined.