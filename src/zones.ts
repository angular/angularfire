import { Injectable, NgZone } from '@angular/core';
import {
  asyncScheduler,
  Observable,
  Operator,
  queueScheduler,
  SchedulerAction,
  SchedulerLike,
  Subscriber,
  Subscription,
  TeardownLogic
} from 'rxjs';
import { observeOn, subscribeOn, tap } from 'rxjs/operators';

interface Zone {
  /**
   *
   * @returns {Zone} The parent Zone.
   */
  parent: Zone | null;
  /**
   * @returns {string} The Zone name (useful for debugging)
   */
  name: string;
  /**
   * Returns a value associated with the `key`.
   *
   * If the current zone does not have a key, the request is delegated to the parent zone. Use
   * [ZoneSpec.properties] to configure the set of properties associated with the current zone.
   *
   * @param key The key to retrieve.
   * @returns {any} The value for the key, or `undefined` if not found.
   */
  get(key: string): any;
  /**
   * Returns a Zone which defines a `key`.
   *
   * Recursively search the parent Zone until a Zone which has a property `key` is found.
   *
   * @param key The key to use for identification of the returned zone.
   * @returns {Zone} The Zone which defines the `key`, `null` if not found.
   */
  getZoneWith(key: string): Zone | null;
  /**
   * Used to create a child zone.
   *
   * @param zoneSpec A set of rules which the child zone should follow.
   * @returns {Zone} A new child zone.
   */
  fork(zoneSpec: ZoneSpec): Zone;
  /**
   * Wraps a callback function in a new function which will properly restore the current zone upon
   * invocation.
   *
   * The wrapped function will properly forward `this` as well as `arguments` to the `callback`.
   *
   * Before the function is wrapped the zone can intercept the `callback` by declaring
   * [ZoneSpec.onIntercept].
   *
   * @param callback the function which will be wrapped in the zone.
   * @param source A unique debug location of the API being wrapped.
   * @returns {function(): *} A function which will invoke the `callback` through [Zone.runGuarded].
   */
  wrap<F extends Function>(callback: F, source: string): F;
  /**
   * Invokes a function in a given zone.
   *
   * The invocation of `callback` can be intercepted by declaring [ZoneSpec.onInvoke].
   *
   * @param callback The function to invoke.
   * @param applyThis
   * @param applyArgs
   * @param source A unique debug location of the API being invoked.
   * @returns {any} Value from the `callback` function.
   */
  run<T>(callback: Function, applyThis?: any, applyArgs?: any[], source?: string): T;
  /**
   * Invokes a function in a given zone and catches any exceptions.
   *
   * Any exceptions thrown will be forwarded to [Zone.HandleError].
   *
   * The invocation of `callback` can be intercepted by declaring [ZoneSpec.onInvoke]. The
   * handling of exceptions can be intercepted by declaring [ZoneSpec.handleError].
   *
   * @param callback The function to invoke.
   * @param applyThis
   * @param applyArgs
   * @param source A unique debug location of the API being invoked.
   * @returns {any} Value from the `callback` function.
   */
  runGuarded<T>(callback: Function, applyThis?: any, applyArgs?: any[], source?: string): T;
  /**
   * Execute the Task by restoring the [Zone.currentTask] in the Task's zone.
   *
   * @param task to run
   * @param applyThis
   * @param applyArgs
   * @returns {any} Value from the `task.callback` function.
   */
  runTask<T>(task: Task, applyThis?: any, applyArgs?: any): T;
  /**
   * Schedule a MicroTask.
   *
   * @param source
   * @param callback
   * @param data
   * @param customSchedule
   */
  scheduleMicroTask(source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void): MicroTask;
  /**
   * Schedule a MacroTask.
   *
   * @param source
   * @param callback
   * @param data
   * @param customSchedule
   * @param customCancel
   */
  scheduleMacroTask(source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void, customCancel?: (task: Task) => void): MacroTask;
  /**
   * Schedule an EventTask.
   *
   * @param source
   * @param callback
   * @param data
   * @param customSchedule
   * @param customCancel
   */
  scheduleEventTask(source: string, callback: Function, data?: TaskData, customSchedule?: (task: Task) => void, customCancel?: (task: Task) => void): EventTask;
  /**
   * Schedule an existing Task.
   *
   * Useful for rescheduling a task which was already canceled.
   *
   * @param task
   */
  scheduleTask<T extends Task>(task: T): T;
  /**
   * Allows the zone to intercept canceling of scheduled Task.
   *
   * The interception is configured using [ZoneSpec.onCancelTask]. The default canceler invokes
   * the [Task.cancelFn].
   *
   * @param task
   * @returns {any}
   */
  cancelTask(task: Task): any;
}
interface ZoneType {
  /**
   * @returns {Zone} Returns the current [Zone]. The only way to change
   * the current zone is by invoking a run() method, which will update the current zone for the
   * duration of the run method callback.
   */
  current: Zone;
  /**
   * @returns {Task} The task associated with the current execution.
   */
  currentTask: Task | null;
  /**
   * Verify that Zone has been correctly patched. Specifically that Promise is zone aware.
   */
  assertZonePatched(): void;
  /**
   *  Return the root zone.
   */
  root: Zone;
  /**
   * load patch for specified native module, allow user to
   * define their own patch, user can use this API after loading zone.js
   */
  __load_patch(name: string, fn: _PatchFn, ignoreDuplicate?: boolean): void;
  /**
   * Zone symbol API to generate a string with __zone_symbol__ prefix
   */
  __symbol__(name: string): string;
}
/**
* Patch Function to allow user define their own monkey patch module.
*/
type _PatchFn = (global: Window, Zone: ZoneType, api: _ZonePrivate) => void;
/**
* _ZonePrivate interface to provide helper method to help user implement
* their own monkey patch module.
*/
interface _ZonePrivate {
  currentZoneFrame: () => _ZoneFrame;
  symbol: (name: string) => string;
  scheduleMicroTask: (task?: MicroTask) => void;
  onUnhandledError: (error: Error) => void;
  microtaskDrainDone: () => void;
  showUncaughtError: () => boolean;
  patchEventTarget: (global: any, api: _ZonePrivate, apis: any[], options?: any) => boolean[];
  patchOnProperties: (obj: any, properties: string[] | null, prototype?: any) => void;
  patchThen: (ctro: Function) => void;
  patchMethod: (target: any, name: string, patchFn: (delegate: Function, delegateName: string, name: string) => (self: any, args: any[]) => any) => Function | null;
  bindArguments: (args: any[], source: string) => any[];
  patchMacroTask: (obj: any, funcName: string, metaCreator: (self: any, args: any[]) => any) => void;
  patchEventPrototype: (_global: any, api: _ZonePrivate) => void;
  isIEOrEdge: () => boolean;
  ObjectDefineProperty: (o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => any;
  ObjectGetOwnPropertyDescriptor: (o: any, p: PropertyKey) => PropertyDescriptor | undefined;
  ObjectCreate(o: object | null, properties?: PropertyDescriptorMap & ThisType<any>): any;
  ArraySlice(start?: number, end?: number): any[];
  patchClass: (className: string) => void;
  wrapWithCurrentZone: (callback: any, source: string) => any;
  filterProperties: (target: any, onProperties: string[], ignoreProperties: any[]) => string[];
  attachOriginToPatched: (target: any, origin: any) => void;
  _redefineProperty: (target: any, callback: string, desc: any) => void;
  nativeScheduleMicroTask: (func: Function) => void;
  patchCallbacks: (api: _ZonePrivate, target: any, targetName: string, method: string, callbacks: string[]) => void;
  getGlobalObjects: () => {
      globalSources: any;
      zoneSymbolEventNames: any;
      eventNames: string[];
      isBrowser: boolean;
      isMix: boolean;
      isNode: boolean;
      TRUE_STR: string;
      FALSE_STR: string;
      ZONE_SYMBOL_PREFIX: string;
      ADD_EVENT_LISTENER_STR: string;
      REMOVE_EVENT_LISTENER_STR: string;
  } | undefined;
}
/**
* _ZoneFrame represents zone stack frame information
*/
interface _ZoneFrame {
  parent: _ZoneFrame | null;
  zone: Zone;
}
interface UncaughtPromiseError extends Error {
  zone: Zone;
  task: Task;
  promise: Promise<any>;
  rejection: any;
  throwOriginal?: boolean;
}
/**
* Provides a way to configure the interception of zone events.
*
* Only the `name` property is required (all other are optional).
*/
interface ZoneSpec {
  /**
   * The name of the zone. Useful when debugging Zones.
   */
  name: string;
  /**
   * A set of properties to be associated with Zone. Use [Zone.get] to retrieve them.
   */
  properties?: {
      [key: string]: any;
  };
  /**
   * Allows the interception of zone forking.
   *
   * When the zone is being forked, the request is forwarded to this method for interception.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param zoneSpec The argument passed into the `fork` method.
   */
  onFork?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, zoneSpec: ZoneSpec) => Zone;
  /**
   * Allows interception of the wrapping of the callback.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param delegate The argument passed into the `wrap` method.
   * @param source The argument passed into the `wrap` method.
   */
  onIntercept?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, delegate: Function, source: string) => Function;
  /**
   * Allows interception of the callback invocation.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param delegate The argument passed into the `run` method.
   * @param applyThis The argument passed into the `run` method.
   * @param applyArgs The argument passed into the `run` method.
   * @param source The argument passed into the `run` method.
   */
  onInvoke?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, delegate: Function, applyThis: any, applyArgs?: any[], source?: string) => any;
  /**
   * Allows interception of the error handling.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param error The argument passed into the `handleError` method.
   */
  onHandleError?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, error: any) => boolean;
  /**
   * Allows interception of task scheduling.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param task The argument passed into the `scheduleTask` method.
   */
  onScheduleTask?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task) => Task;
  onInvokeTask?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task, applyThis: any, applyArgs?: any[]) => any;
  /**
   * Allows interception of task cancellation.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param task The argument passed into the `cancelTask` method.
   */
  onCancelTask?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, task: Task) => any;
  /**
   * Notifies of changes to the task queue empty status.
   *
   * @param parentZoneDelegate Delegate which performs the parent [ZoneSpec] operation.
   * @param currentZone The current [Zone] where the current interceptor has been declared.
   * @param targetZone The [Zone] which originally received the request.
   * @param hasTaskState
   */
  onHasTask?: (parentZoneDelegate: ZoneDelegate, currentZone: Zone, targetZone: Zone, hasTaskState: HasTaskState) => void;
}
/**
*  A delegate when intercepting zone operations.
*
*  A ZoneDelegate is needed because a child zone can't simply invoke a method on a parent zone. For
*  example a child zone wrap can't just call parent zone wrap. Doing so would create a callback
*  which is bound to the parent zone. What we are interested in is intercepting the callback before
*  it is bound to any zone. Furthermore, we also need to pass the targetZone (zone which received
*  the original request) to the delegate.
*
*  The ZoneDelegate methods mirror those of Zone with an addition of extra targetZone argument in
*  the method signature. (The original Zone which received the request.) Some methods are renamed
*  to prevent confusion, because they have slightly different semantics and arguments.
*
*  - `wrap` => `intercept`: The `wrap` method delegates to `intercept`. The `wrap` method returns
*     a callback which will run in a given zone, where as intercept allows wrapping the callback
*     so that additional code can be run before and after, but does not associate the callback
*     with the zone.
*  - `run` => `invoke`: The `run` method delegates to `invoke` to perform the actual execution of
*     the callback. The `run` method switches to new zone; saves and restores the `Zone.current`;
*     and optionally performs error handling. The invoke is not responsible for error handling,
*     or zone management.
*
*  Not every method is usually overwritten in the child zone, for this reason the ZoneDelegate
*  stores the closest zone which overwrites this behavior along with the closest ZoneSpec.
*
*  NOTE: We have tried to make this API analogous to Event bubbling with target and current
*  properties.
*
*  Note: The ZoneDelegate treats ZoneSpec as class. This allows the ZoneSpec to use its `this` to
*  store internal state.
*/
interface ZoneDelegate {
  zone: Zone;
  fork(targetZone: Zone, zoneSpec: ZoneSpec): Zone;
  intercept(targetZone: Zone, callback: Function, source: string): Function;
  invoke(targetZone: Zone, callback: Function, applyThis?: any, applyArgs?: any[], source?: string): any;
  handleError(targetZone: Zone, error: any): boolean;
  scheduleTask(targetZone: Zone, task: Task): Task;
  invokeTask(targetZone: Zone, task: Task, applyThis?: any, applyArgs?: any[]): any;
  cancelTask(targetZone: Zone, task: Task): any;
  hasTask(targetZone: Zone, isEmpty: HasTaskState): void;
}
type HasTaskState = {
  microTask: boolean;
  macroTask: boolean;
  eventTask: boolean;
  change: TaskType;
};
/**
* Task type: `microTask`, `macroTask`, `eventTask`.
*/
type TaskType = 'microTask' | 'macroTask' | 'eventTask';
/**
* Task type: `notScheduled`, `scheduling`, `scheduled`, `running`, `canceling`, 'unknown'.
*/
type TaskState = 'notScheduled' | 'scheduling' | 'scheduled' | 'running' | 'canceling' | 'unknown';
/**
*/
interface TaskData {
  /**
   * A periodic [MacroTask] is such which get automatically rescheduled after it is executed.
   */
  isPeriodic?: boolean;
  /**
   * Delay in milliseconds when the Task will run.
   */
  delay?: number;
  /**
   * identifier returned by the native setTimeout.
   */
  handleId?: number;
}
/**
* Represents work which is executed with a clean stack.
*
* Tasks are used in Zones to mark work which is performed on clean stack frame. There are three
* kinds of task. [MicroTask], [MacroTask], and [EventTask].
*
* A JS VM can be modeled as a [MicroTask] queue, [MacroTask] queue, and [EventTask] set.
*
* - [MicroTask] queue represents a set of tasks which are executing right after the current stack
*   frame becomes clean and before a VM yield. All [MicroTask]s execute in order of insertion
*   before VM yield and the next [MacroTask] is executed.
* - [MacroTask] queue represents a set of tasks which are executed one at a time after each VM
*   yield. The queue is ordered by time, and insertions can happen in any location.
* - [EventTask] is a set of tasks which can at any time be inserted to the end of the [MacroTask]
*   queue. This happens when the event fires.
*
*/
interface Task {
  /**
   * Task type: `microTask`, `macroTask`, `eventTask`.
   */
  type: TaskType;
  /**
   * Task state: `notScheduled`, `scheduling`, `scheduled`, `running`, `canceling`, `unknown`.
   */
  state: TaskState;
  /**
   * Debug string representing the API which requested the scheduling of the task.
   */
  source: string;
  /**
   * The Function to be used by the VM upon entering the [Task]. This function will delegate to
   * [Zone.runTask] and delegate to `callback`.
   */
  invoke: Function;
  /**
   * Function which needs to be executed by the Task after the [Zone.currentTask] has been set to
   * the current task.
   */
  callback: Function;
  /**
   * Task specific options associated with the current task. This is passed to the `scheduleFn`.
   */
  data?: TaskData;
  /**
   * Represents the default work which needs to be done to schedule the Task by the VM.
   *
   * A zone may choose to intercept this function and perform its own scheduling.
   */
  scheduleFn?: (task: Task) => void;
  /**
   * Represents the default work which needs to be done to un-schedule the Task from the VM. Not all
   * Tasks are cancelable, and therefore this method is optional.
   *
   * A zone may chose to intercept this function and perform its own un-scheduling.
   */
  cancelFn?: (task: Task) => void;
  /**
   * @type {Zone} The zone which will be used to invoke the `callback`. The Zone is captured
   * at the time of Task creation.
   */
  readonly zone: Zone;
  /**
   * Number of times the task has been executed, or -1 if canceled.
   */
  runCount: number;
  /**
   * Cancel the scheduling request. This method can be called from `ZoneSpec.onScheduleTask` to
   * cancel the current scheduling interception. Once canceled the task can be discarded or
   * rescheduled using `Zone.scheduleTask` on a different zone.
   */
  cancelScheduleRequest(): void;
}
interface MicroTask extends Task {
  type: 'microTask';
}
interface MacroTask extends Task {
  type: 'macroTask';
}
interface EventTask extends Task {
  type: 'eventTask';
}
declare const Zone: ZoneType;
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/

/**
* Additional `EventTarget` methods added by `Zone.js`.
*
* 1. removeAllListeners, remove all event listeners of the given event name.
* 2. eventListeners, get all event listeners of the given event name.
*/
interface EventTarget {
/**
 *
 * Remove all event listeners by name for this event target.
 *
 * This method is optional because it may not be available if you use `noop zone` when
 * bootstrapping Angular application or disable the `EventTarget` monkey patch by `zone.js`.
 *
 * If the `eventName` is provided, will remove event listeners of that name.
 * If the `eventName` is not provided, will remove all event listeners associated with
 * `EventTarget`.
 *
 * @param eventName the name of the event, such as `click`. This parameter is optional.
 */
removeAllListeners?(eventName?: string): void;
/**
 *
 * Retrieve all event listeners by name.
 *
 * This method is optional because it may not be available if you use `noop zone` when
 * bootstrapping Angular application or disable the `EventTarget` monkey patch by `zone.js`.
 *
 * If the `eventName` is provided, will return an array of event handlers or event listener
 * objects of the given event.
 * If the `eventName` is not provided, will return all listeners.
 *
 * @param eventName the name of the event, such as click. This parameter is optional.
 */
eventListeners?(eventName?: string): EventListenerOrEventListenerObject[];
}
/**
* @license
* Copyright Google LLC All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/

/**
* Interface of `zone.js` configurations.
*
* You can define the following configurations on the `window/global` object before
* importing `zone.js` to change `zone.js` default behaviors.
*/
interface ZoneGlobalConfigurations {
/**
 * Disable the monkey patch of the `Node.js` `EventEmitter` API.
 *
 * By default, `zone.js` monkey patches the `Node.js` `EventEmitter` APIs to make asynchronous
 * callbacks of those APIs in the same zone when scheduled.
 *
 * Consider the following example:
 *
 * ```
 * const EventEmitter = require('events');
 * class MyEmitter extends EventEmitter {}
 * const myEmitter = new MyEmitter();
 *
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   myEmitter.on('event', () => {
 *     console.log('an event occurs in the zone', Zone.current.name);
 *     // the callback runs in the zone when it is scheduled,
 *     // so the output is 'an event occurs in the zone myZone'.
 *   });
 * });
 * myEmitter.emit('event');
 * ```
 *
 * If you set `__Zone_disable_EventEmitter = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `EventEmitter` APIs and the above code
 * outputs 'an event occurred <root>'.
 */
__Zone_disable_EventEmitter?: boolean;

/**
 * Disable the monkey patch of the `Node.js` `fs` API.
 *
 * By default, `zone.js` monkey patches `Node.js` `fs` APIs to make asynchronous callbacks of
 * those APIs in the same zone when scheduled.
 *
 * Consider the following example:
 *
 * ```
 * const fs = require('fs');
 *
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   fs.stat('/tmp/world', (err, stats) => {
 *     console.log('fs.stats() callback is invoked in the zone', Zone.current.name);
 *     // since the callback of the `fs.stat()` runs in the same zone
 *     // when it is called, so the output is 'fs.stats() callback is invoked in the zone myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_fs = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `fs` API and the above code
 * outputs 'get stats occurred <root>'.
 */
__Zone_disable_fs?: boolean;

/**
 * Disable the monkey patch of the `Node.js` `timer` API.
 *
 * By default, `zone.js` monkey patches the `Node.js` `timer` APIs to make asynchronous
 * callbacks of those APIs in the same zone when scheduled.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   setTimeout(() => {
 *     console.log('setTimeout() callback is invoked in the zone', Zone.current.name);
 *     // since the callback of `setTimeout()` runs in the same zone
 *     // when it is scheduled, so the output is 'setTimeout() callback is invoked in the zone
 *     // myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_timers = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `timer` APIs and the above code
 * outputs 'timeout <root>'.
 */
__Zone_disable_node_timers?: boolean;

/**
 * Disable the monkey patch of the `Node.js` `process.nextTick()` API.
 *
 * By default, `zone.js` monkey patches the `Node.js` `process.nextTick()` API to make the
 * callback in the same zone when calling `process.nextTick()`.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   process.nextTick(() => {
 *     console.log('process.nextTick() callback is invoked in the zone', Zone.current.name);
 *     // since the callback of `process.nextTick()` runs in the same zone
 *     // when it is scheduled, so the output is 'process.nextTick() callback is invoked in the
 *     // zone myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_nextTick = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `process.nextTick()` API and the above code
 * outputs 'nextTick <root>'.
 */
__Zone_disable_nextTick?: boolean;

/**
 * Disable the monkey patch of the `Node.js` `crypto` API.
 *
 * By default, `zone.js` monkey patches the `Node.js` `crypto` APIs to make asynchronous callbacks
 * of those APIs in the same zone when called.
 *
 * Consider the following example:
 *
 * ```
 * const crypto = require('crypto');
 *
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   crypto.randomBytes(() => {
 *     console.log('crypto.randomBytes() callback is invoked in the zone', Zone.current.name);
 *     // since the callback of `crypto.randomBytes()` runs in the same zone
 *     // when it is called, so the output is 'crypto.randomBytes() callback is invoked in the
 *     // zone myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_crypto = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `crypto` API and the above code
 * outputs 'crypto <root>'.
 */
__Zone_disable_crypto?: boolean;

/**
 * Disable the monkey patch of the `Object.defineProperty()` API.
 *
 * Note: This configuration is available only in the legacy bundle (dist/zone.js). This module is
 * not available in the evergreen bundle (zone-evergreen.js).
 *
 * In the legacy browser, the default behavior of `zone.js` is to monkey patch
 * `Object.defineProperty()` and `Object.create()` to try to ensure PropertyDescriptor parameter's
 * configurable property to be true. This patch is only needed in some old mobile browsers.
 *
 * If you set `__Zone_disable_defineProperty = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `Object.defineProperty()` API and does not
 * modify desc.configurable to true.
 *
 */
__Zone_disable_defineProperty?: boolean;

/**
 * Disable the monkey patch of the browser `registerElement()` API.
 *
 * NOTE: This configuration is only available in the legacy bundle (dist/zone.js), this
 * module is not available in the evergreen bundle (zone-evergreen.js).
 *
 * In the legacy browser, the default behavior of `zone.js` is to monkey patch the
 * `registerElement()` API to make asynchronous callbacks of the API in the same zone when
 * `registerElement()` is called.
 *
 * Consider the following example:
 *
 * ```
 * const proto = Object.create(HTMLElement.prototype);
 * proto.createdCallback = function() {
 *   console.log('createdCallback is invoked in the zone', Zone.current.name);
 * };
 * proto.attachedCallback = function() {
 *   console.log('attachedCallback is invoked in the zone', Zone.current.name);
 * };
 * proto.detachedCallback = function() {
 *   console.log('detachedCallback is invoked in the zone', Zone.current.name);
 * };
 * proto.attributeChangedCallback = function() {
 *   console.log('attributeChangedCallback is invoked in the zone', Zone.current.name);
 * };
 *
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   document.registerElement('x-elem', {prototype: proto});
 * });
 * ```
 *
 * When these callbacks are invoked, those callbacks will be in the zone when
 * `registerElement()` is called.
 *
 * If you set `__Zone_disable_registerElement = true` before importing `zone.js`,
 * `zone.js` does not monkey patch `registerElement()` API and the above code
 * outputs '<root>'.
 */
__Zone_disable_registerElement?: boolean;

/**
 * Disable the monkey patch of the browser legacy `EventTarget` API.
 *
 * NOTE: This configuration is only available in the legacy bundle (dist/zone.js), this module
 * is not available in the evergreen bundle (zone-evergreen.js).
 *
 * In some old browsers, the `EventTarget` is not available, so `zone.js` cannot directly monkey
 * patch the `EventTarget`. Instead, `zone.js` patches all known HTML elements' prototypes (such
 * as `HtmlDivElement`). The callback of the `addEventListener()` will be in the same zone when
 * the `addEventListener()` is called.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   div.addEventListener('click', () => {
 *     console.log('div click event listener is invoked in the zone', Zone.current.name);
 *     // the output is 'div click event listener is invoked in the zone myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_EventTargetLegacy = true` before importing `zone.js`
 * In some old browsers, where `EventTarget` is not available, if you set
 * `__Zone_disable_EventTargetLegacy = true` before importing `zone.js`, `zone.js` does not monkey
 * patch all HTML element APIs and the above code outputs 'clicked <root>'.
 */
__Zone_disable_EventTargetLegacy?: boolean;

/**
 * Disable the monkey patch of the browser `timer` APIs.
 *
 * By default, `zone.js` monkey patches browser timer
 * APIs (`setTimeout()`/`setInterval()`/`setImmediate()`) to make asynchronous callbacks of those
 * APIs in the same zone when scheduled.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   setTimeout(() => {
 *     console.log('setTimeout() callback is invoked in the zone', Zone.current.name);
 *     // since the callback of `setTimeout()` runs in the same zone
 *     // when it is scheduled, so the output is 'setTimeout() callback is invoked in the zone
 *     // myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_timers = true` before importing `zone.js`,
 * `zone.js` does not monkey patch `timer` API and the above code
 * outputs 'timeout <root>'.
 *
 */
__Zone_disable_timers?: boolean;

/**
 * Disable the monkey patch of the browser `requestAnimationFrame()` API.
 *
 * By default, `zone.js` monkey patches the browser `requestAnimationFrame()` API
 * to make the asynchronous callback of the `requestAnimationFrame()` in the same zone when
 * scheduled.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   requestAnimationFrame(() => {
 *     console.log('requestAnimationFrame() callback is invoked in the zone', Zone.current.name);
 *     // since the callback of `requestAnimationFrame()` will be in the same zone
 *     // when it is scheduled, so the output will be 'requestAnimationFrame() callback is invoked
 *     // in the zone myZone'
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_requestAnimationFrame = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `requestAnimationFrame()` API and the above code
 * outputs 'raf <root>'.
 */
__Zone_disable_requestAnimationFrame?: boolean;

/**
 *
 * Disable the monkey patching of the `queueMicrotask()` API.
 *
 * By default, `zone.js` monkey patches the `queueMicrotask()` API
 * to ensure that `queueMicrotask()` callback is invoked in the same zone as zone used to invoke
 * `queueMicrotask()`. And also the callback is running as `microTask` like
 * `Promise.prototype.then()`.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   queueMicrotask(() => {
 *     console.log('queueMicrotask() callback is invoked in the zone', Zone.current.name);
 *     // Since `queueMicrotask()` was invoked in `myZone`, same zone is restored
 *     // when 'queueMicrotask() callback is invoked, resulting in `myZone` being console logged.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_queueMicrotask = true` before importing `zone.js`,
 * `zone.js` does not monkey patch the `queueMicrotask()` API and the above code
 * output will change to: 'queueMicrotask() callback is invoked in the zone <root>'.
 */
__Zone_disable_queueMicrotask?: boolean;

/**
 *
 * Disable the monkey patch of the browser blocking APIs(`alert()`/`prompt()`/`confirm()`).
 */
__Zone_disable_blocking?: boolean;

/**
 * Disable the monkey patch of the browser `EventTarget` APIs.
 *
 * By default, `zone.js` monkey patches EventTarget APIs. The callbacks of the
 * `addEventListener()` run in the same zone when the `addEventListener()` is called.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   div.addEventListener('click', () => {
 *     console.log('div event listener is invoked in the zone', Zone.current.name);
 *     // the output is 'div event listener is invoked in the zone myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_EventTarget = true` before importing `zone.js`,
 * `zone.js` does not monkey patch EventTarget API and the above code
 * outputs 'clicked <root>'.
 *
 */
__Zone_disable_EventTarget?: boolean;

/**
 * Disable the monkey patch of the browser `FileReader` APIs.
 */
__Zone_disable_FileReader?: boolean;

/**
 * Disable the monkey patch of the browser `MutationObserver` APIs.
 */
__Zone_disable_MutationObserver?: boolean;

/**
 * Disable the monkey patch of the browser `IntersectionObserver` APIs.
 */
__Zone_disable_IntersectionObserver?: boolean;

/**
 * Disable the monkey patch of the browser onProperty APIs(such as onclick).
 *
 * By default, `zone.js` monkey patches onXXX properties (such as onclick). The callbacks of onXXX
 * properties run in the same zone when the onXXX properties is set.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 * zone.run(() => {
 *   div.onclick = () => {
 *     console.log('div click event listener is invoked in the zone', Zone.current.name);
 *     // the output will be 'div click event listener is invoked in the zone myZone'
 *   }
 * });
 * ```
 *
 * If you set `__Zone_disable_on_property = true` before importing `zone.js`,
 * `zone.js` does not monkey patch onXXX properties and the above code
 * outputs 'clicked <root>'.
 *
 */
__Zone_disable_on_property?: boolean;

/**
 * Disable the monkey patch of the browser `customElements` APIs.
 *
 * By default, `zone.js` monkey patches `customElements` APIs to make callbacks run in the
 * same zone when the `customElements.define()` is called.
 *
 * Consider the following example:
 *
 * ```
 * class TestCustomElement extends HTMLElement {
 *   constructor() { super(); }
 *   connectedCallback() {}
 *   disconnectedCallback() {}
 *   attributeChangedCallback(attrName, oldVal, newVal) {}
 *   adoptedCallback() {}
 * }
 *
 * const zone = Zone.fork({name: 'myZone'});
 * zone.run(() => {
 *   customElements.define('x-elem', TestCustomElement);
 * });
 * ```
 *
 * All those callbacks defined in TestCustomElement runs in the zone when
 * the `customElements.define()` is called.
 *
 * If you set `__Zone_disable_customElements = true` before importing `zone.js`,
 * `zone.js` does not monkey patch `customElements` APIs and the above code
 * runs inside <root> zone.
 */
__Zone_disable_customElements?: boolean;

/**
 * Disable the monkey patch of the browser `XMLHttpRequest` APIs.
 *
 * By default, `zone.js` monkey patches `XMLHttpRequest` APIs to make XMLHttpRequest act
 * as macroTask.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({
 *   name: 'myZone',
 *   onScheduleTask: (delegate, curr, target, task) => {
 *     console.log('task is scheduled', task.type, task.source, task.zone.name);
 *     return delegate.scheduleTask(target, task);
 *   }
 * })
 * const xhr = new XMLHttpRequest();
 * zone.run(() => {
 *   xhr.onload = function() {};
 *   xhr.open('get', '/', true);
 *   xhr.send();
 * });
 * ```
 *
 * In this example, the instance of XMLHttpRequest runs in the zone and acts as a macroTask. The
 * output is 'task is scheduled macroTask, XMLHttpRequest.send, zone'.
 *
 * If you set `__Zone_disable_XHR = true` before importing `zone.js`,
 * `zone.js` does not monkey patch `XMLHttpRequest` APIs and the above onScheduleTask callback
 * will not be called.
 *
 */
__Zone_disable_XHR?: boolean;

/**
 * Disable the monkey patch of the browser geolocation APIs.
 *
 * By default, `zone.js` monkey patches geolocation APIs to make callbacks run in the same zone
 * when those APIs are called.
 *
 * Consider the following examples:
 *
 * ```
 * const zone = Zone.current.fork({
 *   name: 'myZone'
 * });
 *
 * zone.run(() => {
 *   navigator.geolocation.getCurrentPosition(pos => {
 *     console.log('navigator.getCurrentPosition() callback is invoked in the zone',
 *     Zone.current.name);
 *     // output is 'navigator.getCurrentPosition() callback is invoked in the zone myZone'.
 *   }
 * });
 * ```
 *
 * If set you `__Zone_disable_geolocation = true` before importing `zone.js`,
 * `zone.js` does not monkey patch geolocation APIs and the above code
 * outputs 'getCurrentPosition <root>'.
 *
 */
__Zone_disable_geolocation?: boolean;

/**
 * Disable the monkey patch of the browser `canvas` APIs.
 *
 * By default, `zone.js` monkey patches `canvas` APIs to make callbacks run in the same zone when
 * those APIs are called.
 *
 * Consider the following example:
 *
 * ```
 * const zone = Zone.current.fork({
 *   name: 'myZone'
 * });
 *
 * zone.run(() => {
 *   canvas.toBlob(blog => {
 *     console.log('canvas.toBlob() callback is invoked in the zone', Zone.current.name);
 *     // output is 'canvas.toBlob() callback is invoked in the zone myZone'.
 *   }
 * });
 * ```
 *
 * If you set `__Zone_disable_canvas = true` before importing `zone.js`,
 * `zone.js` does not monkey patch `canvas` APIs and the above code
 * outputs 'canvas.toBlob <root>'.
 */
__Zone_disable_canvas?: boolean;

/**
 * Disable the `Promise` monkey patch.
 *
 * By default, `zone.js` monkey patches `Promise` APIs to make the `then()/catch()` callbacks in
 * the same zone when those callbacks are called.
 *
 * Consider the following examples:
 *
 * ```
 * const zone = Zone.current.fork({name: 'myZone'});
 *
 * const p = Promise.resolve(1);
 *
 * zone.run(() => {
 *   p.then(() => {
 *     console.log('then() callback is invoked in the zone', Zone.current.name);
 *     // output is 'then() callback is invoked in the zone myZone'.
 *   });
 * });
 * ```
 *
 * If you set `__Zone_disable_ZoneAwarePromise = true` before importing `zone.js`,
 * `zone.js` does not monkey patch `Promise` APIs and the above code
 * outputs 'promise then callback <root>'.
 */
__Zone_disable_ZoneAwarePromise?: boolean;

/**
 * Define event names that users don't want monkey patched by the `zone.js`.
 *
 * By default, `zone.js` monkey patches EventTarget.addEventListener(). The event listener
 * callback runs in the same zone when the addEventListener() is called.
 *
 * Sometimes, you don't want all of the event names used in this patched version because it
 * impacts performance. For example, you might want `scroll` or `mousemove` event listeners to run
 * the native `addEventListener()` for better performance.
 *
 * Users can achieve this goal by defining `__zone_symbol__UNPATCHED_EVENTS = ['scroll',
 * 'mousemove'];` before importing `zone.js`.
 */
__zone_symbol__UNPATCHED_EVENTS?: string[];

/**
 * Define the event names of the passive listeners.
 *
 * To add passive event listeners, you can use `elem.addEventListener('scroll', listener,
 * {passive: true});` or implement your own `EventManagerPlugin`.
 *
 * You can also define a global variable as follows:
 *
 * ```
 * __zone_symbol__PASSIVE_EVENTS = ['scroll'];
 * ```
 *
 * The preceding code makes all scroll event listeners passive.
 */
__zone_symbol__PASSIVE_EVENTS?: string[];

/**
 * Disable wrapping uncaught promise rejection.
 *
 * By default, `zone.js` wraps the uncaught promise rejection in a new `Error` object
 * which contains additional information such as a value of the rejection and a stack trace.
 *
 * If you set `__zone_symbol__DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION = true;` before
 * importing `zone.js`, `zone.js` will not wrap the uncaught promise rejection.
 */
__zone_symbol__DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION?: boolean;
}

/**
* Interface of `zone-testing.js` test configurations.
*
* You can define the following configurations on the `window` or `global` object before
* importing `zone-testing.js` to change `zone-testing.js` default behaviors in the test runner.
*/
interface ZoneTestConfigurations {
/**
 * Disable the Jasmine integration.
 *
 * In the `zone-testing.js` bundle, by default, `zone-testing.js` monkey patches Jasmine APIs
 * to make Jasmine APIs run in specified zone.
 *
 * 1. Make the `describe()`/`xdescribe()`/`fdescribe()` methods run in the syncTestZone.
 * 2. Make the `it()`/`xit()`/`fit()`/`beforeEach()`/`afterEach()`/`beforeAll()`/`afterAll()`
 * methods run in the ProxyZone.
 *
 * With this patch, `async()`/`fakeAsync()` can work with the Jasmine runner.
 *
 * If you set `__Zone_disable_jasmine = true` before importing `zone-testing.js`,
 * `zone-testing.js` does not monkey patch the jasmine APIs and the `async()`/`fakeAsync()` cannot
 * work with the Jasmine runner any longer.
 */
__Zone_disable_jasmine?: boolean;

/**
 * Disable the Mocha integration.
 *
 * In the `zone-testing.js` bundle, by default, `zone-testing.js` monkey patches the Mocha APIs
 * to make Mocha APIs run in the specified zone.
 *
 * 1. Make the `describe()`/`xdescribe()`/`fdescribe()` methods run in the syncTestZone.
 * 2. Make the `it()`/`xit()`/`fit()`/`beforeEach()`/`afterEach()`/`beforeAll()`/`afterAll()`
 * methods run in the ProxyZone.
 *
 * With this patch, `async()`/`fakeAsync()` can work with the Mocha runner.
 *
 * If you set `__Zone_disable_mocha = true` before importing `zone-testing.js`,
 * `zone-testing.js` does not monkey patch the Mocha APIs and the `async()/`fakeAsync()` can not
 * work with the Mocha runner any longer.
 */
__Zone_disable_mocha?: boolean;

/**
 * Disable the Jest integration.
 *
 * In the `zone-testing.js` bundle, by default, `zone-testing.js` monkey patches Jest APIs
 * to make Jest APIs run in the specified zone.
 *
 * 1. Make the `describe()`/`xdescribe()`/`fdescribe()` methods run in the syncTestZone.
 * 2. Make the `it()`/`xit()`/`fit()`/`beforeEach()`/`afterEach()`/`before()`/`after()` methods
 * run in the ProxyZone.
 *
 * With this patch, `async()`/`fakeAsync()` can work with the Jest runner.
 *
 * If you set `__Zone_disable_jest = true` before importing `zone-testing.js`,
 * `zone-testing.js` does not monkey patch the jest APIs and `async()`/`fakeAsync()` cannot
 * work with the Jest runner any longer.
 */
__Zone_disable_jest?: boolean;

/**
 * Disable monkey patch the jasmine clock APIs.
 *
 * By default, `zone-testing.js` monkey patches the `jasmine.clock()` API,
 * so the `jasmine.clock()` can work with the `fakeAsync()/tick()` API.
 *
 * Consider the following example:
 *
 * ```
 * describe('jasmine.clock integration', () => {
 *   beforeEach(() => {
 *     jasmine.clock().install();
 *   });
 *   afterEach(() => {
 *     jasmine.clock().uninstall();
 *   });
 *   it('fakeAsync test', fakeAsync(() => {
 *     setTimeout(spy, 100);
 *     expect(spy).not.toHaveBeenCalled();
 *     jasmine.clock().tick(100);
 *     expect(spy).toHaveBeenCalled();
 *   }));
 * });
 * ```
 *
 * In the `fakeAsync()` method, `jasmine.clock().tick()` works just like `tick()`.
 *
 * If you set `__zone_symbol__fakeAsyncDisablePatchingClock = true` before importing
 * `zone-testing.js`,`zone-testing.js` does not monkey patch the `jasmine.clock()` APIs and the
 * `jasmine.clock()` cannot work with `fakeAsync()` any longer.
 */
__zone_symbol__fakeAsyncDisablePatchingClock?: boolean;

/**
 * Enable auto running into `fakeAsync()` when installing the `jasmine.clock()`.
 *
 * By default, `zone-testing.js` does not automatically run into `fakeAsync()`
 * if the `jasmine.clock().install()` is called.
 *
 * Consider the following example:
 *
 * ```
 * describe('jasmine.clock integration', () => {
 *   beforeEach(() => {
 *     jasmine.clock().install();
 *   });
 *   afterEach(() => {
 *     jasmine.clock().uninstall();
 *   });
 *   it('fakeAsync test', fakeAsync(() => {
 *     setTimeout(spy, 100);
 *     expect(spy).not.toHaveBeenCalled();
 *     jasmine.clock().tick(100);
 *     expect(spy).toHaveBeenCalled();
 *   }));
 * });
 * ```
 *
 * You must run `fakeAsync()` to make test cases in the `FakeAsyncTestZone`.
 *
 * If you set `__zone_symbol__fakeAsyncAutoFakeAsyncWhenClockPatched = true` before importing
 * `zone-testing.js`, `zone-testing.js` can run test case automatically in the
 * `FakeAsyncTestZone` without calling the `fakeAsync()`.
 *
 * Consider the following example:
 *
 * ```
 * describe('jasmine.clock integration', () => {
 *   beforeEach(() => {
 *     jasmine.clock().install();
 *   });
 *   afterEach(() => {
 *     jasmine.clock().uninstall();
 *   });
 *   it('fakeAsync test', () => { // here we don't need to call fakeAsync
 *     setTimeout(spy, 100);
 *     expect(spy).not.toHaveBeenCalled();
 *     jasmine.clock().tick(100);
 *     expect(spy).toHaveBeenCalled();
 *   });
 * });
 * ```
 *
 */
__zone_symbol__fakeAsyncAutoFakeAsyncWhenClockPatched?: boolean;

/**
 * Enable waiting for the unresolved promise in the `async()` test.
 *
 * In the `async()` test, `AsyncTestZone` waits for all the asynchronous tasks to finish. By
 * default, if some promises remain unresolved, `AsyncTestZone` does not wait and reports that it
 * received an unexpected result.
 *
 * Consider the following example:
 *
 * ```
 * describe('wait never resolved promise', () => {
 *   it('async with never resolved promise test', async(() => {
 *     const p = new Promise(() => {});
 *     p.then(() => {
 *       // do some expectation.
 *     });
 *   }))
 * });
 * ```
 *
 * By default, this case passes, because the callback of `p.then()` is never called. Because `p`
 * is an unresolved promise, there is no pending asynchronous task, which means the `async()`
 * method does not wait.
 *
 * If you set `__zone_symbol__supportWaitUnResolvedChainedPromise = true`, the above case
 * times out, because `async()` will wait for the unresolved promise.
 */
__zone_symbol__supportWaitUnResolvedChainedPromise?: boolean;
}

/**
* The interface of the `zone.js` runtime configurations.
*
* These configurations can be defined on the `Zone` object after
* importing zone.js to change behaviors. The differences between
* the `ZoneRuntimeConfigurations` and the `ZoneGlobalConfigurations` are,
*
* 1. `ZoneGlobalConfigurations` must be defined on the `global/window` object before importing
* `zone.js`. The value of the configuration cannot be changed at runtime.
*
* 2. `ZoneRuntimeConfigurations` must be defined on the `Zone` object after importing `zone.js`.
* You can change the value of this configuration at runtime.
*
*/
interface ZoneRuntimeConfigurations {
/**
 * Ignore outputting errors to the console when uncaught Promise errors occur.
 *
 * By default, if an uncaught Promise error occurs, `zone.js` outputs the
 * error to the console by calling `console.error()`.
 *
 * If you set `__zone_symbol__ignoreConsoleErrorUncaughtError = true`, `zone.js` does not output
 * the uncaught error to `console.error()`.
 */
__zone_symbol__ignoreConsoleErrorUncaughtError?: boolean;
}



function noop() {
}

/**
 * Schedules tasks so that they are invoked inside the Zone that is passed in the constructor.
 */
// tslint:disable-next-line:class-name
export class ɵZoneScheduler implements SchedulerLike {
  constructor(private zone: any, private delegate: any = queueScheduler) {
  }

  now() {
    return this.delegate.now();
  }

  schedule(work: (this: SchedulerAction<any>, state?: any) => void, delay?: number, state?: any): Subscription {
    const targetZone = this.zone;
    // Wrap the specified work function to make sure that if nested scheduling takes place the
    // work is executed in the correct zone
    const workInZone = function(this: SchedulerAction<any>, state: any) {
      targetZone.runGuarded(() => {
        work.apply(this, [state]);
      });
    };

    // Scheduling itself needs to be run in zone to ensure setInterval calls for async scheduling are done
    // inside the correct zone. This scheduler needs to schedule asynchronously always to ensure that
    // firebase emissions are never synchronous. Specifying a delay causes issues with the queueScheduler delegate.
    return this.delegate.schedule(workInZone, delay, state);
  }
}

class BlockUntilFirstOperator<T> implements Operator<T, T> {
  private task: MacroTask | null = null;

  constructor(private zone: any) {
  }

  call(subscriber: Subscriber<T>, source: Observable<T>): TeardownLogic {
    const unscheduleTask = this.unscheduleTask.bind(this);
    this.task = this.zone.run(() => Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop));

    return source.pipe(
      tap({ next: unscheduleTask, complete: unscheduleTask, error: unscheduleTask })
    ).subscribe(subscriber).add(unscheduleTask);
  }

  private unscheduleTask() {
    // maybe this is a race condition, invoke in a timeout
    // hold for 10ms while I try to figure out what is going on
    setTimeout(() => {
      if (this.task != null && this.task.state === 'scheduled') {
        this.task.invoke();
        this.task = null;
      }
    }, 10);
  }
}

@Injectable({
  providedIn: 'root',
})
// tslint:disable-next-line:class-name
export class ɵAngularFireSchedulers {
  public readonly outsideAngular: ɵZoneScheduler;
  public readonly insideAngular: ɵZoneScheduler;

  constructor(public ngZone: NgZone) {
    this.outsideAngular = ngZone.runOutsideAngular(() => new ɵZoneScheduler(Zone.current));
    this.insideAngular = ngZone.run(() => new ɵZoneScheduler(Zone.current, asyncScheduler));
    globalThis.ɵAngularFireScheduler ||= this;
  }
}

function getSchedulers() {
  const schedulers = globalThis.ɵAngularFireScheduler as ɵAngularFireSchedulers|undefined;
  if (!schedulers) {
    throw new Error(
`Either AngularFireModule has not been provided in your AppModule (this can be done manually or implictly using
provideFirebaseApp) or you're calling an AngularFire method outside of an NgModule (which is not supported).`);
  }
  return schedulers;
}

function runOutsideAngular<T>(fn: (...args: any[]) => T): T {
  return getSchedulers().ngZone.runOutsideAngular(() => fn());
}

function run<T>(fn: (...args: any[]) => T): T {
  return getSchedulers().ngZone.run(() => fn());
}

export function observeOutsideAngular<T>(obs$: Observable<T>): Observable<T> {
  return obs$.pipe(observeOn(getSchedulers().outsideAngular));
}

export function observeInsideAngular<T>(obs$: Observable<T>): Observable<T> {
  return obs$.pipe(observeOn(getSchedulers().insideAngular));
}

export function keepUnstableUntilFirst<T>(obs$: Observable<T>): Observable<T> {
  const scheduler = getSchedulers();
  return ɵkeepUnstableUntilFirstFactory(getSchedulers())(obs$);
}

/**
 * Operator to block the zone until the first value has been emitted or the observable
 * has completed/errored. This is used to make sure that universal waits until the first
 * value from firebase but doesn't block the zone forever since the firebase subscription
 * is still alive.
 */
export function ɵkeepUnstableUntilFirstFactory(schedulers: ɵAngularFireSchedulers) {
  return function keepUnstableUntilFirst<T>(obs$: Observable<T>): Observable<T> {
    obs$ = obs$.lift(
      new BlockUntilFirstOperator(schedulers.ngZone)
    );

    return obs$.pipe(
      // Run the subscribe body outside of Angular (e.g. calling Firebase SDK to add a listener to a change event)
      subscribeOn(schedulers.outsideAngular),
      // Run operators inside the angular zone (e.g. side effects via tap())
      observeOn(schedulers.insideAngular)
      // INVESTIGATE https://github.com/angular/angularfire/pull/2315
      // share()
    );
  };
}

const zoneWrapFn = (it: (...args: any[]) => any, macrotask: MacroTask|undefined) => {
  const _this = this;
  // function() is needed for the arguments object
  // tslint:disable-next-line:only-arrow-functions
  return function() {
    const _arguments = arguments;
    if (macrotask) {
      setTimeout(() => {
        if (macrotask.state === 'scheduled') {
          macrotask.invoke();
        }
      }, 10);
    }
    return run(() => it.apply(_this, _arguments));
  };
};

export const ɵzoneWrap = <T= unknown>(it: T, blockUntilFirst: boolean): T => {
  // function() is needed for the arguments object
  // tslint:disable-next-line:only-arrow-functions
  return function() {
    let macrotask: MacroTask | undefined;
    const _arguments = arguments;
    // if this is a callback function, e.g, onSnapshot, we should create a microtask and invoke it
    // only once one of the callback functions is tripped.
    for (let i = 0; i < arguments.length; i++) {
      if (typeof _arguments[i] === 'function') {
        if (blockUntilFirst) {
          macrotask ||= run(() => Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop));
        }
        // TODO create a microtask to track callback functions
        _arguments[i] = zoneWrapFn(_arguments[i], macrotask);
      }
    }
    const ret = runOutsideAngular(() => (it as any).apply(this, _arguments));
    if (!blockUntilFirst) {
      if (ret instanceof Observable) {
        const schedulers = getSchedulers();
        return ret.pipe(
          subscribeOn(schedulers.outsideAngular),
          observeOn(schedulers.insideAngular),
        );
      } else {
        return run(() => ret);
      }
    }
    if (ret instanceof Observable) {
      return ret.pipe(keepUnstableUntilFirst) as any;
    } else if (ret instanceof Promise) {
      return run(() => new Promise((resolve, reject) => ret.then(it => run(() => resolve(it)), reason => run(() => reject(reason)))));
    } else if (typeof ret === 'function' && macrotask) {
      // Handle unsubscribe
      // function() is needed for the arguments object
      // tslint:disable-next-line:only-arrow-functions
      return function() {
        setTimeout(() => {
          if (macrotask && macrotask.state === 'scheduled') {
            macrotask.invoke();
          }
        }, 10);
        return ret.apply(this, arguments);
      };
    } else {
      // TODO how do we handle storage uploads in Zone? and other stuff with cancel() etc?
      return run(() => ret);
    }
  } as any;
};
