import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from "@angular-devkit/architect";
import { NodeJsSyncHost } from "@angular-devkit/core/node";
import deploy from "./actions";
import { experimental, normalize, json } from "@angular-devkit/core";
import { DeployBuilderSchema } from '../interfaces';
import * as path from "path";
import { getFirebaseProjectName } from "../utils";

type DeployBuilderOptions = DeployBuilderSchema & json.JsonObject;

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder<any>(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    // The project root is added to a BuilderContext.
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(
      root,
      new NodeJsSyncHost()
    );
    await workspace
      .loadWorkspaceFromHost(normalize("angular.json"))
      .toPromise();

    if (!context.target) {
      throw new Error("Cannot deploy the application without a target");
    }

    const project = workspace.getProject(context.target.project);

    const firebaseProject = getFirebaseProjectName(
      context.workspaceRoot,
      context.target.project
    );

    const buildTarget = options.buildTarget || `${context.target.project}:build:production`;

    try {
      await deploy(
        require("firebase-tools"),
        context,
        path.join(context.workspaceRoot, project.root),
        buildTarget,
        firebaseProject
      );
    } catch (e) {
      console.error("Error when trying to deploy: ");
      console.error(e.message);
      return { success: false };
    }

    return { success: true };
  }
);
