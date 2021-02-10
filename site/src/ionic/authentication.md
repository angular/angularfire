---
title: Authentication
eleventyNavigation:
  key: Authentication
  parent: Ionic
---

## Setting up Ionic and Firebase Auth

First start out by installing the needed plugins below.
 
```
ionic cordova plugin add cordova-universal-links-plugin
ionic cordova plugin add cordova-plugin-buildinfo
ionic cordova plugin add cordova-plugin-browsertab
ionic cordova plugin add cordova-plugin-inappbrowser
(for ios)
ionic cordova plugin add cordova-plugin-customurlscheme 
```

## Add Firebase to your Ionic app

Follow [this tutorial](https://github.com/angular/angularfire2/blob/master/docs/install-and-setup.md) to make a basic setup for your Ionic project.

### To set up in an Android app

Go to [Firebase console](https://console.firebase.google.com/) then click *Add Firebase to your Android app* and follow the setup steps.

## Set up Firebase Authentication for Cordova

*This is a summary from the [Firebase instructions](https://firebase.google.com/docs/auth/web/cordova).*

### Setup Dynamic Link
In the Firebase console, open the *Dynamic Links* section at bottom left panel, setup by their instruction

Add this to config.xml at root level of project:

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
Make sure your `<widget id="com.yourandroid.id" ... >` the same with Android app's id you added in Firebase.

## Add login code

In `login.service.ts` add this function: 

```ts

import { AngularFireAuth } from '@angular/fire/auth';
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
		console.log('Sign in with Facebook');
		return this.oauthSignIn(new firebase.auth.FacebookAuthProvider());
	}

  signInWithGoogle() {
		console.log('Sign in with Google');
		return this.oauthSignIn(new firebase.auth.GoogleAuthProvider());
	}

  private oauthSignIn(provider: AuthProvider) {
		if (!(<any>window).cordova) {
			return this.afAuth.auth.signInWithPopup(provider);
		} else {
			return this.afAuth.auth.signInWithRedirect(provider)
			.then(() => {
				return this.afAuth.auth.getRedirectResult().then( result => {
					// This gives you an Access Token. You can use it to access the associated APIs.
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
