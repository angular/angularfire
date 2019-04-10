"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function deploy(firebaseTools, context, projectRoot, firebaseProject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!firebaseProject) {
            throw new Error('Cannot find firebase project for your app in .firebaserc');
        }
        try {
            yield firebaseTools.list();
        }
        catch (e) {
            context.logger.warn("🚨 You're not logged into Firebase. Logging you in...");
            yield firebaseTools.login();
        }
        if (!context.target) {
            throw new Error('Cannot execute the build target');
        }
        context.logger.info(`📦 Building "${context.target.project}"`);
        const run = yield context.scheduleTarget({
            target: 'build',
            project: context.target.project,
            configuration: 'production'
        });
        yield run.result;
        try {
            yield firebaseTools.use(firebaseProject, { project: firebaseProject });
        }
        catch (e) {
            throw new Error(`Cannot select firebase project '${firebaseProject}'`);
        }
        try {
            const success = yield firebaseTools.deploy({ only: 'hosting:' + context.target.project, cwd: projectRoot });
            context.logger.info(`🚀 Your application is now available at https://${success.hosting.split('/')[1]}.firebaseapp.com/`);
        }
        catch (e) {
            context.logger.error(e);
        }
    });
}
exports.default = deploy;
//# sourceMappingURL=deploy.js.map