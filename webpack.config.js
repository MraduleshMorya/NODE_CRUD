const path = require("path");
var webpack = require("webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  target: "node",
  plugins: [new webpack.IgnorePlugin({resourceRegExp:/^pg-native$/})],
  mode:"development",
  module: {
    rules: [
      {
        test: /.js$/,
        use: ["babel-loader"],
        exclude: "/node_modules/",
      },
    ],
  },
};
