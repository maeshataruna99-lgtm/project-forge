# VPS deployment

This output contains a systemd service example for the NestJS API and a Caddy reverse-proxy example. Provision PostgreSQL separately, set environment values in a root-owned environment file, run `pnpm install`, `pnpm db:generate`, and `pnpm db:migrate`, then install `project-forge-api.service` for the `project-forge` system account. If this project has a frontend, serve its built files separately and proxy `/api/*` to `127.0.0.1:3000`.

The examples assume Linux with systemd and Caddy. Adapt paths and users for your host before enabling the service.
