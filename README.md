# Dude Course

Dude Course is a portal for sharing courses hosted on YouTube. The local MVP includes public course
browsing and playback, email/password and Google authentication, enrollment, progress tracking, a
learner journey dashboard, and downloadable completion certificates.

## Documentation

- [Product requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Onboarding](docs/ONBOARDING.md)
- [Database development and deployment](docs/DATABASE.md)
- [MVP implementation baseline](docs/MVP_BASELINE.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Production readiness and deployment runbook](docs/PRODUCTION_RUNBOOK.md)
- [Architecture decisions](docs/adr/)
- [Agent working agreements](AGENTS.md)

Start with [Onboarding](docs/ONBOARDING.md). Contributors changing the schema must also follow the
[Database Guide](docs/DATABASE.md).

## Run in WSL 2

Run the project from the WSL Linux filesystem, such as `~/dudecourse`. Do not run Node, npm, or Nx
from `/mnt/c/...`: native dependencies can be installed for Windows instead of Linux, which causes
Nx binding errors.

Before continuing, enable WSL integration for your Linux distribution in Docker Desktop under
**Settings > Resources > WSL Integration**.

Install Node `20.11.0` with [nvm](https://github.com/nvm-sh/nvm), then clone the repository from a
WSL terminal:

```sh
git clone https://github.com/jaisonschmidt/dudecourse.git ~/dudecourse
cd ~/dudecourse
nvm install
nvm use
npm ci
```

Create the local environment file and initialize PostgreSQL:

```sh
cp .env.example .env
NX_DAEMON=false npm run db:up
NX_DAEMON=false npm run db:migrate:deploy
NX_DAEMON=false npm run db:generate
NX_DAEMON=false npm run db:seed
```

Start the API and portal:

```sh
NX_DAEMON=false npm run dev
```

Open the portal at `http://localhost:4200`. The API runs at `http://localhost:3000`; a `404` at its
root URL is expected because the API does not define a `/` route.

For future sessions:

```sh
cd ~/dudecourse
nvm use
NX_DAEMON=false npm run dev
```
