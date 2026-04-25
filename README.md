# Tomoh

Tomoh is a monorepo with one GraphQL API and several frontend applications.

## Applications

- `server`: Express, Apollo GraphQL, Sequelize, MySQL, Socket.IO.
- `client/club`: Next.js club dashboard.
- `client/team`: Next.js team dashboard.
- `client/super-admin`: Next.js super admin dashboard.
- `client/plyer`: Next.js player-facing dashboard.
- `client/landing-page`: Next.js public landing pages.
- `client/print`: Create React App print/PDF utility.
- `client/sports-course`: Create React App sports course dashboard.

## Local Ports

Use these defaults when developing locally:

| App | URL |
| --- | --- |
| API | `http://localhost:7001/graphql` |
| print | `http://localhost:3000` |
| club | `http://localhost:3001` |
| sports-course | `http://localhost:3004` |
| super-admin | `http://localhost:3006` |
| team | `http://localhost:3008` |
| plyer | `http://localhost:3010` |
| landing-page | `http://localhost:3012` |

## Environment Setup

Copy the example environment files before running the apps:

```sh
cp server/.env.example server/.env
cp client/club/.env.example client/club/.env
cp client/team/.env.example client/team/.env
cp client/super-admin/.env.example client/super-admin/.env
cp client/plyer/.env.example client/plyer/.env
cp client/landing-page/.env.example client/landing-page/.env
cp client/print/.env.example client/print/.env
cp client/sports-course/.env.example client/sports-course/.env
```

Then update `server/.env` with local MySQL credentials. The default local API
port is `7001`, matching the frontend `.env.example` files.

## Common Commands

The root `package.json` only contains wrapper scripts. Install dependencies
inside each application directory using its existing lockfile.

Run the API:

```sh
npm run dev:server
```

Run database migrations:

```sh
npm run db:migrate
npm run db:status
```

Run a frontend:

```sh
npm run dev:club
npm run dev:team
npm run dev:super-admin
npm run dev:plyer
npm run dev:landing-page
npm run dev:print
npm run dev:sports-course
```

Run available server checks:

```sh
npm run test:server
npm run db:check-model-migrations
```

## Notes

- The project currently keeps dependencies per app rather than as a single
  workspace.
- npm is the canonical package manager. Each app keeps its own
  `package-lock.json`, and CI installs dependencies with `npm ci`.
