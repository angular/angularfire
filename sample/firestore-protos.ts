module.exports = {
    path: './node_modules/@firebase/firestore/dist/src/protos',
    filter: /\.proto$/,
    pathTransform: (_) => {
        const name = _.split('./node_modules/@firebase/firestore/dist/')[1];
        return `file-loader?name=${name}!${_}`;
    }
};
