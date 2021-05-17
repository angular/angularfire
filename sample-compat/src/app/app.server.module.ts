import { isDevMode, NgModule } from '@angular/core';
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
    { provide: APP_BASE_HREF, useFactory: () => isDevMode() ? '/us-central1/ssr' : '/ssr' },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
