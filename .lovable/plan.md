## Fix edit-not-refreshing + confirm sort

### Problem
`useShifts()` stores `shifts` in local `useState`, so every component that calls it gets its **own copy**. When `EditShift` calls `updateShift`, only its local copy updates; `ShiftsList`, `WeeklySummary`, `DailyCoverage` keep showing stale data until a full page reload. Same issue affects add/delete from other pages.

### Fix: share shifts state via a Context provider

1. **New file `src/hooks/ShiftsContext.tsx`**
   - Move the entire body of the existing `useShifts` hook into a `ShiftsProvider` component that holds the single source of truth (`shifts`, `isLoading`, all the CRUD callbacks, helpers).
   - Export a `useShifts()` hook that just reads the context and throws if used outside the provider.
   - Public API stays identical, so no consumer changes needed.

2. **`src/App.tsx`**
   - Wrap the authenticated routes tree with `<ShiftsProvider>` (inside `<ProtectedRoute>` scope so it only mounts for logged-in users).

3. **`src/hooks/useShifts.ts`**
   - Replace contents with a thin re-export of `useShifts` from `ShiftsContext` to keep all existing imports (`@/hooks/useShifts`) working.

4. **`src/pages/EditShift.tsx`** (~line 85)
   - `await updateShift(id, formData)` before `navigate('/')`, so the shared state is committed before the list re-renders.

### Sort verification
`ShiftsList.tsx` lines 61–65 already sort by `date` desc then `startTime` desc — keep as is. Once the shared-state fix lands, the edited row will appear in the correct sorted position automatically.

### Out of scope
No DB, no calculations, no WeeklySummary table changes (it has no status column), no UI/visual changes.

### Files
- create `src/hooks/ShiftsContext.tsx`
- edit `src/hooks/useShifts.ts` (re-export)
- edit `src/App.tsx` (wrap with provider)
- edit `src/pages/EditShift.tsx` (await + navigate)