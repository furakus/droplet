var webpack = require('webpack')
var path = require('path')

module.exports = {
  entry: path.join(__dirname, 'frontend', 'main.ts'),
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'public')
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
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['env']
            }
          },
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/]
            }
          }
        ],
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
    contentBase: path.join(__dirname, 'public'),
    inline: true,
    hot: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
};
