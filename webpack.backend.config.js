var Path = require('path')
var NodeExternals = require('webpack-node-externals')
var UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: Path.join(__dirname, 'backend', 'main.ts'),
  target: 'node',
  externals: [NodeExternals()],
  output: {
    filename: 'bundle.js',
    path: Path.join(__dirname, 'server')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new UglifyJSPlugin()
  ]
}
