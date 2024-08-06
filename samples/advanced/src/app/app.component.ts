import { ApplicationRef, Component, isDevMode } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    template: `
    <h1>AngularFire kitchen sink (<a href="https://github.com/angular/angularfire/tree/master/samples/advanced"><code>samples/advanced</code></a>)</h1>
    <router-outlet></router-outlet>
  `,
    styles: [],
    standalone: true,
    imports: [RouterOutlet]
})
export class AppComponent {
  title = 'sample';
  constructor(
    appRef: ApplicationRef,
  ) {
    if (isDevMode()) {
      appRef.isStable.pipe(
        debounceTime(200),
        distinctUntilChanged(),
      ).subscribe(it => {
        console.log('isStable', it);
      });
    }
  }
}
