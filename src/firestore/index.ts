// DO NOT MODIFY. This entry point is intended only for the side-effect import
// for firebase/firestore, it's here so Firestore variants can be used in other
// entry points. Ensure all APIs are exported on ./public_api as that's what
// the other entry points reexport.

import 'firebase/firestore';

export * from './public_api';
export * from './firestore.module';
