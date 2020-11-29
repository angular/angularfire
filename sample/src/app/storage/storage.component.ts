import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-storage',
  template: `
    <p>
      Storage!
      <img [src]="'google-g.png' | getDownloadURL" loading="lazy" width="64" height="64" />
    </p>
  `,
  styles: []
})
export class StorageComponent implements OnInit {


  constructor() {
  }

  ngOnInit(): void {
  }

}
