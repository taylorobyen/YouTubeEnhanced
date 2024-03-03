const path = require("path");
module.exports = {
    mode: "production",
    entry: {
        background: "./js/background.js",
        content: "./js/content.js"
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../build')
    }
};