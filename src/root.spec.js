// These paths are written to use the dist build
export * from './packages-dist/angularfire2.spec';
export * from './packages-dist/auth/auth.spec';
export * from './packages-dist/firestore/firestore.spec';
export * from './packages-dist/firestore/document/document.spec';
export * from './packages-dist/firestore/collection/collection.spec';
export * from './packages-dist/functions/functions.spec';
export * from './packages-dist/database/database.spec';
export * from './packages-dist/database/utils.spec';
export * from './packages-dist/database/observable/fromRef.spec';
export * from './packages-dist/database/list/changes.spec';
export * from './packages-dist/database/list/snapshot-changes.spec';
export * from './packages-dist/database/list/state-changes.spec';
export * from './packages-dist/database/list/audit-trail.spec';
export * from './packages-dist/storage/storage.spec';
export * from './packages-dist/schematics/ng-add.spec';
export * from './packages-dist/schematics/deploy/actions.spec';
export * from './packages-dist/schematics/deploy/builder.spec';
//export * from './packages-dist/messaging/messaging.spec';

// // Since this a deprecated API, we run on it on manual tests only
// // It needs a network connection to run which makes it flaky on Travis
// export * from './packages-dist/database-deprecated/firebase_list_factory.spec';
// export * from './packages-dist/database-deprecated/firebase_object_factory.spec';
// export * from './packages-dist/database-deprecated/firebase_list_observable.spec';
// export * from './packages-dist/database-deprecated/firebase_object_observable.spec';
// export * from './packages-dist/database-deprecated/query_observable.spec';
