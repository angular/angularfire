import { FirebaseTools } from './interfaces';
import { spawn, execSync } from 'child_process';
import ora from 'ora';
import * as semver from 'semver';

declare global {
    var firebaseTools: FirebaseTools|undefined;
}

export const getFirebaseTools = () => globalThis.firebaseTools ?
    Promise.resolve(globalThis.firebaseTools) :
    new Promise<FirebaseTools>((resolve, reject) => {
        try {
            resolve(require('firebase-tools'));
        } catch (e) {
            try {
                const root = execSync('npm root -g').toString().trim();
                resolve(require(`${root}/firebase-tools`));
            } catch (e) {
                const spinner = ora({
                    text: `Installing firebase-tools...`,
                    // Workaround for https://github.com/sindresorhus/ora/issues/136.
                    discardStdin: process.platform !== 'win32',
                }).start();
                spawn('npm', ['i', '-g', 'firebase-tools'], {
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
        if (semver.compare(version, '9.9.0') === -1) {
            console.error('firebase-tools version 9.9+ is required, please upgrade and run again');
            return Promise.reject();
        }
        return firebaseTools;
    });
