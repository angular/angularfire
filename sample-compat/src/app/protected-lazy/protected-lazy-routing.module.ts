import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProtectedLazyComponent } from './protected-lazy.component';

const routes: Routes = [
  { path: '', component: ProtectedLazyComponent },
  { path: 'asdf', component: ProtectedLazyComponent },
  { path: ':id/bob', component: ProtectedLazyComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProtectedLazyRoutingModule { }
