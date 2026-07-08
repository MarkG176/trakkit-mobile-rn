# Syncing shared artifacts from PWA

When the PWA (`trakkit-mobile`) changes, re-copy these files into this repo:

| PWA source | RN destination |
|---|---|
| `src/integrations/supabase/types.ts` | `types/database.ts` |
| `src/data/mobileComponentsCatalog.ts` | `data/mobileComponentsCatalog.ts` |

## Copy commands (PowerShell)

```powershell
Copy-Item "..\trakkit-mobile\src\integrations\supabase\types.ts" ".\types\database.ts" -Force
Copy-Item "..\trakkit-mobile\src\data\mobileComponentsCatalog.ts" ".\data\mobileComponentsCatalog.ts" -Force
```

After copying `mobileComponentsCatalog.ts`, update `path` fields to RN route paths if the catalog structure changed.
