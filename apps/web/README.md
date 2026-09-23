# Project Forge web app

Install the workspace dependencies from the repository root with `pnpm install`. Start the API and web app in separate terminals:

```sh
pnpm --filter @project-forge/api dev
pnpm --filter @project-forge/web dev
```

Open the URL printed by Vite. The local web server proxies `/generator` and `/health` to the API at `http://localhost:3000`.

In production, serve the web app and API under the same origin. Configure the reverse proxy to route `/generator/*` and `/health` to the API, and serve the built web assets for other paths. The browser uses relative API URLs, so these routes must be available on the web app's origin.
