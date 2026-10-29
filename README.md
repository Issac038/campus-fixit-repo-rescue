# Campus Fixit

Campus Fixit is a small maintenance-request tracker for campus facilities. Residents can report issues, and caretakers can review and update their status.

## Stack

- Node.js 22.9 or newer (uses Node's built-in `--env-file-if-exists`)
- Express 4.19.2 or newer
- PostgreSQL (the project does not pin a server version)
- `pg` 8.11.3 or newer
- `supertest` 7.0.0 or newer for request tests

Dependency versions are locked by `package-lock.json`.

## Setup

1. Install Node.js 22.9+ and PostgreSQL.
2. Create a local PostgreSQL database (the examples use `campus_fixit`).
3. Install the locked dependencies:

   ```sh
   npm ci
   ```

4. Create your local settings file and replace every placeholder with a local value:

   ```sh
   cp .env.example .env
   ```

   `DATABASE_URL`, `JWT_SECRET`, and `CARETAKER_PASSWORD` are required. `PORT` is optional and defaults to `3000`; remove its placeholder line to use that default, or replace it with a port number. `SMS_API_KEY` is currently unused and may be left as a placeholder.
5. Start the application once to create the `requests` table, then load the sample data:

   ```sh
   npm start
   ```

   In another terminal, run:

   ```sh
   psql "$DATABASE_URL" -f db/seed.sql
   ```

   Stop and restart the application if needed. The seed inserts four sample requests; avoid applying it repeatedly because it does not clear or deduplicate rows.

## Run and test

Start the API with `npm start`. The server listens on the configured `PORT` (default `3000`); `GET /health` checks database connectivity.

Run the four request/validation tests with:

```sh
npm test
```

Tests need the three required settings, but do not require a live database. If any required setting is missing, the process reports the missing setting names without printing values.

## API overview

- `GET /health`
- `GET /requests` and `GET /requests/:id`
- `POST /requests`
- `POST /staff/login`
- `PATCH /requests/:id/status`
- `GET /summary`

## Project board

Track work in the [GitHub issue board](https://github.com/Issac038/campus-fixit-repo-rescue/issues). A separate GitHub Projects board is not configured.

## Known limits

- Caretaker login and the custom token signing are demonstration-only, not production authentication.
- There is no SMS integration, frontend, or production deployment configuration.
- PostgreSQL must be installed and reachable for the server and health endpoint; the automated tests only cover validation and a bad-request path.
