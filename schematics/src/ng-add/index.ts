import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { addPackageToPackageJson } from '../utils/package';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { angularfireVersion, firebaseVersion } from '../utils/libs-version';
import { addEnvironmentEntry } from '../utils/environment';
import { getProjectPath } from '../utils/project';
import { Schema } from './schema';
import { parseName } from '../schematics-core/utility/parse-name';
import { buildRelativePath, findModuleFromOptions } from '../schematics-core/utility/find-module';
import { addImportToModule, insertImport } from '../schematics-core/utility/ast-utils';
import { InsertChange } from '../schematics-core/utility/change';

export default function add(options: Schema): Rule {
  return chain([
    install(),
    addConfig(),
    addToNgModule(options),
  ])
}

export function install(): Rule {
  return (host: Tree, context: SchematicContext) => {
    addPackageToPackageJson(host, 'dependencies', 'firebase', firebaseVersion);
    addPackageToPackageJson(host, 'dependencies', '@angular/fire', angularfireVersion);
    context.addTask(new NodePackageInstallTask());
    return host;
  };
}

function addConfig(): Rule {
  return (host: Tree) => {
    const firebaseConfig = `
  firebase: {
    apiKey: '<your-key>',
    authDomain: '<your-project-authdomain>',
    databaseURL: '<your-database-URL>',
    projectId: '<your-project-id>',
    storageBucket: '<your-storage-bucket>',
    messagingSenderId: '<your-messaging-sender-id>'
  },`;
    addEnvironmentEntry(host, 'environment.ts', firebaseConfig);
    return host;
  }
}

function addToNgModule(options: Schema): Rule {
  return (host: Tree) => {
    options.path = parseName(getProjectPath(host, options), '').path;

    if (options.module) {
      options.module = findModuleFromOptions(host, {
        name: '',
        module: options.module,
        path: options.path,
      });
    }

    const modulePath = options.module;

    if (!modulePath) {
      return host;
    }

    if (!host.exists(modulePath)) {
      throw new Error(`Specified module path ${modulePath} does not exist`);
    }

    const text = host.read(modulePath);
    if (text === null) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const sourceText = text.toString('utf-8');

    const source = ts.createSourceFile(
      modulePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const environmentsPath = buildRelativePath(
      modulePath,
      `${options.path}/environments/environment`
    );

    const AngularFireNgModuleImport = addImportToModule(
      source,
      modulePath,
      options.firebaseApp
        ? `AngularFireModule.initializeApp(environment.firebase, '${options.firebaseApp}')`
        : `AngularFireModule.initializeApp(environment.firebase)`,
      ''
    ).shift();

    const coreImports = [
      insertImport(source, modulePath, 'AngularFireModule', '@angular/fire'),
      insertImport(source, modulePath, 'environment', environmentsPath),
      AngularFireNgModuleImport,
    ];

    const individualImports = options.all
      ? [
        insertImport(source, modulePath, 'AngularFirestoreModule', '@angular/fire/firestore'),
        insertImport(source, modulePath, 'AngularFireStorageModule', '@angular/fire/storage'),
        insertImport(source, modulePath, 'AngularFireAuthModule', '@angular/fire/auth'),
        addImportToModule(source, modulePath, 'AngularFirestoreModule', '').shift(),
        addImportToModule(source, modulePath, 'AngularFireStorageModule', '').shift(),
        addImportToModule(source, modulePath, 'AngularFireAuthModule', '').shift(),
      ]
      : [];

    const changes = [...coreImports, ...individualImports];

    const recorder = host.beginUpdate(modulePath);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(recorder);

    return host;
  }
}
