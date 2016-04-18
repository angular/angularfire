export function isPresent(obj: any): boolean {
  return obj !== undefined && obj !== null;
}

export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function isFirebaseRef(value: any): boolean {  
  if (value.ref && typeof value.ref === 'function' && value.ref() instanceof Firebase) {
   return true;
  }  
  return value instanceof Firebase;
}

export function isFirebaseDataSnapshot(value: any): boolean {
  return typeof value.key === 'function';
}

export function isAFUnwrappedSnapshot(value: any): boolean {
  return typeof value.$key === 'string';
}

export interface CheckUrlRef {
  isUrl: () => any;
  isRef: () => any;
}

export function checkForUrlOrFirebaseRef(urlOrRef: string | Firebase | FirebaseQuery, cases: CheckUrlRef): any {
  if (isString(urlOrRef)) {
    return cases.isUrl();
  }
  if (isFirebaseRef(urlOrRef)) {
    return cases.isRef();
  }
  throw new Error('Provide a url or a Firebase database reference');  
}