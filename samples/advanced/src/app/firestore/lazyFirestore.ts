import { docData, doc } from '@angular/fire/firestore';
import { firestore, persistenceEnabled } from '../getFirestore';

const ref = doc(firestore, 'test/1');

export const valueChanges = docData(ref);

export { persistenceEnabled };
