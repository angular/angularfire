import { firestore } from 'firebase/app';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const addStateTransferCapabilities = (ref:firestore.CollectionReference|firestore.DocumentReference, transferState:TransferState, appRef:ApplicationRef, platformId: Object) => {
    const internalClient = (ref.firestore as any)._firestoreClient;
    if (!internalClient._angularFirePatched) {
        const originalListen = internalClient.listen;
        const isServer = isPlatformServer(platformId)
        // Inject our cache interceptor into internalClient listener
        // @ts-ignore
        function newListen(query:any, asyncObserver:any, options:{}) {
            const canonicalId = query.canonicalId();
            const stateKey = makeStateKey(canonicalId);
            if (!isServer && transferState.hasKey(stateKey)) {
                const cachedSnapshot = transferState.get(stateKey, {});
                asyncObserver.next(rehydrate(cachedSnapshot, query));
            }
            originalListen.bind(this)(query, {
                next: snapshot => {
                    if (isServer) { transferState.set(stateKey, snapshot) }
                    asyncObserver.next(snapshot);
                },
                error: asyncObserver.error
            }, options);
        };

        internalClient.listen = newListen.bind(internalClient);
        internalClient._angularFirePatched = true;
    }
};

const rehydrate = (dehydratedSnapshot, query) => {
    const snapshot = (Object as any).assign({}, dehydratedSnapshot) as any; // TODO fix type
    snapshot.fromCache = true;
    snapshot.query = query;
    snapshot.docs.size = snapshot.docs.sortedSet.root.size;
    snapshot.docs.get = getDoc(snapshot)
    snapshot.docs.forEach = getCollection(snapshot).forEach;
    return snapshot;
};

const getDoc = (snapshot) => (keyPath, full=false) => {
    const path = JSON.stringify(keyPath.path.segments);
    const match = snapshot.docChanges.find(match => {
        const keyPath = match.doc.key.path;
        if (full) {
            return path === JSON.stringify(keyPath.segments);
        } else {
            return path === JSON.stringify(keyPath.segments.slice(keyPath.offset, keyPath.offset + keyPath.len))
        }
    });
    if (match) {
        let doc = match.doc;
        let ret = [];
        const fillRet = (root) => {
            if (root.left && root.left.key) { fillRet(root.left) }
            ret.push([{ value: () => root.value.internalValue }, `${root.key}`] as never); // TODO fix type
            if (root.right && root.right.key) { fillRet(root.right) }
        }
        fillRet(doc.data.internalValue.root);
        doc.data.forEach = (cb) => new Map(ret).forEach(cb);
        return doc;
    }
};

const getCollection = (snapshot) => {
    // TODO collection isn't working yet, I must have implemented something wrong
    //      also maybe this should be lazy?
    let docs = [];
    const fillDocs = (root) => {
        if (root.left && root.left.key) { fillDocs(root.left) }
        docs.push(snapshot.docs.get(root.key.key, true) as never); // TODO fix type
        if (root.right && root.right.key) { fillDocs(root.right) }
    }
    fillDocs(snapshot.docs.sortedSet.root);
    return docs;
};