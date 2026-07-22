import {
  AsyncPipe,
  isPlatformBrowser,
  isPlatformServer,
} from '@angular/common';
import {
  Component,
  type OnDestroy,
  PLATFORM_ID,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core';
import { ɵzoneWrap } from '@angular/fire';
import {
  Auth,
  type User,
  signInAnonymously,
  signOut,
} from '@angular/fire/auth';
import {
  GoogleAuthProvider,
  beforeAuthStateChanged,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithPopup,
} from 'firebase/auth';
import cookies from 'js-cookie';
import { Observable, from } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';

// TODO bring this to RxFire
function _authState(auth: Auth): Observable<User | null> {
  return from(auth.authStateReady()).pipe(
    switchMap(
      () =>
        new Observable<User | null>((subscriber) => {
          const unsubscribe = onAuthStateChanged(
            auth,
            subscriber.next.bind(subscriber),
            subscriber.error.bind(subscriber),
            subscriber.complete.bind(subscriber)
          );
          return { unsubscribe };
        })
    )
  );
}

export const authState = ɵzoneWrap(_authState, true);

@Component({
  selector: 'app-auth',
  template: `
    <p>
      Auth!
      <code>{{ uid | async }}</code>
      @if (showLoginButton | async) {
      <button (click)="loginAnonymously()">Log in anonymously</button>
      <button (click)="loginWithGoogle()">Log in with Google</button>
      } @if (showLogoutButton | async) {
      <button (click)="logout()">Log out</button>
      }
    </p>
  `,
  imports: [AsyncPipe],
})
export class AuthComponent implements OnDestroy {
  private readonly auth = inject(Auth);
  protected readonly authState = authState(this.auth);

  private readonly transferState = inject(TransferState);
  private readonly transferStateKey = makeStateKey<string | undefined>(
    'auth:uid'
  );
  protected readonly uid = this.authState
    .pipe(map((u) => u?.uid))
    .pipe(
      isPlatformServer(inject(PLATFORM_ID))
        ? tap((it) => this.transferState.set(this.transferStateKey, it))
        : this.transferState.hasKey(this.transferStateKey)
        ? startWith(this.transferState.get(this.transferStateKey, undefined))
        : tap()
    );

  protected readonly showLoginButton = this.uid.pipe(map((it) => !it));
  protected readonly showLogoutButton = this.uid.pipe(map((it) => !!it));

  private readonly unsubscribeFromOnIdTokenChanged: (() => void) | undefined;
  private readonly unsubscribeFromBeforeAuthStateChanged:
    | (() => void)
    | undefined;

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.unsubscribeFromOnIdTokenChanged = onIdTokenChanged(
        this.auth,
        async (user) => {
          if (user) {
            const idToken = await user.getIdToken();
            cookies.set('__session', idToken);
          } else {
            cookies.remove('__session');
          }
        }
      );

      let priorCookieValue: string | undefined;
      this.unsubscribeFromBeforeAuthStateChanged = beforeAuthStateChanged(
        this.auth,
        async (user) => {
          priorCookieValue = cookies.get('__session');
          const idToken = await user?.getIdToken();
          if (idToken) {
            cookies.set('__session', idToken);
          } else {
            cookies.remove('__session');
          }
        },
        async () => {
          // If another beforeAuthStateChanged rejects, revert the cookie (best-effort)
          if (priorCookieValue) {
            cookies.set('__session', priorCookieValue);
          } else {
            cookies.remove('__session');
          }
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeFromBeforeAuthStateChanged?.();
    this.unsubscribeFromOnIdTokenChanged?.();
  }

  async logout() {
    return await signOut(this.auth);
  }

  async loginAnonymously() {
    return await signInAnonymously(this.auth);
  }

  async loginWithGoogle() {
    return await signInWithPopup(this.auth, new GoogleAuthProvider());
  }
}
