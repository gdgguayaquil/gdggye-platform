# @gdggye/types

Generated Supabase types + shared domain types for the gdggye-platform monorepo.

## Regenerating `database.ts`

From the repo root, with `supabase` running locally:

```bash
npm run supabase:types
```

This runs `supabase gen types typescript --local > packages/types/src/database.ts`.

The file is checked in so type-aware code keeps compiling without a running DB. CI re-generates it and fails the build on drift (Phase 1 acceptance criterion).
