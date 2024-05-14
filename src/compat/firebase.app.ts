import firebase from 'firebase/compat/app';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FirebaseApp extends firebase.app.App {}

export class FirebaseApp {
  constructor(app: firebase.app.App) {
    return app;
  }
}
