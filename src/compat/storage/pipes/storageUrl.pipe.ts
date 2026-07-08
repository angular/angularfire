import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, NgModule, OnDestroy, Optional, Pipe, PipeTransform, TransferState, makeStateKey } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AngularFireStorage } from '../storage';

/** to be used with in combination with | async */
@Pipe({
  name: 'getDownloadURL',
  pure: false,
})
export class GetDownloadURLPipe implements PipeTransform, OnDestroy {

  private asyncPipe: AsyncPipe;
  private path: string;
  private downloadUrl$: Observable<any>;

  constructor(
    private storage: AngularFireStorage,
    cdr: ChangeDetectorRef,
    @Optional() private state: TransferState
  ) {
    this.asyncPipe = new AsyncPipe(cdr);
  }

  transform(path: string) {
    if (path !== this.path) {
      this.path = path;
      const key = makeStateKey<string>(`|getDownloadURL|${path}`);
      const existing = this.state?.get(key, undefined);
      this.downloadUrl$ = existing ? of(existing) : this.storage.ref(path).getDownloadURL().pipe(
        tap(it => this.state?.set(key, it))
      );
    }
    return this.asyncPipe.transform(this.downloadUrl$);
  }

  ngOnDestroy() {
    this.asyncPipe.ngOnDestroy();
  }

}

@NgModule({
  imports: [ GetDownloadURLPipe ],
  exports: [ GetDownloadURLPipe ],
})
export class GetDownloadURLPipeModule {}
