import { JsonPipe } from '@angular/common';
import { afterNextRender, Component, inject, signal } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { connectFunctionsEmulator, getFunctions, httpsCallableData } from '@angular/fire/functions';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-functions',
  template: `
    <p>
      Functions!
      <code>{{ response() | json }}</code>
      <button (click)="request()">Call!</button>
    </p>
  `,
  imports: [JsonPipe]
})
export class FunctionsComponent {

  private readonly functions = getFunctions(inject(FirebaseApp));

  protected readonly response = signal<unknown>(undefined);
  private readonly yadaFunction = httpsCallableData(this.functions, 'yada', { timeout: 3_000 });

  async request() {
    this.yadaFunction({}).subscribe({
      next: (next) => this.response.set(next),
      error: (error) => this.response.set(error),
    });
  }

  protected readonly className = signal("is-deferred");

  constructor() {
    if (environment.emulatorPorts?.functions) {
      connectFunctionsEmulator(this.functions, "localhost", environment.emulatorPorts.functions);
    }

    afterNextRender(() => {
      if (this.className) this.className.set("");
    });
  }

}
