import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProtectedLazyRoutingModule } from './protected-lazy-routing.module';
import { ProtectedLazyComponent } from './protected-lazy.component';


@NgModule({
  declarations: [ProtectedLazyComponent],
  imports: [
    CommonModule,
    ProtectedLazyRoutingModule
  ]
})
export class ProtectedLazyModule { }
