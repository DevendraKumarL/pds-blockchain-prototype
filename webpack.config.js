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
    'rationcards': './app/javascripts/ration/rationcards.js',

    'pds-users': './app/javascripts/pds-users.js',
    'accounts': './app/javascripts/accounts.js',
    'hashGenerator': './app/javascripts/hashGenerator.js',

    'centralGovernmentFood': './app/javascripts/transfers/centralGovernmentFood.js',
    'stateGovernmentFood': './app/javascripts/transfers/stateGovernmentFood.js',
    'fpsFood': './app/javascripts/transfers/fpsFood.js',
    'customerFood': './app/javascripts/transfers/customerFood.js',

    'centralGovernmentEvents': './app/javascripts/events/centralGovernmentEvents.js',
    'stateGovernmentEvents': './app/javascripts/events/stateGovernmentEvents.js',
    'fpsEvents': './app/javascripts/events/fpsEvents.js',
    'customerEvents': './app/javascripts/events/customerEvents.js',
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
    ]),

    new CopyWebpackPlugin([
        { from: './app/pds-users.html', to: "pds-users.html" }
    ]),
    new CopyWebpackPlugin([
        { from: './app/accounts.html', to: "accounts.html" }
    ]),
    new CopyWebpackPlugin([
        { from: './app/hashGeneratorApp.html', to: "hashGeneratorApp.html" }
    ]),

    new CopyWebpackPlugin([
      { from: './app/transfers/central-governmentFood.html', to: "central-governmentFood.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/transfers/state-governmentFood.html', to: "state-governmentFood.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/transfers/fpsFood.html', to: "fpsFood.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/transfers/customerFood.html', to: "customerFood.html" }
    ]),

    new CopyWebpackPlugin([
      { from: './app/events/central-governmentEvents.html', to: "central-governmentEvents.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/events/state-governmentEvents.html', to: "state-governmentEvents.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/events/fpsEvents.html', to: "fpsEvents.html" }
    ]),
    new CopyWebpackPlugin([
      { from: './app/events/customerEvents.html', to: "customerEvents.html" }
    ]),
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
