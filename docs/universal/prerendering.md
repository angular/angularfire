# Prerendering your Universal application for Firebase Hosting

`static.paths.js`:

```js
export default [
    'index.html',
    'ANOTHER_PATH',
    'ANOTHER_PATH',
    // ... etc.
];
```

Add the following to your `server.ts`:

```ts
import ROUTES from './static.paths';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { renderModuleFactory } from '@angular/platform-server';

if (PRERENDER) {

    Promise.all(
        ROUTES.map(route =>
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
            const fullPath = join('../../public', route);
            if (!existsSync(fullPath)) { mkdirSync(fullPath) }
            writeFileSync(join(fullPath, 'index.html'), html);
        });
        process.exit();
    });

} else if (!CLOUD_FUNCTIONS) {

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
  "build:ssr": "ng build --prod && npm run build:hosting && npm run build:functions",
  "build:hosting": "npm run copy:hosting && PRERENDER=1 node dist/YOUR_PROJECT_NAME/server.js",
},
```