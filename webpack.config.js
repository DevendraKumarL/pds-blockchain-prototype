const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    // 'app': './app/javascripts/app.js',
    // 'approval': './app/javascripts/approval.js',
    // 'ration': './app/javascripts/ration.js',

    'centralGovernment': './app/javascripts/registration/centralGovernment.js',
    'stateGovernment': './app/javascripts/registration/stateGovernment.js',
    'customer': './app/javascripts/registration/customer.js',
    'fps': './app/javascripts/registration/fps.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js'
  },
  plugins: [
    // Copy our app's index.html to the build folder.
    // new CopyWebpackPlugin([
    //   { from: './app/index.html', to: "index.html" }
    // ]),
    // new CopyWebpackPlugin([
    //   { from: './app/approval.html', to: "approval.html" }
    // ]),
    // new CopyWebpackPlugin([
    //   { from: './app/ration.html', to: "ration.html" }
    // ]),


    ////////////////////////////////////////////////////////////////////////////
    // from: "./app/registration/customer.html", to: "registration/customer.html" ??
    ////////////////////////////////////////////////////////////////////////////
    new CopyWebpackPlugin([
        { from: './app/central-government.html', to: "central-government.html" }
    ]),
    new CopyWebpackPlugin([
        { from: './app/state-government.html', to: "state-government.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/customer.html', to: "customer.html" }
  ]),
    new CopyWebpackPlugin([
      { from: './app/fps.html', to: "fps.html" }
    ])
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      }
    ],
    loaders: [
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}
