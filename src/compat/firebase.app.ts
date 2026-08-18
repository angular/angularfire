import firebase from 'firebase/compat/app';

 
export interface FirebaseApp extends firebase.app.App {}

export class FirebaseApp {
  constructor(app: firebase.app.App) {
    return app;
  }
}
