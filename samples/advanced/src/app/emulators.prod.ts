
import { Auth } from '@angular/fire/auth';
import { Database } from '@angular/fire/database';
import { Firestore } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { Storage } from '@angular/fire/storage';

export const connectAuthEmulatorInDevMode = (_: Auth) => {};
export const connectFirestoreEmulatorInDevMode = (_: Firestore) => {};
export const connectStorageEmulatorInDevMode = (_: Storage) => {};
export const connectFunctionsEmulatorInDevMode = (_: Functions) => {};
export const connectDatabaseEmulatorInDevMode = (_: Database) => {};
