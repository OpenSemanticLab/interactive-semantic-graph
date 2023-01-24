const path = require('path');

module.exports = {
    mode: "none",
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'isg.umd.js',
        library: ['isg'],
        libraryTarget: "umd"
    },
};