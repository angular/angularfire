# Step 1: install this plugin: 
```
ionic cordova plugin add cordova-universal-links-plugin
ionic cordova plugin add cordova-plugin-buildinfo
ionic cordova plugin add cordova-plugin-browsertab
ionic cordova plugin add cordova-plugin-inappbrowser
(for ios)
ionic cordova plugin add cordova-plugin-customurlscheme 
```

# Step 2: Add Firebase to your Ionic

 **Install firebase to angular project**

Follow [this tutorial](https://github.com/angular/angularfire2/blob/master/docs/install-and-setup.md) to make a basic setup for your Ionic project.

 **To set up in an Android app** 

Go to [Firebase console](https://console.firebase.google.com/) then click **Add Firebase to your Android app** and follow the setup steps.


# Step 3: Set up Firebase Authentication for Cordova ( summary from [firebase instruction](https://firebase.google.com/docs/auth/web/cordova))

 **Setup Dynamic Link**
 In the Firebase console, open the **Dynamic Links** section at bottom left panel, setup by their instruction

 **Add dynamic link**
 *Add this to config.xml at root level of project:*
```xml
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

  *Make sure your `<widget id="com.yourandroid.id" ... >` the same with android app's id you 
  added in firebase*

# Step 4: Add login code:
at `login.service.ts` add this function: 
```ts

import { AngularFireAuth } from 'angularfire2/auth';
import firebase from 'firebase/app';
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

# Common problems

If you got error when build code like this:
`UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): TypeError: Cannot read property 'manifest' of undefined`

Please, using this fix from [issue](https://github.com/nordnet/cordova-universal-links-plugin/issues/134):
> Making this change in 'cordova-universal-links-plugin/hooks/lib/android/manifestWriter.js' fixed this issue for me:
> [b2c5784#diff-d5955d9f4d88b42e5efd7a3385be79e9](https://github.com/nordnet/cordova-universal-links-plugin/commit/b2c5784764225319648e26aa5d3f42ede6d1b289#diff-d5955d9f4d88b42e5efd7a3385be79e9)
