import {OpaqueToken} from '@angular/core';

export const FirebaseConfig = new OpaqueToken('FirebaseUrl');
export const FirebaseApp = new OpaqueToken('FirebaseApp')
export const FirebaseAuthConfig = new OpaqueToken('FirebaseAuthConfig');
// TODO: Deprecate
export const FirebaseRef = FirebaseApp;
export const FirebaseUrl = FirebaseConfig;
