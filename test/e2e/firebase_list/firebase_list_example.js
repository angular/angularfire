var angular = require('angular2/core');
var browser = require('angular2/platform/browser');

var App = angular.Component({
  template: '<h1>Hello</h1>',
  selector: 'app'
})(function() {
})

browser.bootstrap(App);
