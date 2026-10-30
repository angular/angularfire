import { EnvironmentInjector, NgZone, PendingTasks, inject, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ɵzoneWrap } from '@angular/fire';
import { Subject } from 'rxjs';

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

/* Stands in for a Firebase subscribe function such as onSnapshot: accepts the handler as a function
 * or as an observer object, delivers one value from a timer the way the SDK delivers from its own
 * async work, and returns an unsubscribe function. The timer is created while ɵzoneWrap runs the
 * call outside the Angular zone, so an unwrapped handler runs there with no injection context. */
let lastReceived: { handler: unknown; options: unknown } | undefined;
let lastHandlerError: unknown;

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
    /* One counter object per spec, captured by that spec's spy. The wrapped unsubscribe releases
     * the task through a 0 ms timer, so a release can land after the spec that created it ends,
     * and it must not count toward the next spec. */
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
    });

    afterEach(async () => {
      // Handlers re-enter this test's injector, so none may outlive the TestBed.
      cleanups.forEach(cleanup => cleanup());
      await flushTimers();
    });

    const subscribeWrapped = (blockUntilFirst: boolean, ...callArguments: Parameters<typeof fakeSubscribe>) => {
      const wrapped = ɵzoneWrap(fakeSubscribe, blockUntilFirst);
      const unsubscribe = TestBed.runInInjectionContext(() => wrapped(...callArguments));
      cleanups.push(unsubscribe);
      return unsubscribe;
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
      const wrapped = ɵzoneWrap(fakeDataConnectSubscribe, true);
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
  });
}

describeZoneWrap(true);
describeZoneWrap(false);
