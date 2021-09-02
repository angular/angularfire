import { ref, getStorage, connectStorageEmulator, getDownloadURL } from '@angular/fire/storage';
import { environment } from '../../environments/environment';

export const storage = getStorage();
if (environment.useEmulators) {
    connectStorageEmulator(storage, 'localhost', 9199);
}

const icon = ref(storage, 'google-g.png');

export const iconUrl = getDownloadURL(icon);
