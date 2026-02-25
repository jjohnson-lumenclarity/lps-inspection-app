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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details. 🚀
