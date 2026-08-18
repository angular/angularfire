<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Deploying SSR to Firebase App Hosting
</small>

# Deploying a server-rendered app to Firebase App Hosting

[Firebase App Hosting](https://firebase.google.com/docs/app-hosting) is Firebase's recommended way to deploy a server-side-rendered (SSR) Angular application. It builds your app in Google Cloud Build, runs the Node server, and serves it behind Google's CDN and proxy. This applies to either way of deploying to App Hosting, a connected GitHub repository or `firebase deploy` from your own machine; both build the same way and are affected the same way.

This guide covers one thing that trips up almost every new SSR deployment: **the server can silently stop server-rendering and fall back to client-side rendering (CSR), with no error anywhere obvious.** It explains how to detect that in 30 seconds and how to fix it.

## How to deploy

If you have not deployed yet, follow Firebase's own guides: [Get started with App Hosting](https://firebase.google.com/docs/app-hosting/get-started) to connect a GitHub repository (App Hosting builds and deploys on every push), or [Alternative ways to deploy](https://firebase.google.com/docs/app-hosting/alt-deploy) to deploy with `firebase deploy` from your own machine. Both build your app the same way in Google Cloud Build. The rest of this guide covers an Angular-specific issue you can hit once your app is deployed either way.

## The symptom: SSR silently downgrades to CSR

A freshly deployed Angular SSR app usually *looks* fine in a browser, the page renders and works. But the server may be sending an almost-empty HTML shell and letting the browser do all the rendering. When that happens you lose the whole point of SSR: crawlers and link previews see no content, and first paint on slow devices is worse.

There is no error in the deploy output and no error in the browser. The only trace is in your backend's server logs, which nothing prompts you to check.

App Hosting runs on Cloud Run, not Cloud Functions, so its logs live in Cloud Logging:

- In the Firebase console, open your backend and go to its **Logs** tab, then look at **Runtime logs**.
- From a terminal, use `gcloud`:

  ```bash
  gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=YOUR_BACKEND_ID' --project YOUR_PROJECT_ID --limit 10
  ```

See Firebase's [View logs and metrics](https://firebase.google.com/docs/app-hosting/logging) guide for more.

## The 30-second check to run after every deploy

Pick an SSR route (not an SSG/prerendered one) and fetch it:

```bash
curl -s https://YOUR-SITE/ | grep ng-server-context
```

Angular's server renderer stamps a `ng-server-context` attribute on the app's root element:

- `ng-server-context="ssr"` - the route was server-rendered (SSR). This is what you want.
- `ng-server-context="ssg"` - the route was prerendered (SSG). Fine in itself, but not the SSR path this guide is about.
- **No `ng-server-context` at all** - the server returned a client-only shell and the browser is doing all the rendering. This is the silent CSR fallback described above, regardless of how the page looks in a browser.

## Why it happens

Angular's server engine only trusts the `X-Forwarded-*` headers a proxy attaches to a request when it is told to. App Hosting's proxy adds several of these headers (for example `x-forwarded-for` and `x-forwarded-proto`). If Angular does not trust the full set the platform sends, it treats the request as untrusted and de-optimizes to CSR on every request.

<!--
  Maintainer note (2026-07-19): the two-step fix below is a workaround for a lag in
  Firebase App Hosting's build image. The underlying fix (injecting the full
  X-Forwarded-* set into NG_TRUST_PROXY_HEADERS) is already merged upstream in
  GoogleCloudPlatform/buildpacks (commit 9346e60b, 2026-06-17) but had not reached
  production builders as of 2026-07-19. Once it ships, `npm update` alone suffices
  and the trustProxyHeaders step becomes optional; revisit and simplify this guide.
-->

## The Fix

Two steps are needed together.

**1. Update Angular to the latest patch:**

```bash
npm update @angular/core @angular/ssr
```

**2. Turn on proxy-header trust when you create the server engine.** In `src/server.ts`, pass `trustProxyHeaders: true` to `AngularNodeAppEngine`:

```ts
import { AngularNodeAppEngine } from '@angular/ssr/node';

const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: true,
});
```

Redeploy, then run the 30-second check above. You should now see `ng-server-context="ssr"`.

### Why both steps

The two steps address different halves of the same handshake, and neither alone is enough:

- Recent Angular patches let the `trustProxyHeaders` engine option take effect on App Hosting; on older patches a platform environment variable wins instead, so the code option is ignored. The `npm update` gets you onto a patch where the option is honored.
- Even on the latest patch, you still have to *set* the option, so App Hosting's proxy headers are trusted.

This matches Firebase's own guidance. For the current, authoritative version of this fix (including any App Hosting or Angular version notes), see Firebase's [App Hosting troubleshooting guide](https://firebase.google.com/docs/app-hosting/troubleshooting#angular-proxy-trust).

> Note: App Hosting also has an experimental, opt-in local-build deploy option (you build on your own machine, then `firebase deploy`) in which the Firebase CLI applies this proxy-header configuration for you. It is off by default and not a documented, supported workflow, so this guide targets the standard source deploy; apply the fix above.

## Related Angular documentation

- [Angular SSR guide](https://angular.dev/guide/ssr)
- [Configuring trusted proxy headers](https://angular.dev/best-practices/security#configuring-trusted-proxy-headers)
