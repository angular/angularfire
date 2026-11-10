import { Observable } from 'rxjs';

/** Every `null` entry in tools/build.ts that both firebase/firestore and firebase/firestore/lite export. */
export const UNWRAPPED_FIRESTORE_FUNCTIONS = [
  'where', 'orderBy', 'limit', 'limitToLast', 'startAt', 'startAfter', 'endAt', 'endBefore', 'and', 'or', 'query',
  'collection', 'collectionGroup', 'doc', 'documentId',
  'increment', 'deleteField', 'vector', 'sum', 'arrayRemove', 'arrayUnion', 'serverTimestamp', 'maximum', 'minimum',
  'average', 'count',
  'refEqual', 'queryEqual', 'snapshotEqual', 'aggregateFieldEqual', 'aggregateQuerySnapshotEqual',
  'setLogLevel',
] as const;

/**
 * The `null` entries only firebase/firestore exports. They build the `localCache` setting for
 * `initializeFirestore`, and firebase/firestore/lite keeps no offline cache, so it has no such setting.
 */
export const UNWRAPPED_FULL_SDK_ONLY = [
  'memoryEagerGarbageCollector', 'memoryLocalCache', 'memoryLruGarbageCollector',
  'persistentLocalCache', 'persistentMultipleTabManager', 'persistentSingleTabManager',
] as const;

/** Internal firebase/firestore exports absent from its type declarations, so the generator never wraps them. */
const UNDECLARED_SDK_EXPORTS = ['ensureFirestoreConfigured', 'executeWrite'];

type UnwrappedFunction = typeof UNWRAPPED_FIRESTORE_FUNCTIONS[number] | typeof UNWRAPPED_FULL_SDK_ONLY[number];

/** One sample call per function, keyed by function name. Each receives the function it is keyed by, so the two cannot disagree. */
export type SampleCalls<Module, CheckedFunction extends UnwrappedFunction & keyof Module> = {
  [FunctionName in CheckedFunction]: (sdkFunction: Module[FunctionName]) => unknown;
};

const nextMacrotask = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/**
 * Runs `work` in a child zone that records every task (timer, promise callback, event listener)
 * scheduled meanwhile. A `.then` on a promise still pending when `work` returns is only scheduled
 * once that promise settles, so the record is read one macrotask later.
 */
export async function recordScheduledTasks<Result>(work: () => Result): Promise<{ tasks: string[]; result: Result | undefined }> {
  const tasks: string[] = [];
  const recorder = Zone.current.fork({
    name: 'scheduled-task-recorder',
    onScheduleTask: (parentDelegate, _currentZone, targetZone, task) => {
      tasks.push(`${task.type}:${task.source}`);
      return parentDelegate.scheduleTask(targetZone, task);
    },
  });
  let result: Result | undefined;
  recorder.run(() => {
    result = work();
  });
  await nextMacrotask();
  return { tasks, result };
}

const isThenable = (value: unknown) =>
  value instanceof Object && typeof Reflect.get(value, 'then') === 'function';

/** Every function in `checkedFunctions`, called through its sample call, schedules nothing and returns a plain value. */
export async function expectSynchronousAndTaskFree<Module, CheckedFunction extends UnwrappedFunction & keyof Module>(
  sdk: Module,
  checkedFunctions: readonly CheckedFunction[],
  sampleCalls: SampleCalls<Module, CheckedFunction>,
) {
  const callSample = <FunctionName extends CheckedFunction>(functionName: FunctionName) => {
    try {
      return sampleCalls[functionName](sdk[functionName]);
    } catch (error) {
      throw new Error(`The sample call for ${String(functionName)} threw: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  for (const functionName of checkedFunctions) {
    const { tasks, result } = await recordScheduledTasks(() => callSample(functionName));
    expect(tasks).withContext(`${functionName} scheduled work`).toEqual([]);
    expect(isThenable(result)).withContext(`${functionName} returned a promise or thenable`).toBeFalse();
    expect(result instanceof Observable).withContext(`${functionName} returned an Observable`).toBeFalse();
    expect(typeof result).withContext(`${functionName} returned a function`).not.toBe('function');
  }
}

/**
 * The lowercase functions an AngularFire entry point hands out as the SDK's own function objects
 * are exactly `expected`, so a `null` added to tools/build.ts without a sample call fails here.
 */
export function expectExactlyTheseUnwrapped(
  angularFireEntryPoint: object,
  sdkEntryPoint: object,
  expected: readonly string[],
) {
  const unwrapped = Object.keys(angularFireEntryPoint).filter(name =>
    /^[a-z]/.test(name) &&
    !UNDECLARED_SDK_EXPORTS.includes(name) &&
    typeof Reflect.get(angularFireEntryPoint, name) === 'function' &&
    Reflect.get(angularFireEntryPoint, name) === Reflect.get(sdkEntryPoint, name));
  expect(unwrapped.sort()).toEqual([...expected].sort());
}
