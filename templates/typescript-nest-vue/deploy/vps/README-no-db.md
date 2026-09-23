# VPS deployment without a database

This output contains a systemd service example for the NestJS API. Set environment values in a root-owned environment file, run `pnpm install`, and install `project-forge-api.service` for the `project-forge` system account. Serve the built frontend separately and proxy `/api/*` to `127.0.0.1:3000` when you have a frontend.

This starter has no database or persistent storage configured. The examples assume Linux with systemd and Caddy. Adapt paths and users for your host before enabling the service.
