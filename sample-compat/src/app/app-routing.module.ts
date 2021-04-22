import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { AngularFireAuthGuard, canActivate, isNotAnonymous } from '@angular/fire/auth-guard';
import { SecondaryComponent } from './secondary/secondary.component';

const routes: Routes = [
  { path: '', component: HomeComponent, outlet: 'primary', pathMatch: 'prefix' },
  { path: '', component: SecondaryComponent, outlet: 'secondary', pathMatch: 'prefix' },
  { path: '', component: SecondaryComponent, outlet: 'tertiary', pathMatch: 'prefix' },
  { path: 'protected', component: ProtectedComponent, canActivate: [AngularFireAuthGuard] },
  { path: 'lazy', loadChildren: () => import('./protected-lazy/protected-lazy.module').then(m => m.ProtectedLazyModule) },
  { path: 'protected-lazy',
    loadChildren: () => import('./protected-lazy/protected-lazy.module').then(m => m.ProtectedLazyModule),
    canActivate: [AngularFireAuthGuard] },
  { path: 'protected', component: ProtectedComponent, canActivate: [AngularFireAuthGuard], outlet: 'secondary' },
  { path: 'protected', component: ProtectedComponent, canActivate: [AngularFireAuthGuard], outlet: 'tertiary' },
  { path: 'protected-lazy',
    loadChildren: () => import('./protected-lazy/protected-lazy.module').then(m => m.ProtectedLazyModule),
    ...canActivate(() => isNotAnonymous),
    outlet: 'secondary' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled',
    relativeLinkResolution: 'legacy'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
