# Vercel Deployment Setup

This repository includes `vercel.json` to standardize deployment behavior.

## Deployment Model
- **Preview deployments**: created automatically for pull requests
- **Production deployments**: created from merges to the production branch configured in Vercel

## Initial Setup Steps
1. In Vercel, import the GitHub repository: `UG-Syntax-Syndicate/FlowVantage-Frontend`.
2. Configure:
   - Framework preset matching the frontend stack
   - Install command, build command, and output directory from the project settings
3. Add required environment variables in:
   - Vercel Project Settings → Environment Variables
4. Assign environment variable scopes:
   - Preview: safe test values
   - Production: production values only

## Team Operating Rules
- Do not commit secrets to the repository.
- Keep preview environments representative of production behavior.
- Verify successful preview deployments before merging pull requests.

## Configured Behavior (`vercel.json`)
- `cleanUrls`: cleaner URL output
- `trailingSlash`: disabled to avoid duplicate URL forms
- Long-lived immutable cache headers for static assets

## Verification
- Open a pull request and confirm preview deployment succeeds.
- Merge and confirm production deployment succeeds.
