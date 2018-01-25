import { InjectionToken } from '@angular/core';

/**
 * The value of this token determines whether or not the firestore will have persistance enabled
 */
export const EnablePersistenceToken = new InjectionToken<boolean>('EnablePersistenceToken');
