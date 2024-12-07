import { ɵgetAllInstancesOf } from '@angular/fire';
import { DataConnect } from 'firebase/data-connect';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

export { DataConnect };

export const DATA_CONNECT_PROVIDER_NAME = 'data-connect';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataConnectInstances extends Array<DataConnect> {}

export class DataConnectInstances {
  constructor() {
    return ɵgetAllInstancesOf<DataConnect>(DATA_CONNECT_PROVIDER_NAME);
  }
}

export const dataConnectInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<DataConnect>(DATA_CONNECT_PROVIDER_NAME))),
  distinct(),
);
