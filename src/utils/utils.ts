export function isPresent(obj: any): boolean {
  return obj !== undefined && obj !== null;
}

export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function isFirebaseRef(value: any): boolean {
  return value instanceof Firebase;
}

export function isFirebaseDataSnapshot(value: any): boolean {
  return typeof value.key === 'function';
}

export function isAFUnwrappedSnapshot(value: any): boolean {
  return typeof value.$key === 'string';
}

export function isFirebaseQuery(value: any): boolean {
  return typeof value.orderByChild === 'function';
}

export function isEmptyObject(obj: Object): boolean {
  if (!isPresent(obj)) { return false; }
  return Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({});
}

export interface CheckUrlRef {
  isUrl: () => any;
  isRef: () => any;
  isQuery?: () => any;
}

export function checkForUrlOrFirebaseRef(urlOrRef: string | Firebase | FirebaseQuery, cases: CheckUrlRef): any {
  if (isString(urlOrRef)) {
    return cases.isUrl();
  }
  if (isFirebaseRef(urlOrRef)) {
    return cases.isRef();
  }
  if (isFirebaseQuery(urlOrRef)) {
    return cases.isQuery();
  }
  throw new Error('Provide a url or a Firebase database reference');  
}