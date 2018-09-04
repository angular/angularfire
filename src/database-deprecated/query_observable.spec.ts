import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { Query, ScalarQuery } from './interfaces';
import { getOrderObservables, observeQuery } from '@angular/fire/database-deprecated';

function scalarQueryTest(query: ScalarQuery, done: any) {
  const queryObservable = observeQuery(query);
  queryObservable.subscribe(result => {
    expect(result).toEqual(query);
    done();
  });
}

function observableQueryTest(query: Query, nextProp: any, done: any) {
  const queryObservable = observeQuery(query);
  const toMerge: any = {};
  queryObservable.subscribe(result => {
    const merged = Object.assign(query, toMerge);
    expect(result).toEqual(merged);
    done();
  });
  Object.keys(nextProp).forEach(prop => {
    query[prop].next(nextProp[prop]);
    toMerge[prop] = nextProp[prop];
  });
}

describe('observeQuery', () => {
  const resultQuery = { orderByKey: true, startAt: <any>null, endAt: <any>null, equalTo: <any>null };

  it('should return an observable', () => {
    expect(observeQuery({}) instanceof Observable).toBe(true);
  });

  it('should immediately emit a query object if passed a POJO with only scalar values', () => {
    let nextSpy = jasmine.createSpy('next');
    let completeSpy = jasmine.createSpy('complete');
    let query = { orderByChild: 'height', equalTo: 10 };
    let obs = observeQuery(query, false);
    obs.subscribe(nextSpy, () => {}, completeSpy);
    expect(nextSpy).toHaveBeenCalledWith({
      orderByChild: 'height',
      equalTo: 10
    });
  });


  it('should return null if called with no query', () => {
    let nextSpy = jasmine.createSpy('next');
    let completeSpy = jasmine.createSpy('complete');
    let query:any = null;
    let obs = observeQuery(query, false);
    obs.subscribe(nextSpy, () => {}, completeSpy);
    expect(nextSpy).toHaveBeenCalledWith(null);
    expect(completeSpy).toHaveBeenCalled();
  });


  it('should emit an updated query if an attached observable emits new value', () => {
    let nextSpy = jasmine.createSpy('next');
    let completeSpy = jasmine.createSpy('complete');
    let query = {
      orderByKey: new Subject<boolean>()
    };
    let obs = observeQuery(query as {orderByKey: Observable<boolean>}, false);
    let noOrderyQuery = { orderByKey: false };
    obs.subscribe(nextSpy, () => {}, completeSpy);
    query.orderByKey.next(true);
    expect(nextSpy).toHaveBeenCalledWith({ orderByKey: true});
    nextSpy.calls.reset();
    expect(completeSpy).not.toHaveBeenCalled();
    query.orderByKey.next(false);
    expect(nextSpy).toHaveBeenCalledWith(noOrderyQuery);
  });


  it('should omit a key from the query if its observable emits null', () => {
    let nextSpy = jasmine.createSpy('next');
    let completeSpy = jasmine.createSpy('complete');
    let query = {
      orderByKey: new Subject<boolean>()
    };
    let obs = observeQuery(query as {orderByKey: Observable<boolean>}, false);
    obs.subscribe(nextSpy, () => {}, completeSpy);
    query.orderByKey.next(true);
    expect(nextSpy).toHaveBeenCalledWith({ orderByKey: true });
    nextSpy.calls.reset();
    query.orderByKey.next(null!);
    expect(nextSpy).toHaveBeenCalledWith({});
  });


  it('should omit only the orderBy type of the last emitted orderBy observable', () => {
    let nextSpy = jasmine.createSpy('next');
    let query = {
      orderByKey: new Subject<boolean>(),
      orderByPriority: new Subject<boolean>(),
      orderByValue: new Subject<boolean>(),
      orderByChild: new Subject<string>()
    };
    let obs = observeQuery(query as {
      orderByKey: Observable<boolean>,
      orderByPriority: Observable<boolean>,
      orderByValue: Observable<boolean>,
      orderByChild: Observable<string>
    }, false);
    obs.subscribe(nextSpy);
    query.orderByChild.next('height');
    expect(nextSpy).toHaveBeenCalledWith({
      orderByChild: 'height'
    });
    nextSpy.calls.reset();
    query.orderByKey.next(true);
    expect(nextSpy).toHaveBeenCalledWith({
      orderByKey: true
    });
    nextSpy.calls.reset();
    query.orderByValue.next(true);
    expect(nextSpy).toHaveBeenCalledWith({
      orderByValue: true
    });
    nextSpy.calls.reset();
    query.orderByChild.next('foo');
    expect(nextSpy).toHaveBeenCalledWith({
      orderByChild: 'foo'
    });
  });
});


describe('getOrderObservables', () => {
  it('should be subscribable event if no observables found for orderby', () => {
    let nextSpy = jasmine.createSpy('next');
    let obs = getOrderObservables({});
    obs.subscribe(nextSpy);
    expect(nextSpy).toHaveBeenCalledWith(null);
  });
});


describe('query combinations', () => {

    describe('orderByChild', () => {
      /*
        orderByChild combinations
        ----------------------
        orderByChild("").equalTo()
        orderByChild("").startAt()
        orderByChild("").startAt().endAt();
        orderByChild("").endAt();
      */
      it('should build an equalTo query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByChild: 'height',
          equalTo: 94
        }, done);
      });

      it('should build an equalTo query with an observable', (done: any) => {
        const query = {
          orderByChild: 'height',
          equalTo: new Subject()
        };
        observableQueryTest(query, { equalTo: 92 }, done);
      });

      it('should build a startAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByChild: 'height',
          startAt: 94
        }, done);
      });

      it('should build a startAt query with an observable', (done: any) => {
        const query = {
          orderByChild: 'height',
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 92 }, done);
      });

      it('should build a endAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByChild: 'height',
          endAt: 94
        }, done);
      });

      it('should build a endAt query with an observable', (done: any) => {
        const query = {
          orderByChild: 'height',
          endAt: new Subject()
        };
        observableQueryTest(query, { endAt: 92 }, done);
      });

      it('should build a startAt().endAt() query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByChild: 'height',
          startAt: 32,
          endAt: 94
        }, done);
      });

      it('should build a startAt().endAt() query with an observable', (done: any) => {
        const query = {
          orderByChild: 'height',
          endAt: new Subject(),
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 32, endAt: 92 }, done);
      });

    })

    describe('orderByKey', () => {
      /*
        orderByKey combinations
        ----------------------
        orderByKey("").equalTo()
        orderByKey("").startAt()
        orderByKey("").startAt().endAt();
        orderByKey("").endAt();
      */
      it('should build an equalTo query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByKey: true,
          equalTo: 94
        }, done);
      });

      it('should build an equalTo query with an observable', (done: any) => {
        const query = {
          orderByKey: true,
          equalTo: new Subject()
        };
        observableQueryTest(query, { equalTo: 92 }, done);
      });

      it('should build a startAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByKey: true,
          startAt: 94
        }, done);
      });

      it('should build a startAt query with an observable', (done: any) => {
        const query = {
          orderByKey: true,
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 92 }, done);
      });

      it('should build a endAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByKey: true,
          endAt: 94
        }, done);
      });

      it('should build a endAt query with an observable', (done: any) => {
        const query = {
          orderByKey: true,
          endAt: new Subject()
        };
        observableQueryTest(query, { endAt: 92 }, done);
      });

      it('should build a startAt().endAt() query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByKey: true,
          startAt: 32,
          endAt: 94
        }, done);
      });

      it('should build a startAt().endAt() query with an observable', (done: any) => {
        const query = {
          orderByKey: true,
          endAt: new Subject(),
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 32, endAt: 92 }, done);
      });

    });

    describe('orderByValue', () => {
      /*
        orderByValue combinations
        ----------------------
        orderByValue("").equalTo()
        orderByValue("").startAt()
        orderByValue("").startAt().endAt();
        orderByValue("").endAt();
      */
      it('should build an equalTo query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByValue: true,
          equalTo: 21
        }, done);
      });

      it('should build an equalTo query with an observable', (done: any) => {
        const query = {
          orderByValue: true,
          equalTo: new Subject()
        };
        observableQueryTest(query, { equalTo: 43 }, done);
      });

      it('should build a startAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByValue: true,
          startAt: 25
        }, done);
      });

      it('should build a startAt query with an observable', (done: any) => {
        const query = {
          orderByValue: true,
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 11 }, done);
      });

      it('should build a endAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByValue: true,
          endAt: 94
        }, done);
      });

      it('should build a endAt query with an observable', (done: any) => {
        const query = {
          orderByValue: true,
          endAt: new Subject()
        };
        observableQueryTest(query, { endAt: 43 }, done);
      });

      it('should build a startAt().endAt() query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByValue: true,
          startAt: 32,
          endAt: 94
        }, done);
      });

      it('should build a startAt().endAt() query with an observable', (done: any) => {
        const query = {
          orderByValue: true,
          endAt: new Subject(),
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 7, endAt: 12 }, done);
      });

    });

    describe('orderByPriority', () => {
      /*
        orderByPriority combinations
        ----------------------
        orderByPriority("").equalTo()
        orderByPriority("").startAt()
        orderByPriority("").startAt().endAt();
        orderByPriority("").endAt();
      */
      it('should build an equalTo query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByPriority: true,
          equalTo: 21
        }, done);
      });

      it('should build an equalTo query with an observable', (done: any) => {
        const query = {
          orderByPriority: true,
          equalTo: new Subject()
        };
        observableQueryTest(query, { equalTo: 43 }, done);
      });

      it('should build a startAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByPriority: true,
          startAt: 25
        }, done);
      });

      it('should build a startAt query with an observable', (done: any) => {
        const query = {
          orderByPriority: true,
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 11 }, done);
      });

      it('should build a endAt query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByPriority: true,
          endAt: 94
        }, done);
      });

      it('should build a endAt query with an observable', (done: any) => {
        const query = {
          orderByPriority: true,
          endAt: new Subject()
        };
        observableQueryTest(query, { endAt: 43 }, done);
      });

      it('should build a startAt().endAt() query with scalar values', (done: any) => {
        scalarQueryTest({
          orderByPriority: true,
          startAt: 32,
          endAt: 94
        }, done);
      });

      it('should build a startAt().endAt() query with an observable', (done: any) => {
        const query = {
          orderByPriority: true,
          endAt: new Subject(),
          startAt: new Subject()
        };
        observableQueryTest(query, { startAt: 7, endAt: 12 }, done);
      });

    });

});


describe('null values', () => {

  it('should build an equalTo() query with a null scalar value', (done: any) => {
    scalarQueryTest({
      orderByChild: 'height',
      equalTo: null
    }, done);
  });

  it('should build a startAt() query with a null scalar value', (done: any) => {
    scalarQueryTest({
      orderByChild: 'height',
      startAt: null
    }, done);
  });

  it('should build an endAt() query with a null scalar value', (done: any) => {
    scalarQueryTest({
      orderByChild: 'height',
      endAt: null
    }, done);
  });

  it('should build an equalTo() query with a null observable value', (done: any) => {
    const query = {
      orderByChild: 'height',
      equalTo: new Subject()
    };
    observableQueryTest(query, { equalTo: null }, done);
  });

  it('should build a startAt() query with a null observable value', (done: any) => {
    const query = {
      orderByChild: 'height',
      startAt: new Subject()
    };
    observableQueryTest(query, { startAt: null }, done);
  });

  it('should build an endAt() query with a null observable value', (done: any) => {
    const query = {
      orderByChild: 'height',
      endAt: new Subject()
    };
    observableQueryTest(query, { endAt: null }, done);
  });

});

describe('audited queries', () => {

  it('should immediately emit if not audited', () => {
    let nextSpy = jasmine.createSpy('next');
    let query = { orderByChild: 'height', startAt: new Subject(), endAt: new Subject() };
    let obs = observeQuery(query, false);
    obs.subscribe(nextSpy);
    query.startAt.next(5);
    expect(nextSpy).not.toHaveBeenCalled();
    query.endAt.next(10);
    expect(nextSpy).toHaveBeenCalledWith({
      orderByChild: 'height',
      startAt: 5,
      endAt: 10
    });
    query.startAt.next(10);
    expect(nextSpy).toHaveBeenCalledWith({
      orderByChild: 'height',
      startAt: 10,
      endAt: 10
    });
    query.endAt.next(15);
    expect(nextSpy).toHaveBeenCalledWith({
      orderByChild: 'height',
      startAt: 10,
      endAt: 15
    });
  });

  it('should emit the last query (in the event loop) if audited', (done: any) => {
    let emits = 0;
    let query = { orderByChild: 'height', startAt: new Subject(), endAt: new Subject() };
    let obs = observeQuery(query, true);
    obs.subscribe(result => {
      switch (++emits) {
      case 1:
        expect(result).toEqual({
          orderByChild: 'height',
          startAt: 5,
          endAt: 10
        });
        query.startAt.next(10);
        query.endAt.next(15);
        break;
      case 2:
        expect(result).toEqual({
          orderByChild: 'height',
          startAt: 10,
          endAt: 15
        });
        done();
        break;
      }
    });
    query.startAt.next(5);
    query.endAt.next(10);
  });

});
