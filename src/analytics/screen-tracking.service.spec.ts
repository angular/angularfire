import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ɵscreenViewEvent } from '@angular/fire/analytics';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-test-screen',
  template: '',
})
class TestScreenComponent {}

describe('ScreenTrackingService', () => {
  it('uses a lazy routed component selector as the screen class', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'screen',
            loadChildren: () => [{ path: '', component: TestScreenComponent }],
          },
        ]),
        provideLocationMocks(),
      ],
    });
    const router = TestBed.inject(Router);
    const screenView = firstValueFrom(ɵscreenViewEvent(router, null));

    await router.navigateByUrl('/screen');

    expect((await screenView).screen_class).toBe('app-test-screen');
  });
});
