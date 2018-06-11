# STEP 1: install this plugin: 
```
1) ionic cordova plugin add cordova-universal-links-plugin
2) ionic cordova plugin add cordova-plugin-buildinfo
3) ionic cordova plugin add cordova-plugin-browsertab
4) ionic cordova plugin add cordova-plugin-inappbrowser
5) ionic cordova plugin add cordova-plugin-customurlscheme (for ios)
```

# STEP 2: Add Firebase to your Ionic

  STEP 2.1:  [setup firebase to angular project] 
  (https://github.com/angular/angularfire2/blob/master/docs/install-and-setup.md)

  STEP 2.2: To set up an Android app, go to [Firebase Console](https://console.firebase.google.com/) then 
  Click **Add Firebase to your Android app** and follow the setup steps.

# STEP 3: Set up Firebase Authentication for Cordova ( sumary from [firebase instruction](https://firebase.google.com/docs/auth/web/cordova))

 STEP 3.1: In the Firebase console, open the **Dynamic Links** section at bottom left panel, setup by they instruction

 STEP 3.2: add this to config.xml at root level of project:
```
     <universal-links>
        <!-- this is dynamic link created in firebase -->
        <host name="zm4e4.app.goo.gl" scheme="https" />
        <!-- this is your firebase app link -->
        <host name="routing-aadd4.firebaseapp.com" scheme="https">
            <path url="/__/auth/callback" />
        </host>
    </universal-links>
    <!-- for android -->
    <preference name="AndroidLaunchMode" value="singleTask" />
```

  STEP 3.3: make sure your `<widget id="com.yourandroid.id" ... >` the same with android app's id you 
  added in firebase at STEP 2.2.

# STEP 4: add login code:
at login.service.ts add this function: 
```
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import AuthProvider = firebase.auth.AuthProvider;

export class AuthService {
        private user: firebase.User;
	constructor(public afAuth: AngularFireAuth) {
		afAuth.authState.subscribe(user => {
			this.user = user;
		});
	}
  
  signInWithFacebook() {
		console.log('Sign in with google');
		return this.oauthSignIn(new firebase.auth.FacebookAuthProvider());
	}

  signInWithGoogle() {
		console.log('Sign in with google');
		return this.oauthSignIn(new firebase.auth.GoogleAuthProvider());
	}

        private oauthSignIn(provider: AuthProvider) {
		if (!(<any>window).cordova) {
			return this.afAuth.auth.signInWithPopup(provider);
		} else {
			return this.afAuth.auth.signInWithRedirect(provider)
			.then(() => {
				return this.afAuth.auth.getRedirectResult().then( result => {
					// This gives you a Google Access Token.
					// You can use it to access the Google API.
					let token = result.credential.accessToken;
					// The signed-in user info.
					let user = result.user;
					console.log(token, user);
				}).catch(function(error) {
					// Handle Errors here.
					alert(error.message);
				});
			});
		}
	}
}
```

# Problem 1: 

if you got error when build code like this:
`UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot read property 'manifest' of undefined`

Please, using this fix from [issue](https://github.com/nordnet/cordova-universal-links-plugin/issues/134):
> Making this change in 'cordova-universal-links-plugin/hooks/lib/android/manifestWriter.js' fixed this issue for me:
> [b2c5784#diff-d5955d9f4d88b42e5efd7a3385be79e9](https://github.com/nordnet/cordova-universal-links-plugin/commit/b2c5784764225319648e26aa5d3f42ede6d1b289#diff-d5955d9f4d88b42e5efd7a3385be79e9)
