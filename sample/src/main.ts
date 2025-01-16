import { bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.client';
import { AppComponent } from './app/app.component';
import { setLogLevel, LogLevel } from "@angular/fire";

setLogLevel(LogLevel.VERBOSE);

bootstrapApplication(AppComponent, config)
  .catch((err) => console.error(err));
