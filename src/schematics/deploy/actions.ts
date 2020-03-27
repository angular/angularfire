import {
  BuilderContext,
  targetFromTargetString
} from "@angular-devkit/architect";
import { BuildTarget, FirebaseTools, FSHost } from "../interfaces";
import { writeFileSync, renameSync, existsSync, readFileSync } from "fs";
import { copySync, removeSync } from "fs-extra";
import { join, dirname } from "path";
import {
  defaultFunction,
  defaultPackage,
  NodeVersion
} from "./functions-templates";
import { experimental } from "@angular-devkit/core";
import { SchematicsException } from "@angular-devkit/schematics";
import { satisfies } from "semver";

const moveSync = (src: string, dest: string) => {
  copySync(src, dest);
  removeSync(src);
};

const deployToHosting = (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string
) => {
  return firebaseTools.deploy({
    // tslint:disable-next-line:no-non-null-assertion
    only: "hosting:" + context.target!.project,
    cwd: workspaceRoot
  });
};

const defaultFsHost: FSHost = {
  moveSync,
  writeFileSync,
  renameSync
};

const getVersionRange = (v: number) => `^${v}.0.0`;

const getPackageJson = (workspaceRoot: string) => {
  const versions = {
    'firebase-admin': 'latest',
    'firebase-functions': 'latest',
    'firebase-functions-test': 'latest'
  };
  if (existsSync(join(workspaceRoot, 'package.json'))) {
    try {
      const content = JSON.parse(readFileSync(join(workspaceRoot, 'package.json')).toString());
      Object.keys(versions).forEach((p: string) => {
        versions[p] = content.devDependencies[p] || content.dependencies[p] || versions[p];
      });
    } catch {}
  }
  return defaultPackage(versions["firebase-admin"], versions["firebase-functions"], versions["firebase-functions-test"]);
};

export const deployToFunction = async (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  project: experimental.workspace.WorkspaceTool,
  preview: boolean,
  fsHost: FSHost = defaultFsHost
) => {
  if (!satisfies(process.versions.node, getVersionRange(NodeVersion))) {
    context.logger.warn(
      `⚠️ Your Node.js version (${process.versions.node}) does not match the Firebase Functions runtime (${NodeVersion}).`
    );
  }

  if (
    !project ||
    !project.build ||
    !project.build.options ||
    !project.build.options.outputPath
  ) {
    throw new SchematicsException(
      `Cannot read the output path (architect.build.options.outputPath) of the Angular project in angular.json`
    );
  }

  if (
    !project ||
    !project.server ||
    !project.server.options ||
    !project.server.options.outputPath
  ) {
    throw new SchematicsException(
      `Cannot read the output path (architect.server.options.outputPath) of the Angular project in angular.json`
    );
  }

  const staticOut = project.build.options.outputPath;
  const serverOut = project.server.options.outputPath;
  const newClientPath = join(dirname(staticOut), staticOut);
  const newServerPath = join(dirname(serverOut), serverOut);

  // This is needed because in the server output there's a hardcoded dependency on $cwd/dist/browser,
  // This assumes that we've deployed our application dist directory and we're running the server
  // in the parent directory. To have this precondition, we move dist/browser to dist/dist/browser
  // since the firebase function runs the server from dist.
  fsHost.moveSync(staticOut, newClientPath);
  fsHost.moveSync(serverOut, newServerPath);

  fsHost.writeFileSync(
    join(dirname(serverOut), "package.json"),
    getPackageJson(workspaceRoot)
  );
  fsHost.writeFileSync(
    join(dirname(serverOut), "index.js"),
    defaultFunction(serverOut)
  );

  fsHost.renameSync(
    join(newClientPath, "index.html"),
    join(newClientPath, "index.original.html")
  );

  context.logger.info("Deploying your Angular Universal application...");

  if (preview) {
    context.logger.info(
      "Your Universal application is now ready for preview. Use `firebase serve` in the output directory of your workspace to test the setup."
    );
    return Promise.resolve();
  } else {
    return firebaseTools.deploy({
      cwd: workspaceRoot
    });
  }
};

export default async function deploy(
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  projectTargets: experimental.workspace.WorkspaceTool,
  buildTargets: BuildTarget[],
  firebaseProject: string,
  ssr: boolean,
  preview: boolean,
  firebaseToken?: string,
) {
  if (!firebaseToken) {
    await firebaseTools.login();
  }

  if (!context.target) {
    throw new Error("Cannot execute the build target");
  }

  context.logger.info(`📦 Building "${context.target.project}"`);

  for (const target of buildTargets) {
    const run = await context.scheduleTarget(
      targetFromTargetString(target.name),
      target.options
    );
    await run.result;
  }

  try {
    await firebaseTools.use(firebaseProject, { project: firebaseProject });
  } catch (e) {
    throw new Error(`Cannot select firebase project '${firebaseProject}'`);
  }

  try {
    let success: { hosting: string };

    if (ssr) {
      success = await deployToFunction(
        firebaseTools,
        context,
        context.workspaceRoot,
        projectTargets,
        preview
      );
    } else {
      success = await deployToHosting(
        firebaseTools,
        context,
        context.workspaceRoot
      );
    }

    if (!preview) {
      context.logger.info(
        `🚀 Your application is now available at https://${
          success.hosting.split("/")[1]
        }.firebaseapp.com/`
      );
    }
  } catch (e) {
    context.logger.error(e.message || e);
  }
}
