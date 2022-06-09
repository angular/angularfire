
import { connectAuthEmulator, Auth } from '@angular/fire/auth';
import { connectDatabaseEmulator, Database } from '@angular/fire/database';
import { connectFirestoreEmulator, Firestore } from '@angular/fire/firestore';
import { connectFunctionsEmulator, Functions } from '@angular/fire/functions';
import { connectStorageEmulator, Storage } from '@angular/fire/storage';

export const connectAuthEmulatorInDevMode = (auth: Auth) =>
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

export const connectFirestoreEmulatorInDevMode = (firestore: Firestore) =>
    connectFirestoreEmulator(firestore, 'localhost', 8080);

export const connectStorageEmulatorInDevMode = (storage: Storage) =>
    connectStorageEmulator(storage, 'localhost', 9199);

export const connectFunctionsEmulatorInDevMode = (functions: Functions) =>
    connectFunctionsEmulator(functions, 'localhost', 5001);

export const connectDatabaseEmulatorInDevMode = (database: Database) =>
    connectDatabaseEmulator(database, 'localhost', 9000);
