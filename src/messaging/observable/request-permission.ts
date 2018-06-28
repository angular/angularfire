import { Observable, from } from 'rxjs';
import { messaging } from 'firebase';

export function requestPermission(messaging: messaging.Messaging): Observable<void> {
  return from(messaging.requestPermission()!);
}
