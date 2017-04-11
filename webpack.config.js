const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    // 'app': './app/javascripts/app.js',
    // 'approval': './app/javascripts/approval.js',
    // 'ration': './app/javascripts/ration.js',

    'centralGovernment': './app/javascripts/users/centralGovernment.js',
    'stateGovernment': './app/javascripts/users/stateGovernment.js',
    'customer': './app/javascripts/users/customer.js',
    'fps': './app/javascripts/users/fps.js',

    'approvals': './app/javascripts/approvals/approvals.js',
    'rationcards': './app/javascripts/ration/rationcards.js'
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
        { from: './app/users/central-government.html', to: "central-government.html" }
    ]),
    new CopyWebpackPlugin([
        { from: './app/users/state-government.html', to: "state-government.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/users/customer.html', to: "customer.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/users/fps.html', to: "fps.html" }
    ]),

    new CopyWebpackPlugin([
      { from: './app/approvals/approvals.html', to: "approvals.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/ration/rationcards.html', to: "rationcards.html" }
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
