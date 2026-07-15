# PWA → React Native transfer status

Source of truth: `../trakkit-mobile` (Lovable project `8884002d-df3c-4586-8857-781d86870c40`).

## Transferred in this pass

| PWA component | RN location | CRM |
|---------------|---------------|-----|
| Permission utils + dialog + provider | `utils/permissionUtils.ts`, `hooks/usePermissions.ts`, `components/PermissionRequestDialog.tsx`, `providers/PermissionRequestProvider.tsx` | — |
| Daily / Weekly summary cards | `components/profile/DailySummaryCard.tsx`, `WeeklySummaryCard.tsx` | CRM-0063, CRM-0064 |
| Agent profile stats hook | `hooks/useAgentProfileStats.ts` | — |
| Supabase types (incl. RPCs) | `types/database.ts` (synced from PWA) | — |
| React Query cache persistence | `lib/queryClient.ts` + `PersistQueryClientProvider` in `app/_layout.tsx` | — |
| Text wrapping | `AppText` default `flexShrink: 1` | — |
| Settings permissions UI | `app/(agent)/settings.tsx` | CRM-0101 |

## Already present (pre-pass)

Agent/supervisor pages, TopBar, QuickActions, AttendanceStatusStrip, WorkHoursCard, ComponentGate, offline queue, background location, OAuth login, most list/form screens.

## Not yet ported (confirm priority)

| PWA component | Notes |
|---------------|-------|
| `WorkspaceOnboarding` / `TourOverlay` | First-run workspace tour |
| `EveningReportDialog` / `SeedingEveningReportDialog` | Post check-out report flows |
| `StockReportDialog`, `PriceReportDialog`, instore report dialogs | Rich report UIs vs RN generic forms |
| `SaleFeedbackDialog` | CRM-0054 |
| `StoreSuccessDialog` | CRM-0055 |
| `EngagementModal` | CRM-0030 |
| `ActivityDetail` page | CRM-0092 |
| `CheckInsSheet` / `CheckInRecordCard` | Profile drill-down |
| `HelpFAQDialog` | Help content |
| `PerformanceCards` on dashboard | Intentionally removed (stats on Profile) |
| `UpcomingSchedule` | Intentionally removed |
| Supervisor hidden tabs wiring | Gallery, Rankings, Sales, Feedback, Giveaways |
| Push notifications | Requires `expo-notifications` |
| Microphone permission | Requires `expo-av` if audio features needed |

## Sync commands

See `SYNC.md` when PWA schema or catalog changes.

```powershell
Copy-Item "..\trakkit-mobile\src\integrations\supabase\types.ts" ".\types\database.ts" -Force
Copy-Item "..\trakkit-mobile\src\data\mobileComponentsCatalog.ts" ".\data\mobileComponentsCatalog.ts" -Force
```
