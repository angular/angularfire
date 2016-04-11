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