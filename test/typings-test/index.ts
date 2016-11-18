/**
 * This file just imports from a path that was previously known to having
 * typings errors because it relied on an ambient namespace for firebase,
 * which wouldn't necessarily have been loaded.
 */

import {FirebaseSdkAuthBackend} from 'angularfire2/auth/firebase_sdk_auth_backend';

const Backend = FirebaseSdkAuthBackend;
