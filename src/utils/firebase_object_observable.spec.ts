import {describe,it,beforeEach} from '@angular/core/testing';
import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import * as Firebase from 'firebase';

const rootUrl = 'https://angularfire2-obj-obs.firebaseio-demo.com/';

describe('FirebaseObjectObservable', () => {
  
  var O:FirebaseObjectObservable<any>;
  var ref:Firebase;

  beforeEach(() => {
    ref = new Firebase(rootUrl);
    O = new FirebaseObjectObservable((observer:Observer<any>) => {
    }, ref);
  });

  afterEach((done:any) => {
    ref.off();
    ref.remove();
    done();
  });
  
  it('should return an instance of FirebaseObservable when calling operators', () => {
    var O:FirebaseObjectObservable<number> = new FirebaseObjectObservable((observer:Observer<number>) => {
    });
    expect(O.map(noop) instanceof FirebaseObjectObservable).toBe(true);
  });
  
  describe('set', () => {
    
    it('should call set on the underlying ref', (done:any) => {
      var setSpy = spyOn(ref, 'set');

      O.subscribe();
      O.set(1);
      expect(setSpy).toHaveBeenCalledWith(1);
      done();
    });    
    
    it('should throw an exception if set when not subscribed', () => {
      O = new FirebaseObjectObservable((observer:Observer<any>) => {});

      expect(() => {
        O.set('foo');
      }).toThrowError('No ref specified for this Observable!')
    });
    
    it('should accept any type of value without compilation error', () => {
      O.set('foo');
    });


    it('should resolve returned thenable when successful', (done:any) => {
      O.set('foo').then(done, done.fail);
    });        
    
  });
  
  describe('update', () => {
    const updateObject = { hot: 'firebae' };
    it('should call update on the underlying ref', () => {
      var updateSpy = spyOn(ref, 'update');

      O.subscribe();
      O.update(updateObject);
      expect(updateSpy).toHaveBeenCalledWith(updateObject);
    });    
    
    it('should throw an exception if updated when not subscribed', () => {
      O = new FirebaseObjectObservable((observer:Observer<any>) => {});

      expect(() => {
        O.update(updateObject);
      }).toThrowError('No ref specified for this Observable!')
    });
    
    it('should accept any type of value without compilation error', () => {
      O.update(updateObject);
    });

    it('should resolve returned thenable when successful', (done:any) => {
      O.update(updateObject).then(done, done.fail);
    });        
    
  });  

  describe('remove', () => {

    it('should call remove on the underlying ref', () => {
      var removeSpy = spyOn(ref, 'remove');

      O.subscribe();
      O.remove();
      expect(removeSpy).toHaveBeenCalledWith();
    });    
    
    it('should throw an exception if removed when not subscribed', () => {
      O = new FirebaseObjectObservable((observer:Observer<any>) => {});

      expect(() => {
        O.remove();
      }).toThrowError('No ref specified for this Observable!')
    });
    
    it('should resolve returned thenable when successful', (done:any) => {
      O.remove().then(done, done.fail);
    });        
    
  }); 
  
});

function noop() {}
