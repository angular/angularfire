# Upgrading to AngularFire 21

AngularFire 21 targets **Angular 21** and the **Firebase JS SDK v12**. Most of the upgrade is handled for you by `ng update`.

## Run the update

```bash
ng update @angular/core @angular/cli    # move your app to Angular 21 first
ng update @angular/fire                 # then AngularFire 21
```

`ng update @angular/fire` runs a migration that:

- **Aligns your `firebase` dependency to `^12.4.0`.** AngularFire 21 requires Firebase JS SDK 12. If your app still requested `firebase` 11, npm would install both 11 and 12 side by side, and the two copies reject each other's objects at runtime. The migration updates the dependency and reinstalls so you end up with a single copy. Verify with `npm ls firebase`.
- **Rewrites Vertex AI imports to AI Logic** (see below).

## Vertex AI is now Firebase AI Logic

The Vertex AI module has been renamed to Firebase AI Logic. The `@angular/fire/vertexai` entry point (and the older `@angular/fire/vertexai-preview`) are removed in favor of `@angular/fire/ai`:

| Before (`@angular/fire/vertexai`) | After (`@angular/fire/ai`) |
|---|---|
| `getVertexAI` | `getAI` |
| `provideVertexAI` | `provideAI` |
| `VertexAI` | `AI` |
| `VertexAIInstances` | `AIInstances` |
| `vertexAIInstance$` | `AIInstance$` |
| `VertexAIModule` | `AIModule` |

`ng update @angular/fire` rewrites these imports and identifiers for you. `getGenerativeModel` and `getImagenModel` keep their names. If you import directly from the Firebase SDK, note it also renamed `firebase/vertexai` to `firebase/ai`. See [ai.md](./ai.md) for current usage.

## Other notes

- **Angular 21 is required.** AngularFire 21 peers `@angular/* ^21.0.0` and does not support Angular 22 (a future AngularFire 22 will).
- The obsolete `@angular/platform-browser-dynamic` peer dependency was removed. No action is needed.
