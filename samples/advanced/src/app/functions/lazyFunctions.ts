import { getFunctions, httpsCallableData } from '@angular/fire/functions';
import { connectFunctionsEmulatorInDevMode } from '../emulators';

const functions = getFunctions();
connectFunctionsEmulatorInDevMode(functions);

export const yadaFunction = httpsCallableData(functions, 'yada', { timeout: 3_000 });
