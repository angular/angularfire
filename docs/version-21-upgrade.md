# Upgrading to AngularFire 21

AngularFire 21 targets **Angular 21** and the **Firebase JS SDK v12**. Most of the upgrade is handled for you by `ng update`.

## Run the update

```bash
ng update @angular/core @angular/cli    # move your app to Angular 21 first
ng update @angular/fire                 # then AngularFire 21
```

`ng update @angular/fire` runs a migration that:

- **Aligns your `firebase` dependency to `^12.18.0`.** AngularFire 21 requires Firebase JS SDK 12, at 12.18 or later. If your app requested an older `firebase`, whether that is 11 or an earlier 12, npm would install both that copy and the one AngularFire needs side by side, and the two copies reject each other's objects at runtime. The migration updates the dependency and reinstalls so you end up with a single copy. Verify with `npm ls firebase`.
- **Rewrites Vertex AI imports to AI Logic** (see below).

## Vertex AI is now Firebase AI Logic

The Vertex AI module has been renamed to Firebase AI Logic. The `@angular/fire/vertexai` entry point (and the older `@angular/fire/vertexai-preview`) are removed in favor of `@angular/fire/ai`:

| Before (`@angular/fire/vertexai`) | After (`@angular/fire/ai`) |
|---|---|
| `getVertexAI(app?, { location? })` | `getAI(app, { backend: new AgentPlatformBackend(location?) })` |
| `provideVertexAI` | `provideAI` |
| `VertexAI` | `AI` |
| `VertexAIError` | `AIError` |
| `VertexAIErrorCode` | `AIErrorCode` |
| `VertexAIModel` | `AIModel` |
| `VertexAIInstances` | `AIInstances` |
| `vertexAIInstance$` | `AIInstance$` |
| `VertexAIModule` | `AIModule` |

### `getVertexAI` is not a plain rename

`getAI` already existed alongside it, and a plain `getAI()` call talks to the Gemini Developer API backend, not to the Agent Platform Gemini API (formerly Vertex AI). The equivalent of `getVertexAI()` is `getAI(app, { backend: new AgentPlatformBackend() })`, which is what the migration writes, so your app keeps calling the backend it was configured, enabled, and billed for. A `location` option moves into the `AgentPlatformBackend` constructor.

### The default region changes

`getVertexAI()` with no `location` resolved to `us-central1`. `AgentPlatformBackend` with no argument resolves to `global`. Firebase suggests `global` when your model supports it, and the Gemini 3.x models are only available there, which is why the migration writes it. To keep the region you had instead, write `new AgentPlatformBackend('us-central1')`.

Review this before deploying if your project has a data residency requirement.

#### Which calls move, and what the migration tells you

- A call that passed a non-empty `location` string keeps it, so its region does not move.
- A call that passed no `location`, or an empty one, moves to `global`. `getVertexAI` treated an empty value as `us-central1`, and `AgentPlatformBackend` treats it as `global`. The migration drops the empty value rather than writing it through, and warns.
- A call whose `location` is an expression the migration cannot read gets its own warning, because only your runtime knows whether that value is empty.
- A call whose options the migration cannot rewrite at all, such as a quoted `{ 'location': ... }` key, is left as written and warned about separately. Its import still moves, so it stops compiling until you migrate it by hand.

Each of those warnings is emitted once per file, so a file that has both a moved region and an unreadable `location` produces two.

#### If your app uses the Live API, do not stay on `global`

Firebase does not support the `global` location for the Live API models, so `getLiveGenerativeModel` and `startAudioConversation` stop working there. When the migration sees either of them anywhere in your workspace it says so in the region warning. Pass `'us-central1'`, or another supported location, to `AgentPlatformBackend`.

### What the migration rewrites for you

`ng update @angular/fire` rewrites these imports and identifiers for you and logs every `getVertexAI` call it rewrites. `getGenerativeModel` keeps its name.

Imports straight from the Firebase SDK (`firebase/vertexai`, gone in SDK 12) are rewritten to `firebase/ai` under the same rules. The rewrite parses your sources with the `typescript` package (an optional peer dependency of `@angular/fire`). Every Angular workspace already has it, but if the migration warns that it could not be resolved, install `typescript` and re-run. See [ai.md](./ai.md) for current usage.

### What the migration will not rewrite

Code the migration cannot rewrite safely is left in place with a warning. The import path itself still moves to the new entry point, so the leftover code fails to compile there. Nothing changes backends silently. It plays safe like this in four situations:

- **Options it cannot read:** when the `getVertexAI` call's options are not a literal `{ location }` object, or that literal references other symbols the migration is also rewriting.
- **The function used as a value:** when `getVertexAI` is stored or passed around rather than called directly.
- **Name collisions:** when a local declaration in the file reuses an imported symbol's name, or the file already gets `getAI` or `AgentPlatformBackend` from a source other than AI Logic.
- **Wildcard re-exports:** when a file has `export * from '@angular/fire/vertexai'`, that line stays as written, because rewriting it would silently rename your re-exported public symbols. Replace it with named re-exports by hand.

A file where a named `getVertexAI` import is used in a way that cannot be rewritten keeps every use of its named `getVertexAI` imports in place (namespace-style `ns.getVertexAI(...)` calls are judged per call), and each skipped call is logged.

### Removed symbols

Two symbols were removed rather than renamed. The migration leaves their imports in place, which breaks loudly, and warns with guidance:

- `VertexAIOptions`: the new `AIOptions` takes a `backend` instead of a `location`, so rebuild the options by hand using the table above.
- `getImagenModel`: Firebase shut the Imagen models down in August 2026 and removed the API in firebase 12.18 (`@firebase/ai` 2.15), so move image generation to the Gemini image models through [`getGenerativeModel`](https://firebase.google.com/docs/ai-logic/generate-images-gemini).

## Other notes

- **Angular 21 is required.** AngularFire 21 peers `@angular/* ^21.0.0` and does not support Angular 22 (a future AngularFire 22 will).
- The obsolete `@angular/platform-browser-dynamic` peer dependency was removed. No action is needed.
