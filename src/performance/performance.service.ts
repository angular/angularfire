import { Injectable, OnDestroy, ApplicationRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { first, tap } from 'rxjs/operators';

const IS_STABLE_START_MARK = '_isStableStart';
const IS_STABLE_END_MARK = '_isStableEnd';

function markStarts() {
    if (typeof(window) !== "undefined" && window.performance) {
        window.performance.mark(IS_STABLE_START_MARK);
        return true;
    } else {
        return false;
    }
}

const started = markStarts();

@Injectable({
    providedIn: 'any'
})
export class PerformanceMonitoringService implements OnDestroy {

    private disposable: Subscription|undefined;

    constructor(appRef: ApplicationRef) {
        if (started) {
            this.disposable = appRef.isStable.pipe(
                first(it => it),
                tap(() => {
                    window.performance.mark(IS_STABLE_END_MARK);
                    window.performance.measure('isStable', IS_STABLE_START_MARK, IS_STABLE_END_MARK);
                })
            ).subscribe();
        }
    }

    ngOnDestroy() {
        if (this.disposable) { this.disposable.unsubscribe(); }
    }

}