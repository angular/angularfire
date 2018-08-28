# Prerendering your Universal application

`static.paths.js`:

```js
export default [
    '/',
    '/another_path',
    '/yet_another_path',
    // ... etc.
];
```

```bash
npm i --save-dev mkdir-recursive
```

Add the following to your `server.ts`:

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

Let's make some modifications to our `package.json`, to prerender your content:

```js
"scripts": {
  // ... omitted
  "build": "ng build && npm run copy:hosting && npm run build:functions && npm run prerender:ssr",
  "prerender:ssr": "PRERENDER=1 node dist/YOUR_PROJECT_NAME-webpack/server.js",
},
```

Now when you run `npm run build` you should see prerendered content in your `/public` directory, ready for deployment on Firebase Hosting.

`firebase serve`, `firebase deploy`