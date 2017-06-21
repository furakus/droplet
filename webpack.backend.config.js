var path = require('path')
var nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: path.join(__dirname, 'backend', 'main.ts'),
  target: 'node',
  externals: [nodeExternals()],
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'server')
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
  }
}
