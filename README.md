# AUR3M.COM Backend

Azure Functions + MSSQL backend for AUR3M.COM.

## Structure

- `api/`: Azure Functions TypeScript app
- `database/`: MSSQL schema scripts
- `docs/`: frontend integration and deployment notes

## Azure Function App

Production base URL:

`https://aur3m-api-prod-hyd2dccqf2gugjf5.ukwest-01.azurewebsites.net`

## API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/profile`
- `GET /api/members`
- `GET /api/speed-rounds/upcoming`
- `POST /api/speed-rounds/join`
- `POST /api/speed-rounds/decision`
- `GET /api/matches`
- `POST /api/payments/create-checkout`
- `POST /api/payments/webhook`
- `GET /api/payments/status`
- `POST /api/payments/cancel`
- `POST /api/twilio/token`
- `GET /api/health`
- `GET /api/db-health`

## Database Scripts

Run these against the `AUR3M` database in order:

1. `database/tables/001_users.sql`
2. `database/tables/002_user_auth_providers.sql`
3. `database/tables/003_user_likes.sql`
4. `database/tables/004_connections.sql`
5. `database/tables/005_dates.sql`
6. `database/tables/006_extend_users_for_auth_profile.sql`
7. `database/tables/007_speed_round_events.sql`
8. `database/tables/008_speed_round_participants.sql`
9. `database/tables/009_speed_round_sessions.sql`
10. `database/tables/010_speed_round_decisions.sql`
11. `database/tables/012_extend_users_for_stripe.sql`

## Required Azure App Settings

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
- `RESEND_FROM_EMAIL` (optional)

## Reference Docs

- `docs/lovable-integration.md`
- `docs/production-checklist.md`
