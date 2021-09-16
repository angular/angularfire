---
title: Prerendering
eleventyNavigation:
  key: Prerendering
  parent: Universal
---

## Prerendering Universal sites

Prerendering a Universal application allows us to generate the HTML before the user requests it; increasing performance and decreasing cost. Let's configure your application to prerender and staticly serve it's most commonly accessed routes on Firebase Hosting.

First create a `static.paths.js` in your project root, which lists the URLs you'd want to prerender:

```js
export default [
  '/',
  '/another_path',
  '/yet_another_path'
];
```

Install `mkdir-recursive` to make the next step a little easier:

```bash
npm i --save-dev mkdir-recursive
```

Now replace the listener in your `server.ts` with the following:

```ts
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { renderModuleFactory } from '@angular/platform-server';
import { mkdirSync } from 'mkdir-recursive';

if (process.env.PRERENDER) {

    const routes = require('./static.paths').default;
    Promise.all(
        routes.map(route =>
            renderModuleFactory(AppServerModuleNgFactory, {
                document: template,
                url: route,
                extraProviders: [
                    provideModuleMap(LAZY_MODULE_MAP)
                ]
            }).then(html => [route, html])
        )
    ).then(results => {
        results.forEach(([route, html]) => {
            const fullPath = join('./public', route);
            if (!existsSync(fullPath)) { mkdirSync(fullPath); }
            writeFileSync(join(fullPath, 'index.html'), html);
        });
        process.exit();
    });

} else if (!process.env.FUNCTION_NAME) {

    // If we're not in the Cloud Functions environment, spin up a Node server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Node server listening on http://localhost:${PORT}`);
    });

}
```

Now if the `PRERENDER` environment variable is passed any value, instead of serving your application it will iterate over the paths in `static.paths.js`, render them, and write them to your `public` directory. *You could always make this a seperate script.*

Finally make some modifications to your `package.json`, to prerender your content when you build:

```js
"scripts": {
  // ... omitted
  "build": "ng build && npm run copy:hosting && npm run build:functions && npm run prerender:ssr",
  "prerender:ssr": "PRERENDER=1 node dist/YOUR_PROJECT_NAME-webpack/server.js",
},
```

Now when you run `npm run build` the prerendered content should be available in your `/public` directory, ready for deployment on Firebase Hosting.
