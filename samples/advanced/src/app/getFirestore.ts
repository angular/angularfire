import { getFirestore, connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export const firestore = getFirestore();
if (environment.useEmulators) {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
}

const isNode = () => !!(typeof process !== 'undefined' && process.versions?.node);

export const persistenceEnabled = isNode() ?
    Promise.resolve(false) :
    enableMultiTabIndexedDbPersistence(firestore).then(() => true, () => false);
