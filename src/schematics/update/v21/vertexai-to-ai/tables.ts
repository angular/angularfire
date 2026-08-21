// The data tables that define the Vertex AI -> AI Logic migration surface: which module
// specifiers move where, which symbols are one-to-one renames, and which names the call
// rewrite injects. Pure data, no logic.

// Both the AngularFire entry points and the firebase SDK's own entry points are rewritten: this
// migration also moves the workspace to firebase 12, where `firebase/vertexai` is gone.
export const MODULE_SPECIFIER_REWRITES: Record<string, string> = {
  '@angular/fire/vertexai': '@angular/fire/ai',
  '@angular/fire/vertexai-preview': '@angular/fire/ai',
  'firebase/vertexai': 'firebase/ai',
  'firebase/vertexai-preview': 'firebase/ai',
};

// Straight one-to-one renames. getVertexAI is deliberately absent: getAI and getVertexAI
// coexisted in the old modules and default to DIFFERENT backends (plain getAI() talks to the
// Gemini Developer API), so getVertexAI gets a backend-preserving call rewrite instead: see
// vertex-edits.ts.
export const SYMBOL_RENAMES: Record<string, string> = {
  provideVertexAI: 'provideAI',
  VertexAI: 'AI',
  VertexAIError: 'AIError',
  VertexAIErrorCode: 'AIErrorCode',
  VertexAIModel: 'AIModel',
  VertexAIInstances: 'AIInstances',
  vertexAIInstance$: 'AIInstance$',
  VertexAIModule: 'AIModule',
};

// Old exports that were removed rather than renamed: their successor is not a drop-in
// replacement, so the import keeps its name (breaking loudly) and the log explains why.
export const REMOVED_SYMBOL_GUIDANCE: Record<string, string> = {
  VertexAIOptions: 'the new AIOptions takes a backend instead of a location, rebuild the options by hand',
  getImagenModel: 'the Imagen models were shut down in August 2026 and firebase 12.18 removed the API, move image generation to the Gemini image models through getGenerativeModel',
};

export const GET_VERTEX_AI = 'getVertexAI';
export const GET_AI = 'getAI';
export const BACKEND_CLASS = 'VertexAIBackend';

// Modules whose getAI / VertexAIBackend are (or become, once rewritten) the AI Logic ones. A
// binding of those names from anywhere else must not be captured by the rewritten calls.
export const AI_MODULE_SPECIFIERS = new Set([
  ...Object.keys(MODULE_SPECIFIER_REWRITES),
  ...Object.values(MODULE_SPECIFIER_REWRITES),
]);
