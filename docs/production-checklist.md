# Production Checklist

## Azure App Settings

Confirm these exist and are applied:

- `MSSQL_CONNECTION_STRING_AUR3M`
- `JWT_SECRET_AUR3M`
- `TWILIO_ACCOUNT_SID_AUR3M`
- `TWILIO_API_KEY_SID_AUR3M`
- `TWILIO_API_KEY_SECRET_AUR3M`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_SILVER`
- `STRIPE_PRICE_ID_GOLD`
- `STRIPE_PRICE_ID_PLATINUM`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (optional, defaults to `AUR3M <hello@aur3m.com>`)

After any change:

1. Click `Apply`
2. Wait for Azure to confirm the change
3. Restart the Function App

## SQL

- Keep schema changes as new numbered scripts under `database/tables`
- Do not edit old scripts after they have been applied in production
- Use new migration files for changes

## GitHub Deployment

- Deployment source: GitHub Actions
- Workflow file: `.github/workflows/main_aur3m-api-prod.yml`
- Azure Functions app path: `api`

## Recommended Next Hardening

- Add automated tests for auth and speed-round flows
- Add request validation helpers to reduce duplication
- Add rate limiting for auth endpoints
- Add application insights dashboards and alerts
- Add proper secret rotation process for JWT and Twilio keys
- Add admin-only seed/event management endpoints
