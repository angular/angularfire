module.exports = {
    out: './docs/reference',
    readme: 'none',
    includes: './',
    exclude: [
        '**/*.spec.ts',
        '**/utils.ts',
        '**/database-deprecated/*',
        '**/test-config.ts'
    ],
    mode: 'file',
    theme: 'markdown',
    mdEngine: 'github',
    name: 'AngularFire',
    ignoreCompilerErrors: true,
    excludeProtected: true,
    excludeExternals: true,
    excludeNotExported: true,
    excludePrivate: true
};