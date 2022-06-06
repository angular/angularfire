# Contributing to AngularFire

We would love for you to contribute to AngularFire and help make it even better than it is
today! As a contributor, here are the guidelines we would like you to follow:

 - [Code of Conduct](#coc)
 - [Question or Problem?](#question)
 - [Issues and Bugs](#issue)
 - [Feature Requests](#feature)
 - [Initial Setup](#setup)
 - [Submission Guidelines](#submit)
   - [Submitting an Issue](#submit-issue)
   - [Submitting a Pull Request](#submit-pr)
      - [Before you submit](#submit-before)
      - [How to submit](#submit-how)
      - [Deploying docs](#submit-docs)
 - Appendix
   - [Coding Rules][rules] (external link)
   - [Commit Message Guidelines][commit] (external link)
   - [Signing the CLA](#cla)

## <a name="coc"></a> Code of Conduct

Help us keep the Angular and Firebase communities open and inclusive. Please read and follow the Angular [Code of Conduct][coc].

## <a name="question"></a> Got a Question or Problem?

If you have questions about how to *use* AngularFire, please direct them to the [Angular Google Group][angular-group]
discussion list or [StackOverflow][stackoverflow] (include the `firebase` and `angular` tags!). 
Please note that the Angular team's capacity to answer usage questions is limited.
Members of the Firebase team can be reached on [Slack][slack] and via the [Firebase Google Group][firebase-group].

## <a name="issue"></a> Found an Issue?

If you find a bug in the source code, you can help us by
[submitting an issue](#submit-issue) to our [GitHub Repository][github]. Even better, you can
[submit a Pull Request](#submit-pr) with a fix.

## <a name="feature"></a> Want a Feature?

You can *request* a new feature by [submitting an issue](#submit-issue) to our [GitHub
Repository][github]. If you would like to *implement* a new feature, please submit an issue with
a proposal for your work first, to be sure that we can use it.
Please consider what kind of change it is:

* For a **Major Feature**, first open an issue and outline your proposal so that it can be
discussed. This will also allow us to better coordinate our efforts, prevent duplication of work,
and help you to craft the change so that it is successfully accepted into the project.
* **Small Features** can be crafted and directly [submitted as a Pull Request](#submit-pr).

## <a name="setup"></a> Initial Setup

1) Create a fork of AngularFire (See [Forking a Project][github-fork])

2) Clone your fork, CD into the directory, and install dependencies

```shell
$ git clone <your fork SSH/HTTPS from GitHub>
$ cd angularfire
$ yarn
$ yarn build
$ yarn test:all
```

3) Make your changes in a new git branch:

```shell
git checkout -b my-fix-branch master
```

## <a name="submit"></a> Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue
Help us to maximize the effort we can spend improving the product by not reporting duplicate issues.
Search the archives before you submit.

Providing the following information will increase the chances of your issue being dealt with quickly:

* **Overview of the Issue** - if an error is being thrown a non-minified stack trace helps
* **Angular Version** - what version of Angular, Firebase, and AngularFire are you using?
* **Motivation for or Use Case** - explain what are you trying to do and why the current behavior is a bug for you
* **Browsers and Operating System** - is this a problem with all browsers?
* **Reproduce the Error** - provide a live example (using StackBlitz (https://stackblitz.com/edit/angular-fire-start))
 or a unambiguous set of steps
* **Related Issues** - has a similar issue been reported before?
* **Suggest a Fix** - if you can't fix the bug yourself, perhaps you can point to what might be
  causing the problem (line of code or commit)

You can file new issues by providing the above information [here](https://github.com/angular/angularfire2/issues/new).

### <a name="submit-pr"></a> Submitting a Pull Request (PR)

#### <a name="submit-before"></a> Before you submit:

* Ensure proposed changes or problem have already been clearly defined and
  discussed in the issue tracker. We don't want you to burn time on code
  that isn't a good fit for the project.
* Search [GitHub](https://github.com/angular/angularfire2/pulls) for an open or closed PR
  that relates to your submission. You don't want to duplicate effort.
* Please sign our [Contributor License Agreement (CLA)](#cla) before sending PRs.
  We cannot accept code without this.
* Review our [Coding Rules][rules] (external link)
* Review our [Commit Message Guidelines][commit] (external link)  

#### <a name="submit-how"></a> How to submit:

* Create your patch, **including appropriate test cases**.
* Follow the [Angular Coding Rules][rules].
* Run the full test suite (`yarn test`) and ensure that all tests pass.
* Commit your changes using a descriptive commit message that follows the
  [Angular commit message conventions][commit]. Adherence to these conventions
  is necessary because release notes are automatically generated from these messages.

     ```shell
     git commit -a
     ```
  Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files.

* Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

* In GitHub, send a pull request to `angular:master`.
* If we suggest changes then:
  * Make the required updates.
  * Re-run the test suites to ensure tests are still passing.
  * Rebase your branch and force push to your GitHub repository (this will update your Pull Request):

    ```shell
    git rebase master -i
    git push -f
    ```

That's it! Thank you for your contribution!

## <a name="cla"></a> Signing the CLA

Please sign our Contributor License Agreement (CLA) before sending pull requests. For any code
changes to be accepted, the CLA must be signed. It's a quick process, we promise!

* For individuals we have a [simple click-through form][individual-cla].
* For corporations we'll need you to
  [print, sign and one of scan+email, fax or mail the form][corporate-cla].


[slack]: https://firebase-community.appspot.com/
[coc]: https://github.com/angular/code-of-conduct/blob/master/CODE_OF_CONDUCT.md
[commit-message-format]: https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#
[corporate-cla]: https://code.google.com/legal/corporate-cla-v1.0.html
[individual-cla]: http://code.google.com/legal/individual-cla-v1.0.html
[js-style-guide]: https://google.github.io/styleguide/javascriptguide.xml
[jsfiddle]: http://jsfiddle.net
[plunker]: http://plnkr.co/edit
[runnable]: http://runnable.com
[github]: https://github.com/angular/angularfire2
[stackoverflow]: http://stackoverflow.com/questions/tagged/angularfire
[rules]: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#rules
[commit]: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines
[angular-group]:  https://groups.google.com/forum/#!forum/angular
[firebase-group]: https://groups.google.com/forum/#!forum/firebase-talk
[github-fork]: https://help.github.com/articles/fork-a-repo/
