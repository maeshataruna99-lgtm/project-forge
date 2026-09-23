# GitHub repository output

GitHub output creates a **public** repository and pushes the generated starter as one initial commit. ZIP download remains available as a fallback. Private repository creation is currently unavailable because this flow requests only the `public_repo` OAuth permission.

## API setup

1. [Create a GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) and enable Device Flow in its settings.
2. Set `GITHUB_OAUTH_CLIENT_ID` in the API process environment. The client ID is not a secret; keep it on the API so the browser never needs to configure GitHub directly.
3. Restart the API. If the setting is missing, the wizard returns a safe “GitHub not configured” status and ZIP generation still works.

The browser shows GitHub's device verification code. After authorization, the API keeps the access token only in process memory and consumes it for one repository operation. The token is never returned to the browser, included in the draft, archive, or response, or written to logs or persistent storage. The GitHub OAuth App authorization itself remains active in the user's GitHub account until the user revokes it in GitHub settings. Authorization sessions expire with the device code; after an API restart, the user authorizes again.

The requested `public_repo` permission covers public repositories the authorizing user can access. See [GitHub's OAuth scope descriptions](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps). Private repository creation is unavailable.

The API accepts only the registered Project Forge configuration, a GitHub owner and project name that pass validation, public visibility, and an explicit confirmation. Repository creation and file push have distinct result states. If GitHub creates the repository but the file push fails, the wizard displays the repository link and keeps ZIP download available for recovery.

## Verification

The API tests use an injected fake GitHub provider and simulated Device Flow responses. They do not create repositories or use production GitHub credentials. Configure an OAuth App in the deployment environment before enabling the action for users.
