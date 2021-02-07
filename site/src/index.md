---
layout: default.njk
eleventyNavigation:
  key: Home
  order: 0
---

{% headingone %}AngularFire{% endheadingone %}

{% subheading %}The official library for Angular and Firebase{% endsubheading %}

<div class="mb-24">
  {%- linkbutton "/get-started/quick-start" %}
    Get started
  {%- endlinkbutton %}
  {%- linkbutton "https://github.com/angular/fire", "secondary", true %}
    GitHub
  {%- endlinkbutton %}
</div>

## What is AngularFire?

AngularFire smooths over the rough edges an Angular developer might encounter when implementing the framework-agnostic Firebase JS SDK & aims to provide a more natural developer experience by conforming to Angular conventions.

### Dependency injection
Provide and Inject Firebase services in your components

### Zone.js wrappers
Stable zones allow proper functionality of service workers, forms, SSR, and pre-rendering

### Observable based
Utilize RxJS rather than callbacks for realtime streams

### NgRx friendly API
Integrate with NgRx using AngularFire's action based APIs.

### Lazy-loading
AngularFire dynamically imports much of Firebase, reducing time to load your app

### Deploy schematics
Get your Angular application deployed on Firebase Hosting with a single command

### Google Analytics
Zero-effort Angular Router awareness in Google Analytics

### Router Guards
Guard your Angular routes with built-in Firebase Authentication checks
