/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync, spawn } from 'child_process';
import ora from 'ora';
import { compare as semverCompare } from 'semver';
import { FirebaseTools } from './interfaces';

declare global {
    var firebaseTools: FirebaseTools|undefined;
}

export const getFirebaseTools = () => globalThis.firebaseTools ?
    Promise.resolve(globalThis.firebaseTools) :
    new Promise<FirebaseTools>((resolve, reject) => {
        process.env.FIREBASE_CLI_EXPERIMENTS ||= 'webframeworks';
        try {
            resolve(require('firebase-tools'));
        } catch (e) {
            try {
                const root = execSync('npm root --location=global').toString().trim();
                resolve(require(`${root}/firebase-tools`));
            } catch (e) {
                const spinner = ora({
                    text: `Installing firebase-tools...`,
                    // Workaround for https://github.com/sindresorhus/ora/issues/136.
                    discardStdin: process.platform !== 'win32',
                }).start();
                spawn('npm', ['i', '--location=global', 'firebase-tools'], {
                    stdio: 'pipe',
                    shell: true,
                }).on('close', (code) => {
                    if (code === 0) {
                        spinner.succeed('firebase-tools installed globally.');
                        spinner.stop();
                        const root = execSync('npm root -g').toString().trim();
                        resolve(require(`${root}/firebase-tools`));
                    } else {
                        spinner.fail('Package install failed.');
                        reject();
                    }
                });
            }
        }
    }).then(firebaseTools => {
        globalThis.firebaseTools = firebaseTools;
        const version = firebaseTools.cli.version();
        console.log(`Using firebase-tools version ${version}`);
        if (semverCompare(version, '13.0.0') === -1) {
            console.error('firebase-tools version 13.0.0+ is required, please upgrade and run again');
            return Promise.reject();
        }
        return firebaseTools;
    });
