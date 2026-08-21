<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; AI Logic
</small>

# AI Logic

Firebase AI Logic gives you access to the latest generative AI models from Google: the Gemini models, including the Gemini image models.

[Learn more](https://firebase.google.com/docs/ai-logic)

> Firebase AI Logic was previously called **Vertex AI in Firebase**. If you are upgrading from AngularFire 20, the module moved from `@angular/fire/vertexai` to `@angular/fire/ai` and most symbols were renamed (`provideVertexAI` to `provideAI`, `VertexAI` to `AI`). One is not a rename: plain `getAI()` uses the Gemini Developer API backend, so the old `getVertexAI()` maps to `getAI(app, { backend: new VertexAIBackend() })`. Running `ng update @angular/fire` rewrites all of this for you and keeps your app on the Vertex AI backend. See the [AngularFire 20 to 21 upgrade guide](./version-21-upgrade.md).

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide an AI instance in the application's `app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAI, getAI } from '@angular/fire/ai';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideAI(() => getAI()),
    ...
  ],
  ...,
}
```

Next inject `AI` into your component:

```typescript
import { Component, inject } from '@angular/core';
import { AI } from '@angular/fire/ai';

@Component({ ... })
export class MyComponent {
    private ai = inject(AI);
    ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/ai'` to `import { ... } from '@angular/fire/ai'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/ai-logic/get-started?platform=web) | [API Reference](https://firebase.google.com/docs/reference/js/ai)
