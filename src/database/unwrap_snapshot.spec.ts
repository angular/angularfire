import * as firebase from 'firebase/app';
import { unwrapSnapshot } from './unwrap_snapshot';

describe('unwrapSnapshot', () => {
  let val = { unwrapped: true };
  let snapshot = {
    ref: { key: 'key' },
    val: () => val
  };

  it('should return an object value with a $key property', () => {
    const unwrapped = unwrapSnapshot(snapshot as firebase.database.DataSnapshot);
    expect(unwrapped.$key).toEqual(snapshot.ref.key);
  });

  it('should return an object value with a $value property if value is scalar', () => {
    const existsFn = () => { return true; }
    const unwrappedValue5 = unwrapSnapshot(Object.assign(snapshot, { val: () => 5, exists: existsFn }) as firebase.database.DataSnapshot);
    const unwrappedValueFalse = unwrapSnapshot(Object.assign(snapshot, { val: () => false, exists: existsFn }) as firebase.database.DataSnapshot);
    const unwrappedValueLol = unwrapSnapshot(Object.assign(snapshot, { val: () => 'lol', exists: existsFn }) as firebase.database.DataSnapshot);

    expect(unwrappedValue5.$key).toEqual('key');
    expect(unwrappedValue5.$value).toEqual(5);
    expect(unwrappedValue5.$exists()).toEqual(true);

    expect(unwrappedValueFalse.$key).toEqual('key');
    expect(unwrappedValueFalse.$value).toEqual(false);
    expect(unwrappedValueFalse.$exists()).toEqual(true);

    expect(unwrappedValueLol.$key).toEqual('key');
    expect(unwrappedValueLol.$value).toEqual('lol');
    expect(unwrappedValueLol.$exists()).toEqual(true);
  });
});
