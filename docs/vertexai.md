<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Vertex AI
</small>

# Vertex AI (preview)

The Vertex AI Gemini API gives you access to the latest generative AI models from Google: the Gemini models.

[Learn more](https://firebase.google.com/docs/vertex-ai)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Vertex AI instance in the application's `app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideVertexAI, getVertexAI } from '@angular/fire/vertexai-preview';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideVertexAI(() => getVertexAI()),
    ...
  ],
  ...,
}
```

Next inject `VertexAI` into your component:

```typescript
import { Component, inject } from '@angular/core';
import { VertexAI } from '@angular/fire/vertexai-preview';

@Component({ ... })
export class MyComponent {
    private vertexAI = inject(VertexAI);
    ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/vertexai-preview'` to `import { ... } from '@angular/fire/vertexai-preview'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/vertex-ai/get-started?platform=web) | [API Reference](https://firebase.google.com/docs/reference/js/vertexai-preview)
