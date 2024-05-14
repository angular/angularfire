import {PubSub} from "@google-cloud/pubsub";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

initializeApp();

export const newNpmVersion = onDocumentCreated({
  document: "npm-packages/{packageName}/versions/{version}",
  database: "matrix",
}, async (event) => {
  const matrices = await getFirestore("matrix").
    collection("matrices").
    get();
  await Promise.allSettled(matrices.docs.map(async (doc) => {
    const triggers = doc.data()["npm-packages"] || {};
    const packageTriggers: string[] = triggers[event.params.packageName] || [];
    const tags: string[] = event.data?.data().tags || [];
    if (packageTriggers.some((tag) => tags.includes(tag))) {
      // trigger, add a run with versions
      const versions = Object.fromEntries(
        Object.keys(triggers).map((it) => [it, "latest"])
      );
      versions[event.params.packageName] = event.params.version;
      await doc.ref.collection("runs").
        doc(`${event.params.packageName}@${event.params.version}`).
        create({
          ["npm-packages"]: versions,
        });
    }
  }));
});

export const newRun = onDocumentCreated({
  document: "matrices/{test}/runs/{trigger}",
  database: "matrix",
}, async (event) => {
  const pubsub = new PubSub({projectId: "angularfire2-test"});
  const versions: Record<string, string> = event.data?.
    data()["npm-packages"] || {};
  const versionData = Object.fromEntries(
    Object.entries(versions).
      map(([name, version]) => [
        encodePackageNameForPubSub(name),
        version,
      ])
  );
  await pubsub.topic("matrix-test").publishMessage({
    attributes: {
      ...event.params,
      ...versionData,
    },
  });
});

const encodePackageNameForPubSub = (id: string) =>
  `${id.replace(/[@\\-]/g, "_")}_version`;

const decodePackageName = (id: string) => id.replace(/\\/g, "/");

export const scanNpmVersions = onSchedule({
  schedule: "*/20 * * * *",
  memory: "512MiB",
  timeoutSeconds: 300,
}, async () => {
  const docs = await getFirestore("matrix").
    collection("npm-packages").
    listDocuments();
  await Promise.allSettled(docs.map(async (doc) => {
    const packageName = decodePackageName(doc.id);
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      return Promise.reject(response.statusText);
    }
    const packument = await response.json();
    // Add all versions
    await Promise.allSettled(
      Object.keys(packument.versions).map((version) => {
        const tags = Object.entries(packument["dist-tags"]).
          filter(([, taggedVersion]) => taggedVersion === version).
          map(([tag]) => tag);
        return doc.collection("versions").doc(version).create({
          tags,
        });
      }),
    );
    // Update tags
    await doc.set({
      tags: packument["dist-tags"],
    }, {
      merge: true,
    });
    return;
  }));
});
