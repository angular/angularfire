import { NgModule } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { APP_BASE_HREF } from '@angular/common';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ServerTransferStateModule
  ],
  providers: [
    { provide: APP_BASE_HREF, useFactory: () => process.env.FUNCTIONS_EMULATOR === 'true' ? '/aftest-94085/us-central1/ssr' : '/ssr' },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
