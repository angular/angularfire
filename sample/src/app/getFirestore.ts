import { getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export const firestore = getFirestore();
if (environment.useEmulators) {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
}
