import { storage } from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';

export function getDownloadURL(ref: storage.Reference) { 
  return from(ref.getDownloadURL()); 
}

export function getMetadata(ref: storage.Reference) { 
  return from(ref.getMetadata()); 
}
