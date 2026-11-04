import { EnvironmentInjector, NgZone, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ɵAngularFireSchedulers, ɵzoneWrap } from '@angular/fire';
import { Observable, Subject, asapScheduler } from 'rxjs';
import { AsapScheduler } from 'rxjs/internal/scheduler/AsapScheduler';
import { take } from 'rxjs/operators';

describe('ɵzoneWrap delivery timing', () => {

  let source: Subject<number>;
  let stream: Observable<number>;
  let ngZone: NgZone;

  beforeEach(() => {
    source = new Subject<number>();
    ngZone = TestBed.inject(NgZone);
    const read = ɵzoneWrap(() => source.asObservable(), true);
    stream = runInInjectionContext(TestBed.inject(EnvironmentInjector), () => ngZone.run(() => read()));
  });

  it('delivers an Observable value asynchronously, inside the Angular zone, before a zero-delay timer registered when the source emitted', async () => {
    const delivery = await new Promise<{ delivered: boolean; afterEmit: boolean; inAngularZone: boolean }>(resolve => {
      let emitted = false;
      stream.pipe(take(1)).subscribe(() => resolve({ delivered: true, afterEmit: emitted, inAngularZone: NgZone.isInAngularZone() }));
      ngZone.runOutsideAngular(() => {
        // The timer races the delivery, so a dropped or late value fails here, not on the spec timeout.
        setTimeout(() => resolve({ delivered: false, afterEmit: emitted, inAngularZone: false }), 0);
        source.next(1);
        emitted = true;
      });
    });
    expect(delivery.delivered).withContext('delivered before the zero-delay timer').toBe(true);
    expect(delivery.afterEmit).withContext('never synchronous').toBe(true);
    expect(delivery.inAngularZone).withContext('delivered inside the Angular zone').toBe(true);
  });

  it('delivers through its own asap scheduler, not the one rxjs shares with every other caller', () => {
    const delegate = Reflect.get(TestBed.inject(ɵAngularFireSchedulers).insideAngular, 'delegate');
    expect(delegate).toBeInstanceOf(AsapScheduler);
    expect(delegate).not.toBe(asapScheduler);
  });

});
