# 666 WORLDWIDE

A membership network platform. Members register, receive a permanent member
number (`666-YYYY-XXXXXX`), and manage their profile — biography and passport
photo — from a private dashboard. Recruiting agents are stored in the
database and rendered dynamically across the public pages.

## Stack

- **Backend:** Node.js, Express, PostgreSQL (`pg`), JWT auth, bcrypt, Multer, Helmet, CORS
- **Frontend:** Static HTML5 / CSS3 / vanilla JavaScript, served directly by Express
- **Deployment:** Railway (Nixpacks build), GitHub-connected

## Folder structure

```
666-worldwide/
├── server/
│   ├── config/        # DB pool + schema/seed bootstrapping
│   ├── controllers/    # Route handler logic
│   ├── middleware/     # Auth, upload, validation, error handling
│   ├── models/         # SQL queries per table
│   ├── routes/         # Express routers
│   ├── sql/schema.sql   # Table definitions
│   ├── uploads/         # Passport photo storage (gitignored, kept via .gitkeep)
│   └── server.js         # App entry point
├── public/               # Static frontend (served by Express)
│   ├── css/style.css
│   ├── js/app.js
│   └── *.html
├── railway.json
├── package.json
├── .env.example
└── .gitignore
```

## Local development

### 1. Prerequisites

- Node.js 18+
- A running PostgreSQL instance (local install, Docker, or a cloud instance)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

At minimum, set:

- `DATABASE_URL` — a PostgreSQL connection string
- `JWT_SECRET` — a long random string (used to sign session tokens)

### 4. Run the server

```bash
npm start
```

The schema is created automatically on boot if it doesn't already exist, and
the four default agents are seeded once. Visit `http://localhost:3000`.

For auto-restart on file changes during development:

```bash
npm run dev
```

## Database setup

No manual migration step is required. On every boot, `server/config/init.js`:

1. Runs `server/sql/schema.sql` (idempotent — uses `CREATE TABLE IF NOT EXISTS`)
2. Seeds the `agents` table with the four default agents if it's empty

If you need to reset the schema, drop the `users` and `agents` tables manually
and restart the server.

## Environment variables

| Variable          | Required | Description                                      |
|--------------------|----------|---------------------------------------------------|
| `PORT`             | No       | Port to listen on (Railway sets this automatically) |
| `NODE_ENV`         | No       | `development` or `production`                     |
| `DATABASE_URL`     | Yes      | PostgreSQL connection string                       |
| `JWT_SECRET`       | Yes      | Secret used to sign JWTs                           |
| `JWT_EXPIRES_IN`   | No       | Token lifetime (default `7d`)                      |
| `MAX_UPLOAD_MB`    | No       | Max passport photo size in MB (default `5`)        |

## API reference

| Method | Path                | Auth | Description                          |
|--------|----------------------|------|---------------------------------------|
| POST   | `/api/auth/register`  | No   | Create an account, returns a JWT      |
| POST   | `/api/auth/login`     | No   | Authenticate, returns a JWT           |
| GET    | `/api/users/me`        | Yes  | Get the current member's profile      |
| PUT    | `/api/users/me`        | Yes  | Update full name / biography          |
| POST   | `/api/users/photo`     | Yes  | Upload passport photo (multipart, field name `photo`) |
| GET    | `/api/agents`           | No   | List recruiting agents                |
| GET    | `/health`               | No   | Health check + DB connectivity status |

Authenticated requests must include `Authorization: Bearer <token>`.

## GitHub deployment

```bash
git add -A
git commit -m "Initial production build of 666 WORLDWIDE"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Railway deployment

1. Create a new Railway project and connect it to this GitHub repository.
2. Add a PostgreSQL plugin to the project — Railway will inject `DATABASE_URL`
   automatically into the app service.
3. In the app service's **Variables** tab, set:
   - `JWT_SECRET` — a long random string
   - `JWT_EXPIRES_IN` (optional)
   - `MAX_UPLOAD_MB` (optional)
4. Railway reads `railway.json` and uses Nixpacks to build, then runs
   `npm start`. The health check path is `/health`.
5. Deploy. On first boot the schema is created and agents are seeded
   automatically — no manual migration step needed.

Note: Railway's filesystem is ephemeral on redeploys. Uploaded passport
photos in `server/uploads` will not survive a redeploy unless you attach a
Railway Volume mounted at that path (Project → Service → Volumes → New
Volume → mount path `/app/server/uploads`).

## Troubleshooting

**Server exits immediately on boot with a "Missing required environment
variables" error.**
`DATABASE_URL` and `JWT_SECRET` must both be set. Check your `.env` file
locally, or the Variables tab on Railway.

**`ECONNREFUSED` connecting to PostgreSQL.**
The database isn't reachable at the given `DATABASE_URL`. Locally, confirm
PostgreSQL is running and the connection string's host/port/credentials are
correct. On Railway, confirm the Postgres plugin is attached to the same
project/environment as the app service.

**Photo upload returns "Only image files... are allowed."**
The uploaded file's MIME type isn't JPEG, PNG, WEBP, or GIF. Re-export or
convert the file and try again.

**Photo upload returns 413 / "File too large."**
The file exceeds `MAX_UPLOAD_MB` (default 5MB). Compress the image or raise
the environment variable.

**Uploaded photos disappear after a Railway redeploy.**
Expected — see the Volumes note under Railway deployment above.

**Registering returns "An account with this email already exists" but you
don't recognize the email.**
Emails are stored lower-cased and are unique per account; check for a typo
or an existing account under that address.
