import { ApplicationRef, Component } from '@angular/core';
import { FirebaseApp } from '@angular/fire';

@Component({
  selector: 'app-root',
  template: `
    <a [routerLink]="[{ outlets: { primary: [] }}]">Home</a> | <a [routerLink]="[{ outlets: { primary: ['protected'] }}]">Protected</a> | <a [routerLink]="[{ outlets: { primary: ['protected-lazy'] }}]">Protected Lazy</a> | <a [routerLink]="[{ outlets: { primary: ['protected-lazy', 'asdf'] }}]">Protected Lazy Deep</a> | <a [routerLink]="[{ outlets: { primary: ['protected-lazy', '1', 'bob'] }}]">Protected Lazy Deep</a>
    <router-outlet></router-outlet>
    <a [routerLink]="[{ outlets: { secondary: [] }}]">Home</a> | <a [routerLink]="[{ outlets: { secondary: ['protected'] }}]">Protected</a> | <a [routerLink]="[{ outlets: { secondary: ['protected-lazy'] }}]">Protected Lazy</a>
    <router-outlet name="secondary"></router-outlet>
    <a [routerLink]="[{ outlets: { tertiary: [] }}]">Home</a> | <a [routerLink]="[{ outlets: { tertiary: ['protected'] }}]">Protected</a>
    <router-outlet name="tertiary"></router-outlet>
  `,
  styles: [``]
})
export class AppComponent {
  constructor(public readonly firebaseApp: FirebaseApp, appRef: ApplicationRef) {
    appRef.isStable.subscribe(it => console.log('isStable', it));
  }
}
