deneme

## End-to-end tests (Playwright)

Run Playwright tests locally:

```powershell
# start dev server
npm run dev

# in another terminal run tests
npx playwright test
```

CI (GitHub Actions) will run the `Playwright E2E` workflow on push and PR to `main`.

![Playwright E2E](https://github.com/eozel43/deneme/actions/workflows/playwright.yml/badge.svg)

