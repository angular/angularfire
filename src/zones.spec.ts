import { EnvironmentInjector, NgZone, PendingTasks, runInInjectionContext } from '@angular/core';
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

describe('ɵzoneWrap callback pending-task removal', () => {

  // What had happened by the time the wrapper called the task remover.
  interface Release { afterCallbackBody: boolean; afterBodyMicrotask: boolean; afterMicrotask: boolean; afterTimer: boolean; }
  interface Listener { callback?: (value: number) => void; unsubscribed: boolean; }

  let ngZone: NgZone;
  let injector: EnvironmentInjector;
  let markers: { body: boolean; bodyMicrotask: boolean; microtask: boolean; timer: boolean };

  // Stands in for a callback-taking Firebase function: keeps the callback, returns an unsubscribe.
  const fakeListen = (listener: Listener) => (callback: (value: number) => void) => {
    listener.callback = callback;
    return () => { listener.unsubscribed = true; };
  };

  // Stands in for Realtime Database on cached data: invokes the callback inside the registering call.
  const fakeListenSynchronously = (listener: Listener) => (callback: (value: number) => void) => {
    callback(1);
    return () => { listener.unsubscribed = true; };
  };

  /* Hands the wrapper a remover that records which markers had fired when it was called. A
   * remover call that never comes resolves as all false after the fallback timer, not as a spec timeout. */
  const observeRelease = () => new Promise<Release>(resolve => {
    spyOn(TestBed.inject(PendingTasks), 'add').and.returnValue(() =>
      resolve({ afterCallbackBody: markers.body, afterBodyMicrotask: markers.bodyMicrotask, afterMicrotask: markers.microtask, afterTimer: markers.timer }));
    ngZone.runOutsideAngular(() => setTimeout(() => resolve({ afterCallbackBody: false, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false }), 500));
  });

  // A setTimeout(fn, 0) and a microtask, registered just before the delivery they are compared with.
  const plantMarkers = () => {
    setTimeout(() => { markers.timer = true; }, 0);
    queueMicrotask(() => { markers.microtask = true; });
  };

  /* Runs `deliver` the way Firestore delivers, from a setTimeout(fn, 0) outside Angular, planting the
   * markers in that same task first. */
  const deliverOutsideAngular = (deliver: () => void) => ngZone.runOutsideAngular(() => setTimeout(() => {
    plantMarkers();
    deliver();
  }, 0));

  // The callback body records that it ran and queues a microtask of its own.
  const callbackBody = () => {
    markers.body = true;
    queueMicrotask(() => { markers.bodyMicrotask = true; });
  };

  const wrapAndCall = (listen: (callback: (value: number) => void) => () => void, callback: (value: number) => void) => {
    const wrapped = ɵzoneWrap(listen, true);
    return runInInjectionContext(injector, () => ngZone.run(() => wrapped(callback)));
  };

  beforeEach(() => {
    ngZone = TestBed.inject(NgZone);
    injector = TestBed.inject(EnvironmentInjector);
    markers = { body: false, bodyMicrotask: false, microtask: false, timer: false };
  });

  it('removes the pending task after the callback body ran and before its microtasks, before a setTimeout(fn, 0) registered just before delivery', async () => {
    const listener: Listener = { unsubscribed: false };
    const release = observeRelease();
    wrapAndCall(fakeListen(listener), callbackBody);
    deliverOutsideAngular(() => listener.callback?.(1));
    expect(await release).toEqual({ afterCallbackBody: true, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
  });

  it('removes the pending task the same way when the callback is invoked inside the registering call', async () => {
    const listener: Listener = { unsubscribed: false };
    const release = observeRelease();
    ngZone.runOutsideAngular(plantMarkers);
    wrapAndCall(fakeListenSynchronously(listener), callbackBody);
    expect(await release).toEqual({ afterCallbackBody: true, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
  });

  it('removes the pending task on unsubscribe before a setTimeout(fn, 0) registered just before the unsubscribe call', async () => {
    const listener: Listener = { unsubscribed: false };
    const release = observeRelease();
    const unsubscribe = wrapAndCall(fakeListen(listener), callbackBody);
    deliverOutsideAngular(() => unsubscribe());
    expect(await release).toEqual({ afterCallbackBody: false, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
    expect(listener.unsubscribed).toBe(true);
  });

  it('removes the pending task even when the callback throws', async () => {
    const listener: Listener = { unsubscribed: false };
    const release = observeRelease();
    wrapAndCall(fakeListen(listener), () => { markers.body = true; throw new Error('deliberate'); });
    let thrown: unknown;
    deliverOutsideAngular(() => {
      try { listener.callback?.(1); } catch (error) { thrown = error; }
    });
    expect(await release).toEqual({ afterCallbackBody: true, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
    expect(thrown).toEqual(new Error('deliberate'));
  });

});
