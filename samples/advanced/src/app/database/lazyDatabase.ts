import { getDatabase, connectDatabaseEmulator, ref, objectVal } from '@angular/fire/database';

import { environment } from '../../environments/environment';

const database = getDatabase();
if (environment.useEmulators) {
    connectDatabaseEmulator(database, 'localhost', 9000);
}

const doc = ref(database, 'test');
export const valueChanges = objectVal(doc);
