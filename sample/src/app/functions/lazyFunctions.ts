import { connectFunctionsEmulator, getFunctions, httpsCallableData } from '@angular/fire/functions';
import { environment } from '../../environments/environment';

const functions = getFunctions();
if (environment.useEmulators) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
}

export const yadaFunction = httpsCallableData(functions, 'yada', { timeout: 3_000 });
