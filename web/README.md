# AUR3M Web

Lovable-exported React/Vite frontend for AUR3M.COM, now kept in-house under the main repo.

## Local development

```bash
npm install
npm run dev
```

The app reads `VITE_API_BASE_URL` from `.env.local`. Copy `.env.example` to `.env.local` when you need to override the API base URL.

## Production build

```bash
npm run build
```

The built site is emitted to `dist/`.
