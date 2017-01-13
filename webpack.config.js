const path = require("path");
const APP_PATH = path.resolve("./demo");
const externals = false;
const filename = "bundle.js";
const port = 8080;

module.exports = {
  entry: ["babel-polyfill", path.join(APP_PATH, "index.js")],
  externals,
  output: {
    path: APP_PATH,
    publicPath: "/demo/",
    filename
  },
  module: {
    loaders: [
      {
        loader: "babel-loader",
        test: /.js$/,
        exclude: /node_modules/,
        query: {
          presets: ["es2015"]
        }
      }
    ]
  },
  plugins: [
  ],
  devServer: {
    historyApiFallback: {
      index: "demo/index.html"
    },
    progress: true,
    contentBase: path.resolve("./"),
    port,
    host: "0.0.0.0",
    clientLogLevel: "info",
    stats: { colors: true }
  }
};