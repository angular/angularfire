import { FirebaseApp as IFirebaseApp, getApps } from 'firebase/app';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// Need to turn the FirebaseApp interface exported by firebase/app into a class
// as types don't work in Angular DI. We want developers to be able to inject FirebaseApp like so
//   constructor(app: FirebaseApp)
// the cleanest way to achieve this that I found is to export a new interface and class
// the interface just extends the interface you want to turn into the class. This informs tyepscript
// that the class has all the same methods/properties as the interface you want to extend without
// breaking if Firebase adds/removes APIs in future releases. This was a big problem for @angular/fire
// back when we constructed our own class. Then in the "new class" we just return the FirebaseApp in the
// constructor, this also has the added benefit of Firebase methods taking our DI class without
// casting. E.g,
//   constructor(private app: FirebaseApp) { }
//   ngOnDestroy() { deleteApp(this.app); }
//
// tslint:disable-next-line:no-empty-interface
export interface FirebaseApp extends IFirebaseApp {}

export class FirebaseApp {
  constructor(app: IFirebaseApp) {
    return app;
  }
}

export interface FirebaseApps extends Array<IFirebaseApp> {}

export class FirebaseApps {
  constructor() {
    return getApps();
  }
}

export const firebaseApp$ = timer(0, 300).pipe(
  concatMap(() => from(getApps())),
  distinct(),
);
