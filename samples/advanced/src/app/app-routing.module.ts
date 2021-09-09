import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, outlet: 'primary', pathMatch: 'prefix' },
  { path: 'foo', component: HomeComponent, outlet: 'primary', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./login/login.module').then(m => m.LoginModule) },
];

// Handle index.html request on Cloud Functions
if (typeof process !== 'undefined' && process.env?.FUNCTION_NAME) {
  routes.push({ path: 'index.html', component: HomeComponent, outlet: 'primary', pathMatch: 'full' });
}


@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
