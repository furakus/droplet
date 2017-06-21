var Webpack = require('webpack')
var Path = require('path')
var HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: Path.join(__dirname, 'frontend', 'main.ts'),
  output: {
    filename: '[hash].bundle.js',
    path: Path.join(__dirname, 'public')
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          esModule: true
        }
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/]
        },
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'less-loader'
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.less']
  },
  devServer: {
    contentBase: Path.join(__dirname, 'public'),
    inline: true,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  plugins: [
    new Webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: Path.join(__dirname, 'frontend', 'index.ejs')
    })
  ]
}
