import { ApplicationRef, Component } from '@angular/core';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  title = 'sample';
  constructor(
    appRef: ApplicationRef,
  ) {
    appRef.isStable.pipe(distinctUntilChanged()).subscribe(it => console.log('isStable', it));
  }
}
