import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, NgModule, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { AngularFireStorage, ref } from '../storage';

/** to be used with in combination with | async */
@Pipe({
  name: 'getDownloadURL',
  pure: false,
})
export class GetDownloadURLPipe implements PipeTransform, OnDestroy {

  private asyncPipe: AsyncPipe;
  private path: string;
  private downloadUrl$: Observable<any>;

  constructor(private storage: AngularFireStorage, cdr: ChangeDetectorRef) {
    this.asyncPipe = new AsyncPipe(cdr);
  }

  transform(path: string) {
    if (path !== this.path) {
      this.path = path;
      this.downloadUrl$ = ref(this.storage, path).getDownloadURL();
    }
    return this.asyncPipe.transform(this.downloadUrl$);
  }

  ngOnDestroy() {
    this.asyncPipe.ngOnDestroy();
  }

}

@NgModule({
  declarations: [ GetDownloadURLPipe ],
  exports: [ GetDownloadURLPipe ],
})
export class GetDownloadURLPipeModule {}
