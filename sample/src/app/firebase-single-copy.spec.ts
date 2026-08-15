import { Timestamp as angularFireTimestamp } from '@angular/fire/firestore';
import { Timestamp as firebaseTimestamp } from 'firebase/firestore';

describe('firebase installation', () => {
  /* Fails when 2 firebase copies exist, which occurs when the sample app's
   * and the @angular/fire root's firebase declarations diverge. */
  it('resolves the app and @angular/fire to the same firebase copy', () => {
    expect(angularFireTimestamp).toBe(firebaseTimestamp);
  });
});
