<a name="2.0.0-beta.1"></a>
# 2.0.0-beta.1 (2016-05-10)

### Known Issues

Queried lists do not have their operators attached. [See issue 162 for details.](https://github.com/angular/angularfire2/issues/162)

### Breaking changes

- Removed `af.list()`, use `af.database.object()`.
- Removed `af.object()`, use `af.database.object()`.

### Bug Fixes

* **objects:** Unwraps snapshots for FirebaseObjectFactory. ([163](https://github.com/angular/angularfire2/pull/163))

### Features

* **documentation:** Adds documentation on how to use system-config.ts. ([0239ceb](https://github.com/angular/angularfire2/pull/163/commits/0239ceb5722ea118d0c34c584714f8ca5690a48f))