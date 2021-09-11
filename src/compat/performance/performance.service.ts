import { ApplicationRef, Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { first, tap } from 'rxjs/operators';

const IS_STABLE_START_MARK = 'Zone';
const IS_STABLE_END_MARK = '_isStableEnd';

@Injectable()
export class PerformanceMonitoringService implements OnDestroy {

    private disposable: Subscription|undefined;

    constructor(appRef: ApplicationRef) {
        if (typeof window !== 'undefined' && window.performance?.mark) {
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
