const Path = require('path');
const Webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    mode: 'production',
    entry: './src/index.tsx',
    output: {
        filename: '[hash].bundle.js',
        path: Path.resolve(__dirname, 'dist')
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            },
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            }
        ]
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
    },
    plugins: [
        new Webpack.HotModuleReplacementPlugin(),
        new Webpack.DefinePlugin({
            'SHORT_URL': '"http://localhost:8000"'
        }),
        new HtmlWebpackPlugin({
            template: Path.resolve(__dirname, 'index.html')
        }),
        new UglifyJsPlugin({
            sourceMap: true
        })
    ],
    devServer: {
        contentBase: Path.resolve(__dirname, 'dist'),
        inline: true,
        hot: true,
        historyApiFallback: true,
        proxy: {
            '/api': 'http://localhost:8000'
        }
    }
}