import firebase from 'firebase/compat/app';

// tslint:disable-next-line:no-empty-interface
export interface FirebaseApp extends firebase.app.App {}

export class FirebaseApp {
  constructor(app: firebase.app.App) {
    return app;
  }
}
