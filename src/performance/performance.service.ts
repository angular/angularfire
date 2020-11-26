import { ApplicationRef, Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first, tap } from 'rxjs/operators';

const IS_STABLE_START_MARK = 'Zone'; // use Zone.js's mark
const IS_STABLE_END_MARK = '_isStableEnd';
const PREBOOT_COMPLETE_END_MARK = '_prebootComplete';

function markStarts() {
    if (typeof(window) !== 'undefined' && window.performance) {
        return true;
    } else {
        return false;
    }
}

const started = markStarts();

@Injectable()
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

            window.document.addEventListener('PrebootComplete', () => {
                window.performance.mark(PREBOOT_COMPLETE_END_MARK);
                window.performance.measure('prebootComplete', IS_STABLE_START_MARK, PREBOOT_COMPLETE_END_MARK);
            });
        }

    }

    ngOnDestroy() {
        if (this.disposable) { this.disposable.unsubscribe(); }
    }

}
