# TraKKiT Mobile (React Native)

Native Android-first rebuild of the TraKKiT field sales PWA, using the same Supabase backend.

## Stack

- Expo SDK 57 + Expo Router
- TypeScript + NativeWind
- Supabase (auth, database, storage, realtime)
- TanStack Query, AsyncStorage offline queue

## Setup

1. Copy `.env.example` to `.env` and set Supabase credentials
2. `npm install`
3. `npm run android`

## Architecture

- **Multi-workspace**: `WorkspaceProvider` + `workspaceService`
- **Feature gating**: CRM codes via `ComponentGate` + `useProjectComponents`
- **Role routing**: agents → `(agent)` tabs, supervisors → `(supervisor)` tabs
- **Offline writes**: `services/offlineQueue.ts` with NetInfo retry

## Pre-release checklist

- [ ] Fix Supabase RLS policies (see `docs/RLS.md`)
- [ ] Add Google Maps API key in `app.json` for supervisor map
- [ ] Register `trakkit://auth/callback` in Supabase Auth redirect URLs
- [ ] Test on physical Android device (GPS, camera, background location)

## Sync with PWA

See [SYNC.md](./SYNC.md) for keeping types and component catalog in sync.
