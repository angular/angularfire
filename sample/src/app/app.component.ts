import { ApplicationRef, Component, isDevMode } from '@angular/core';
import { FirebaseApp } from '@angular/fire';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <h1>AngularFire kitchen sink</h1>
    <h2>Primary outlet</h2>
    <nav>
      <a [routerLink]="[{ outlets: { primary: [] }}]">Home</a> |
      <a [routerLink]="[{ outlets: { primary: ['protected'] }}]">Protected</a> |
      <a [routerLink]="[{ outlets: { primary: ['lazy'] }}]">Lazy</a> |
      <a [routerLink]="[{ outlets: { primary: ['protected-lazy'] }}]">Protected Lazy</a> |
      <a [routerLink]="[{ outlets: { primary: ['protected-lazy', 'asdf'] }}]">Protected Lazy Deep</a> |
      <a [routerLink]="[{ outlets: { primary: ['protected-lazy', '1', 'bob'] }}]">Protected Lazy Deep</a></nav>
    <router-outlet></router-outlet>
    <h2>Secondary outlet</h2>
    <nav><a [routerLink]="[{ outlets: { secondary: [] }}]">Home</a> | <a [routerLink]="[{ outlets: { secondary: ['protected'] }}]">Protected</a> | <a [routerLink]="[{ outlets: { secondary: ['protected-lazy'] }}]">Protected Lazy (no anonymous)</a></nav>
    <router-outlet name="secondary"></router-outlet>
    <h2>Yet anther outlet</h2>
    <nav><a [routerLink]="[{ outlets: { tertiary: [] }}]">Home</a> | <a [routerLink]="[{ outlets: { tertiary: ['protected'] }}]">Protected</a></nav>
    <router-outlet name="tertiary"></router-outlet>
  `,
  styles: [``]
})
export class AppComponent {
  constructor(public readonly firebaseApp: FirebaseApp, appRef: ApplicationRef) {
    if (isDevMode()) {
      appRef.isStable.pipe(debounceTime(200)).subscribe(it => console.log('isStable', it));
    }
  }
}
