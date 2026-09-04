# UI Library Onboarding

## Purpose

`@dudecourse/ui` contains accessible, presentational Angular components and the Dude Course theme.
It never fetches data or imports portal, API, or database code.

The global theme is loaded from `libs/ui/src/styles/theme.scss`. Public Angular symbols are imported
from `@dudecourse/ui`.

## Commands

```sh
npx nx lint ui
npx nx test ui
npx nx build ui
```

See [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) and
[`docs/ONBOARDING.md`](../../docs/ONBOARDING.md).
