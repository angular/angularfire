import { Observable } from 'rxjs';
import { from } from 'rxjs/observable/from';
import { FirebaseMessaging } from '@firebase/messaging-types';

export function requestPermission(messaging: FirebaseMessaging): Observable<void> {
  return from(messaging.requestPermission()!);
}
