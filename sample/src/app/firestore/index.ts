import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export const initializeFirestore$ = new Observable(sub => {
    import('./getFirestore').then(({getFirestore}) => {
        sub.next(getFirestore());
        sub.complete();
    });
}).pipe(
    shareReplay({ refCount: false })
);
