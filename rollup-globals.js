export default (mod) => {
  if (mod === 'rxjs') return 'Rx';
  if (mod.indexOf('rxjs/operator') === 0) return `Rx.Observable.prototype`;
  if (mod.indexOf('rxjs/observable') === 0) return `Rx.Observable`;
  if (mod === 'rxjs/scheduler/queue') return 'Rx.Scheduler';
  if (mod.indexOf('rxjs/') === 0) return 'Rx';

  if (mod === 'firebase') return 'firebase';
  if (mod === '@angular/core') return 'ng.core';
  if (mod === '@angular/core/testing') return 'ng.core.testing';
}
