This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build Checks Before Deploy

Run these before pushing changes:

```bash
npm run lint
npm run build
```

## Recommended Git Workflow (for this repo)

If you are making changes and want them live on Vercel:

1. Make sure your local repo is up to date.

```bash
git checkout main
git pull origin main
```

2. Create a feature branch.

```bash
git checkout -b fix/<short-description>
```

3. Make your changes, then run checks.

```bash
npm run lint
npm run build
```

4. Commit and push.

```bash
git add .
git commit -m "Describe the fix"
git push -u origin fix/<short-description>
```

5. Open a Pull Request on GitHub from your branch to `main`.
6. Merge the PR once checks pass.
7. Vercel will deploy automatically from `main` (or trigger redeploy from Vercel dashboard).

## Quick Troubleshooting

- If build fails with stale generated types, clean Next cache and rebuild:

```bash
rm -rf .next
npm run build
```

- If `/inspections` looks broken after selecting a project:
  - Use **Back to project list** or **Close** in the inspections UI.
  - Refresh the page to reset local UI state.

## GitHub PR Recovery Checklist (when you feel stuck)

If GitHub says a branch is "ahead of main" but you cannot find a specific commit hash/message, use this exact process:

1. Open the branch in GitHub and click **Commits**.
2. If the expected commit message is not there, compare by file content instead:
   - Open `app/inspections/page.tsx` in that branch.
   - Confirm the inspection photo panel only has **one** `style=` prop (`style={photoPanelStyle}`).
3. Open the PR for that branch and verify the same file in **Files changed**.
4. Merge only the PR that contains the single-style fix.
5. In Vercel, deploy the merged commit SHA from `main` (or click **Redeploy** for that commit).
6. Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`) before re-checking `/inspections`.

If Vercel still shows this error:

```
JSX elements cannot have multiple attributes with the same name
```

then the deployment is still using an older commit. Redeploy the latest merged commit from `main`.

### How to tell if a failed check is stale

When a Vercel check fails, always read the `Commit:` value near the top of the log.

- If the commit SHA in the log is **not** the latest commit on your PR branch, the failure is stale and does not represent your current code.
- If it is the latest SHA, open `app/inspections/page.tsx` in that exact commit and verify the selected photo panel has one `style=` attribute (`style={photoPanelStyle}`).

## MVP Note: Zone Photos Table

To support photo attachments per roof zone (pin), create this Supabase table once:

```sql
create table if not exists public.area_photos (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.project_areas(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists area_photos_area_id_idx on public.area_photos(area_id);
```


## MVP Note: Checklist Table

To save fillable inspection checklists per project, create this table once:

```sql
create table if not exists public.inspection_checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  checklist_data jsonb not null default '{}'::jsonb,
  overall_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inspection_checklists_project_id_idx
  on public.inspection_checklists(project_id);
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. 🚀
