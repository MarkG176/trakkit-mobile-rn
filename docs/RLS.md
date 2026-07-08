# Supabase RLS — Pre-release requirement

The shared Supabase project (`skafzkzjaszxgqryzhjp`) has RLS disabled on many tables. **Do not ship to app stores until RLS is audited and enabled.**

## Development

Development can proceed with test accounts against the existing backend. The anon key only permits operations allowed by current policies.

## Before production

1. Run Supabase security advisors (`get_advisors` MCP tool or Dashboard → Database → Advisors)
2. Enable RLS on all tables exposed to the mobile client
3. Add policies scoped to `auth.uid()` and workspace membership
4. Verify agent accounts cannot read other workspaces' data
5. Verify supervisor accounts can only access their assigned workspaces

## iOS release prep

After RLS is fixed:

1. Add iOS bundle config in `app.json`
2. Test background location permission flow on iOS (differs from Android)
3. Configure EAS Build profiles for App Store / Play Store
