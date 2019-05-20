import { BuilderContext } from "@angular-devkit/architect";
import { FirebaseTools } from "../interfaces";

export default async function deploy(
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  projectRoot: string,
  firebaseProject?: string
) {
  if (!firebaseProject) {
    throw new Error("Cannot find firebase project for your app in .firebaserc");
  }

  try {
    await firebaseTools.list();
  } catch (e) {
    context.logger.warn(
      "🚨 You're not logged into Firebase. Logging you in..."
    );
    await firebaseTools.login();
  }
  if (!context.target) {
    throw new Error("Cannot execute the build target");
  }

  context.logger.info(`📦 Building "${context.target.project}"`);

  const run = await context.scheduleTarget({
    target: "build",
    project: context.target.project,
    configuration: "production"
  });
  await run.result;

  try {
    await firebaseTools.use(firebaseProject, { project: firebaseProject });
  } catch (e) {
    throw new Error(`Cannot select firebase project '${firebaseProject}'`);
  }

  try {
    const success = await firebaseTools.deploy({
      only: "hosting:" + context.target.project,
      cwd: projectRoot
    });
    context.logger.info(
      `🚀 Your application is now available at https://${
        success.hosting.split("/")[1]
      }.firebaseapp.com/`
    );
  } catch (e) {
    context.logger.error(e);
  }
}
