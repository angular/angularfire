import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
@Component({
  selector: 'app-root',
  template: `
    <h1>
      Welcome to {{title}}!!
    </h1>
  `,
  styles: []
})
export class AppComponent {
  title = 'Universal Test'
  constructor(
    private afDb: AngularFireDatabase
  ){

  }
}
