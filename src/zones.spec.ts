import {
  EnvironmentInjector,
  NgZone,
  PendingTasks,
  createEnvironmentInjector,
  inject,
  provideZoneChangeDetection,
  provideZonelessChangeDetection,
  runInInjectionContext
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ɵAngularFireSchedulers, ɵzoneWrap } from '@angular/fire';
import { Observable, Subject, asapScheduler } from 'rxjs';
import { AsapScheduler } from 'rxjs/internal/scheduler/AsapScheduler';
import { take } from 'rxjs/operators';

type NextHandler = (value: number) => void;

interface FakeObserver {
  next?: NextHandler | null;
  error?: (error: unknown) => void;
  complete?: () => void;
}

interface FakeDataConnectObserver {
  onNext?: NextHandler;
}

interface FakeOptions {
  failWith?: Error;
}

let lastReceived: { handler: unknown; options: unknown } | undefined;
let lastHandlerError: unknown;

/* Stands in for a Firebase subscribe function such as onSnapshot: accepts the handler as a function
 * or as an observer object, delivers one value from a timer the way the SDK delivers from its own
 * async work, and returns an unsubscribe function. The timer is created while ɵzoneWrap runs the
 * call outside the Angular zone, so an unwrapped handler runs there with no injection context. */
function fakeSubscribe(nextOrObserver: NextHandler | FakeObserver, options?: FakeOptions): () => void {
  lastReceived = { handler: nextOrObserver, options };
  const observer: FakeObserver = typeof nextOrObserver === 'function' ? { next: nextOrObserver } : nextOrObserver;
  const timer = setTimeout(() => {
    try {
      if (options?.failWith) {
        observer.error?.(options.failWith);
        return;
      }
      observer.next?.(1);
      observer.complete?.();
    } catch (error) {
      lastHandlerError = error;
    }
  }, 0);
  return () => clearTimeout(timer);
}

function fakeDataConnectSubscribe(observer: FakeDataConnectObserver): () => void {
  const timer = setTimeout(() => observer.onNext?.(1), 0);
  return () => clearTimeout(timer);
}

function fakeAsyncCall(): Promise<string> {
  return new Promise(resolve => setTimeout(() => resolve('done'), 20));
}

/* A model class like one an app saves through a Firestore converter, with a method that happens to
 * share a name with an observer member. */
class Task {
  constructor(public title: string) {}
  complete() {
    return this.title;
  }
}

// Stands in for a Firebase data call such as setDoc: takes a data object and returns a Promise.
let lastSaved: unknown;
function fakeSave(data: object): Promise<void> {
  lastSaved = data;
  return new Promise(resolve => setTimeout(resolve, 0));
}

const flushTimers = () => new Promise<void>(resolve => setTimeout(resolve, 10));

const waitFor = async (condition: () => boolean, timeoutMs = 500) => {
  const startedAt = Date.now();
  while (!condition() && Date.now() - startedAt < timeoutMs) {
    await flushTimers();
  }
};

interface HandlerReport {
  values: number[];
  injectWorked: boolean | null;
  inAngularZone: boolean | null;
}

function reportingHandler(): { report: HandlerReport; next: NextHandler } {
  const report: HandlerReport = { values: [], injectWorked: null, inAngularZone: null };
  const next: NextHandler = value => {
    report.values.push(value);
    report.inAngularZone = NgZone.isInAngularZone();
    try {
      inject(EnvironmentInjector);
      report.injectWorked = true;
    } catch {
      report.injectWorked = false;
    }
  };
  return { report, next };
}

function describeZoneWrap(zoneJs: boolean) {
  /* karma loads zone.js for every spec, so the "zoneless" run only swaps NgZone for NoopNgZone.
   * The Zone-undefined paths in zones.ts are not covered here. */
  const mode = zoneJs ? 'with zone.js change detection' : 'with NoopNgZone (zone.js still loaded)';

  describe(`ɵzoneWrap ${mode}`, () => {
    let addTask: jasmine.Spy;
    /* One counter object per spec, captured by that spec's spy, so a removal that lands after the
     * spec ends, such as a wrapped promise's, does not count toward the next spec. */
    let releases: { count: number };
    let cleanups: (() => void)[];

    beforeEach(() => {
      // This TestBed gives a real NgZone unless told otherwise, so both modes are stated.
      TestBed.configureTestingModule({
        providers: [zoneJs ? provideZoneChangeDetection() : provideZonelessChangeDetection()],
      });
      const pendingTasks = TestBed.inject(PendingTasks);
      const originalAdd = pendingTasks.add.bind(pendingTasks);
      const thisSpecReleases = { count: 0 };
      releases = thisSpecReleases;
      addTask = spyOn(pendingTasks, 'add').and.callFake(() => {
        const remove = originalAdd();
        return () => {
          thisSpecReleases.count++;
          remove();
        };
      });
      cleanups = [];
      lastReceived = undefined;
      lastHandlerError = undefined;
      lastSaved = undefined;
    });

    afterEach(async () => {
      // Handlers re-enter this test's injector, so none may outlive the TestBed.
      cleanups.forEach(cleanup => cleanup());
      await flushTimers();
    });

    const subscribeWrapped = (blockUntilFirst: boolean, ...callArguments: Parameters<typeof fakeSubscribe>) => {
      const wrapped = ɵzoneWrap(fakeSubscribe, blockUntilFirst, undefined, true);
      const unsubscribe = TestBed.runInInjectionContext(() => wrapped(...callArguments));
      cleanups.push(unsubscribe);
      return unsubscribe;
    };

    const subscribeWrappedWithoutObserver = (blockUntilFirst: boolean, ...callArguments: Parameters<typeof fakeSubscribe>) => {
      const wrapped = ɵzoneWrap(fakeSubscribe, blockUntilFirst);
      cleanups.push(TestBed.runInInjectionContext(() => wrapped(...callArguments)));
    };

    it('gives a handler passed as a function the injection context, the zone and a pending task', async () => {
      const { report, next } = reportingHandler();
      subscribeWrapped(true, next);
      expect(addTask).toHaveBeenCalledTimes(1);
      await waitFor(() => releases.count === 1);
      expect(report.values).toEqual([1]);
      expect(report.injectWorked).toBeTrue();
      expect(report.inAngularZone).toBe(zoneJs);
      expect(releases.count).toBe(1);
    });

    it('gives a handler passed as an observer object the same three things', async () => {
      const { report, next } = reportingHandler();
      subscribeWrapped(true, { next });
      expect(addTask).toHaveBeenCalledTimes(1);
      await waitFor(() => releases.count === 1);
      expect(report.values).toEqual([1]);
      expect(report.injectWorked).toBeTrue();
      expect(report.inAngularZone).toBe(zoneJs);
      expect(releases.count).toBe(1);
    });

    it('registers no pending task for an observer object when blockUntilFirst is false', async () => {
      const { report, next } = reportingHandler();
      subscribeWrapped(false, { next });
      expect(addTask).not.toHaveBeenCalled();
      await waitFor(() => report.values.length === 1);
      expect(report.injectWorked).toBeTrue();
      expect(report.inAngularZone).toBe(zoneJs);
    });

    it('wraps the error and complete members of an observer object too', async () => {
      let errorInjectWorked: boolean | null = null;
      let completeInjectWorked: boolean | null = null;
      const probeInject = () => {
        try {
          inject(EnvironmentInjector);
          return true;
        } catch {
          return false;
        }
      };
      subscribeWrapped(true, { complete: () => { completeInjectWorked = probeInject(); } });
      subscribeWrapped(true, { error: () => { errorInjectWorked = probeInject(); } }, { failWith: new Error('boom') });
      await waitFor(() => releases.count === 2);
      expect(completeInjectWorked).toBeTrue();
      expect(errorInjectWorked).toBeTrue();
      expect(releases.count).toBe(2);
    });

    it('recognizes the onNext member data-connect observers use', async () => {
      const { report, next } = reportingHandler();
      const wrapped = ɵzoneWrap(fakeDataConnectSubscribe, true, undefined, true);
      cleanups.push(TestBed.runInInjectionContext(() => wrapped({ onNext: next })));
      expect(addTask).toHaveBeenCalledTimes(1);
      await waitFor(() => releases.count === 1);
      expect(report.injectWorked).toBeTrue();
      expect(releases.count).toBe(1);
    });

    it('passes an options object without handler members through as the same reference', () => {
      const options: FakeOptions = {};
      subscribeWrapped(true, () => undefined, options);
      expect(lastReceived?.options).toBe(options);
    });

    it('hands Firebase a copy, leaving the caller\'s observer object unchanged across two calls', () => {
      const next: NextHandler = () => undefined;
      const observer: FakeObserver = { next };
      subscribeWrapped(true, observer);
      subscribeWrapped(true, observer);
      expect(observer.next).toBe(next);
      expect(Object.keys(observer)).toEqual(['next']);
      expect(lastReceived?.handler).not.toBe(observer);
    });

    it('keeps `this` for an observer written as a class instance', async () => {
      class Counter {
        count = 0;
        next() {
          this.count++;
        }
      }
      const counter = new Counter();
      subscribeWrapped(true, counter);
      await waitFor(() => counter.count === 1);
      expect(counter.count).toBe(1);
    });

    it('delivers to an RxJS Subject passed as the observer', async () => {
      const subject = new Subject<number>();
      const received: number[] = [];
      subject.subscribe(value => received.push(value));
      subscribeWrapped(true, subject);
      await waitFor(() => received.length === 1);
      expect(received).toEqual([1]);
    });

    it('passes a null next member through untouched', async () => {
      let errorSeen: unknown;
      subscribeWrapped(true, { next: null, error: error => { errorSeen = error; } }, { failWith: new Error('boom') });
      const handler = lastReceived?.handler;
      expect(handler && typeof handler === 'object' && Reflect.get(handler, 'next')).toBeNull();
      await waitFor(() => errorSeen !== undefined);
      expect(errorSeen).toEqual(new Error('boom'));
    });

    it('still releases the pending task when next throws, and lets the error reach the SDK', async () => {
      subscribeWrapped(true, { next: () => { throw new Error('handler failed'); } });
      await waitFor(() => releases.count === 1);
      expect(releases.count).toBe(1);
      expect(lastHandlerError).toEqual(new Error('handler failed'));
    });

    it('removes the pending task when the handler fires after its child environment injector is destroyed', async () => {
      const received: number[] = [];
      const childInjector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
      const wrapped = ɵzoneWrap(fakeSubscribe, true, undefined, true);
      cleanups.push(runInInjectionContext(childInjector, () => wrapped((value: number) => received.push(value))));
      childInjector.destroy();
      await waitFor(() => received.length === 1);
      expect(received).toEqual([1]);
      expect(releases.count).toBe(1);
    });

    it('still calls a handler that fires after the injector is destroyed, in both forms', async () => {
      const received: unknown[] = [];
      subscribeWrapped(true, value => received.push(value));
      subscribeWrapped(true, { next: value => received.push(value) });
      TestBed.resetTestingModule();
      await flushTimers();
      expect(received).toEqual([1, 1]);
      expect(lastHandlerError).toBeUndefined();
    });

    it('leaves a data object with an observer-named method alone when the call takes no observer', async () => {
      const wrapped = ɵzoneWrap(fakeSave, true);
      const task = new Task('write the spec');
      await TestBed.runInInjectionContext(() => wrapped(task));
      await flushTimers();
      expect(lastSaved).toBe(task);
      expect(addTask).toHaveBeenCalledTimes(1);
      expect(releases.count).toBe(1);
    });

    it('does not treat an observer object as one when the call takes no observer', async () => {
      const { report, next } = reportingHandler();
      const observer: FakeObserver = { next };
      subscribeWrappedWithoutObserver(true, observer);
      expect(addTask).not.toHaveBeenCalled();
      expect(lastReceived?.handler).toBe(observer);
      await waitFor(() => report.values.length === 1);
      expect(report.injectWorked).toBeFalse();
    });

    it('settles a wrapped promise even when it resolves after the injector is destroyed', async () => {
      const wrapped = ɵzoneWrap(fakeAsyncCall, true);
      const promise = TestBed.runInInjectionContext(() => wrapped());
      TestBed.resetTestingModule();
      await expectAsync(promise).toBeResolvedTo('done');
    });
  });
}

describeZoneWrap(true);
describeZoneWrap(false);

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

  // Whether the wrapper called the task remover, and what had happened by then.
  interface Release { released: boolean; afterCallbackBody: boolean; afterBodyMicrotask: boolean; afterMicrotask: boolean; afterTimer: boolean; }
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
   * remover call that never comes resolves with released false after the fallback timer, not as a spec timeout. */
  const observeRelease = () => new Promise<Release>(resolve => {
    spyOn(TestBed.inject(PendingTasks), 'add').and.returnValue(() =>
      resolve({ released: true, afterCallbackBody: markers.body, afterBodyMicrotask: markers.bodyMicrotask, afterMicrotask: markers.microtask, afterTimer: markers.timer }));
    ngZone.runOutsideAngular(() => setTimeout(() => resolve({ released: false, afterCallbackBody: false, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false }), 500));
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
    expect(await release).toEqual({ released: true, afterCallbackBody: true, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
  });

  it('removes the pending task the same way when the callback is invoked inside the registering call', async () => {
    const listener: Listener = { unsubscribed: false };
    const release = observeRelease();
    ngZone.runOutsideAngular(plantMarkers);
    wrapAndCall(fakeListenSynchronously(listener), callbackBody);
    expect(await release).toEqual({ released: true, afterCallbackBody: true, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
  });

  it('removes the pending task on unsubscribe before a setTimeout(fn, 0) registered just before the unsubscribe call', async () => {
    const listener: Listener = { unsubscribed: false };
    const release = observeRelease();
    const unsubscribe = wrapAndCall(fakeListen(listener), callbackBody);
    deliverOutsideAngular(() => unsubscribe());
    expect(await release).toEqual({ released: true, afterCallbackBody: false, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
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
    expect(await release).toEqual({ released: true, afterCallbackBody: true, afterBodyMicrotask: false, afterMicrotask: false, afterTimer: false });
    expect(thrown).toEqual(new Error('deliberate'));
  });

});
