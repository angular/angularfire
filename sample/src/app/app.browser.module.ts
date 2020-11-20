import { NgModule } from '@angular/core';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { AngularFirestoreModule } from '@angular/fire/firestore';

@NgModule({
  imports: [
    AppModule,
    AngularFirestoreModule.enablePersistence({
        synchronizeTabs: true,
        experimentalForceOwningTab: true
    })
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
