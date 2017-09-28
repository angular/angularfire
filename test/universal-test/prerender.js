require('zone.js/dist/zone-node');
const { renderModuleFactory } = require('@angular/platform-server');
const fs = require('fs');

const { AppServerModuleNgFactory } = require(`./dist-server/main.bundle`);
const index = require('fs').readFileSync('./src/index.html', 'utf8');

let renderComplete = false;
setTimeout(() => {
  if(!renderComplete){
    throw new Error('universal app took toolong to render, it probably didnt clsoe the connection in time');
  }
}, 5000);
console.log('starting bootstrap...');
renderModuleFactory(AppServerModuleNgFactory, {
  document: index,
  url: '/'
})
.then(html => {
  console.log('bootstrap done');
  renderComplete = true;
  fs.writeFileSync('./dist-server/index.html', html)
});
