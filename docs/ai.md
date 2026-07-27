<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; AI Logic
</small>

# AI Logic

Firebase AI Logic gives you access to the latest generative AI models from Google: the Gemini models and Imagen models.

[Learn more](https://firebase.google.com/docs/ai-logic)

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
