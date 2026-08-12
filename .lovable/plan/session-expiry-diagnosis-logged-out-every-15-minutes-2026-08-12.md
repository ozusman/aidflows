# Session Expiry Diagnosis — "logged out every ~15 minutes"

Investigation only. No code, config, or backend changes were made.

## 1. Is there an inactivity timer / auto sign-out in the frontend?

**Confirmed: no.** A repo-wide search for `setTimeout`, `setInterval`, `idle`, `inactiv`, `signOut`, `visibilitychange` found only:

- `src/hooks/use-toast.ts:53-60` — toast dismissal timers (unrelated).
- `src/pages/ResetPassword.tsx:71` — 300ms delay while parsing a recovery link; `:123` — 1500ms delay then `navigate('/')`.
- `src/hooks/useAuth.tsx:64-66` — `signOut()` is exported but only called from `src/components/layout/Header.tsx:26` and `:133`, both wired to explicit user-clicked Sign Out controls.

There is no timer-based logout, no session clearing, and no periodic redirect anywhere in the app.

## 2. Supabase client initialization

`src/integrations/supabase/client.ts:11-17` (auto-generated, must not be edited):

```ts
createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
})
```

**Confirmed:** persistence and auto-refresh are both on, storage is `localStorage`. The module is a single exported singleton — every consumer imports the same instance, so no duplicate `GoTrueClient` in the browser.

Other `createClient` calls are server-side only and cannot affect the browser session:
- `src/lib/mcp/supabase.ts:66` — `persistSession: false, autoRefreshToken: false`, bearer-token scoped.
- `supabase/functions/mcp/index.ts:59` — edge function, same pattern.

Auth state handling, `src/hooks/useAuth.tsx:22-40`: listener registered before `getSession()` (correct order); the callback does `setUser(session?.user ?? null)` for **every** event. This means any event delivering a null session — `SIGNED_OUT`, including the synthetic `SIGNED_OUT` GoTrue emits when a **refresh token is rejected** — immediately drops the user to null.

## 3. Can route guards redirect while a valid session exists?

`src/components/ProtectedRoute.tsx:21-23` renders `<Navigate to="/auth" replace />` whenever `user` is falsy. It reads `user` only from the auth context, so it never fabricates a logout on its own — but it will redirect the instant the listener in §2 nulls the user.

**Confirmed: data-layer errors do not cause redirects.** `ShiftsContext.tsx`, `useShifts.ts`, `useCaregivers.ts`, `usePaymentReceipts.ts` only log errors (`logger.error`) and return them; none call `signOut()` or navigate on a 401/403.

`src/pages/Auth.tsx:46-50` bounces back to `nextPath` once a user exists, so a spurious logout would be visible as a full round trip to the sign-in screen.

## 4. Could refresh failure / storage loss / timing explain ~15 minutes?

Hypotheses, in order of plausibility. None is confirmed yet — the decisive evidence is external (see §5/§6).

- **H1 — JWT expiry is set to ~900s and refresh is failing.** With `autoRefreshToken: true`, GoTrue refreshes ~30s before expiry; if the refresh call fails (rejected/rotated/reused refresh token, or offline at that moment), it emits a null-session event and §2 + §3 log the user out instantly, with no retry and no user-facing error. A 15-minute cadence matches a 900s access-token lifetime almost exactly. This is the single best fit for the reported timing.
- **H2 — Refresh-token reuse across tabs/devices.** Two tabs (or preview URL + published URL, which are different origins with separate `localStorage`) racing a rotation can invalidate the token for one of them.
- **H3 — `localStorage` eviction.** Safari ITP (7-day cap), private browsing, or "clear site data on close" would break persistence — but that produces logout on reload, not on a 15-minute clock. Weak fit.
- **H4 — Duplicate client instances.** Ruled out for the browser bundle (§2).
- **H5 — Transient network failure at refresh time.** Same end state as H1; only distinguishable from network logs.

Notable: `supabase auth_logs` returned **zero rows** for the query window, so there is currently no server-side record of refresh/token events to confirm or refute H1 from logs alone.

## 5. Settings that live outside this repo

`supabase/config.toml` contains only `project_id` — nothing auth-related is version-controlled here. The following are backend-side and are what actually control the timing:

- **JWT / access-token expiry** (the ~15 min suspect; default is 3600s)
- **Refresh token rotation** on/off and **reuse interval**
- **Time-box / inactivity session timeout** (if set, sessions die on a fixed clock regardless of activity)
- **Single-session-per-user** enforcement
- Site URL / redirect allow list — verified healthy: Site URL `https://aidflows.lovable.app`, allow list covers preview + published origins.

## 6. Can I read those values directly?

**Partly.** The tooling available to me can *write* auth configuration but has no read endpoint for JWT expiry, rotation, or session-timeout values, so I cannot report their current numbers. What I could read: project info (active, not paused, managed by Lovable) and the OAuth/redirect configuration above.

Because this project is on Lovable Cloud, there is no Supabase dashboard for you to open either. To get the values, the practical path is to have me read them from a live session rather than from a settings page — see the checklist.

## Most likely responsible component

**Backend access-token lifetime combined with a refresh that fails silently**, surfaced by `src/hooks/useAuth.tsx:24-30` treating any null-session event as a logout and `src/components/ProtectedRoute.tsx:21-23` redirecting immediately. The frontend contains no mechanism that could produce a 15-minute logout on its own, so the interval must come from token lifetime.

## Prioritized diagnostic checklist

1. **Measure the actual token lifetime.** In the browser console on the live app, read the `sb-*-auth-token` entry in `localStorage`, decode the `access_token` payload, and compute `exp - iat`. 900 confirms H1; 3600 rules it out and shifts suspicion to a session time-box.
2. **Watch the refresh attempt.** Keep DevTools open across the logout boundary; filter Network for `/auth/v1/token?grant_type=refresh_token`. A 400/401 with `refresh_token_not_found` or `invalid grant` confirms rotation/reuse (H1/H2); no request at all points to a server-side session revocation.
3. **Log the auth events.** Temporarily observe `onAuthStateChange` output — whether the event preceding the redirect is `SIGNED_OUT`, `TOKEN_REFRESHED`, or `USER_UPDATED` distinguishes a rejected refresh from a revoked session.
4. **Rule out multi-origin/multi-tab.** Reproduce in a single tab on the published URL only, no preview tab open (H2).
5. **Reproduce in a clean profile** (no extensions, standard non-private window) to exclude storage eviction (H3).
6. **Then, and only then**, adjust the backend value the evidence implicates — access-token expiry, rotation, or session timeout — and separately harden `useAuth.tsx` so a failed refresh retries instead of instantly nulling the user.

Say the word and I can turn steps 1-3 into a short instrumented run and report the values back, or move straight to a fix plan once you have the numbers.
