import type { Pipeline, PipelineSource } from 'firebase/firestore/lite/pipelines';

declare module '@firebase/firestore/lite' {
  interface Firestore {
    pipeline(): PipelineSource<Pipeline>;
  }
}

export * from './firebase';
