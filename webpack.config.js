const path = require('path');

const config = {
    entry: {
        app: './src/app.tsx',
    },
    output: {
        filename: "[name].js",
        path: path.join(__dirname, 'public/static/dist'),
        publicPath: '/static/dist/',
    },
    devServer: {
        publicPath: '/static/dist/',
        contentBase: path.join(__dirname, 'public'),
        port: 8005,
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
        ],
    },
};

module.exports = config;
