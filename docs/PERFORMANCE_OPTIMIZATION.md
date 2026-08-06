# Frontend Performance Optimization Guide

Use this checklist for every meaningful frontend change.

## Core Principles
- Ship less JavaScript
- Render only what users need now
- Cache aggressively where safe
- Measure before and after changes

## Implementation Checklist
- Prefer lazy loading/splitting for non-critical routes and components
- Keep large dependencies out of initial bundles
- Optimize images (modern formats, responsive sizing)
- Avoid unnecessary re-renders in high-frequency UI paths
- Use memoization only where profiling shows real benefit
- Remove dead code and unused dependencies

## Network and Caching
- Cache static assets with long max-age + immutable headers
- Avoid blocking resources in the critical rendering path
- Keep API payloads small and paginated where possible

## Vercel-Specific Recommendations
- Use preview deployments to monitor performance before merge
- Track Core Web Vitals trends after production deployment
- Keep `vercel.json` caching rules aligned with asset versioning strategy

## Validation Expectations
For features likely to affect UX speed:
- Compare before/after metrics in preview
- Document notable performance impact in pull request notes
