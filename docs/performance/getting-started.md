# Getting started with Performance Monitoring

##  Basic usage

**TBD** basic explainer

```ts
constructor(private afp: AngularFirePerformance, private afs: AngularFirestore) {}

ngOnInit() {
  this.articles = afs.collection('articles')
      .collection('articles', ref => ref.orderBy('publishedAt', 'desc'))
      .snapshotChanges()
      .pipe(
        this.afp.trace('getArticles'),
        map(articles => ...)
      );
}
```

`trace(name:string)` will trace the time it takes for your observable to either complete or emit it's first value. Beyond the basic trace there are three other operators:

### `traceComplete(name:string)`

Traces the observable until the completion.

### `traceUntil(name:string, test: (T) => Boolean)`

Traces the observable until the first emission that passes the provided test.

### `traceFirst(name: string)`

Traces the observable until the first emission or the first emission that matches the provided test.

## Advanced usage

### `trace$(...) => Observable<void>`

`(name:string)`
`(name:string, options: TraceOptions)`

Observable version of `firebase/perf`'s `.trace` method; the basis for `AngularFirePerfomance`'s pipes.

`.subscribe()` is equivalent to calling `.start()`
`.unsubscribe()` is equivalent to calling `.stop()`

### `TraceOptions`

**TBD explain how each option is used by `.trace$`**

```ts
export const gameUpdate = (state: State, input: Input): State => (
  afp.traceComplete('game', {
    pluckMetrics: ['score'],
    attribute$: { user: this.afAuth.user }
  }),
  whileNotGameOver(state, input),
  processInput(state, input),
  updateState(state)
);
```

```ts
export type TraceOptions = {
  pluckMetrics?: [string],
  pluckAttributes?: [string],
  metrics?: { [key:string]: number },
  attributes?: { [key:string]: string },
  attribute$?: { [key:string]: Observable<string> },
  incrementMetric$: { [key:string]: Observable<number|void|null|undefined> },
  metric$?: { [key:string]: Observable<number> }
};
```