module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: [
      'es6-shim',
      'mocha',
      'browserify',
      'detectBrowsers'
    ],
    files: [
      './test/**/*.spec.js'
    ],
    preprocessors: {
      './test/**/*.js': ['browserify']
    },
    client: {
      mocha: {
        reporter: 'html',
        ui: 'bdd'
      }
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    autoWatch: false,
    // Use ChromeHeadlessCI in CI environments and
    // test with the detected browser in other environments (e.g. local)
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false,
      postDetection: function(availableBrowsers) {
        const isCI = process.env.CI;
        if (isCI) {
          return ['ChromeHeadlessCI'];
        }
        // Exclude IE and Edge
        // As the new Edge is Chromium-based like Chrome, we're omitting its testing for simplicity
        const filteredBrowsers = availableBrowsers.filter((browser) => {
          return browser !== 'IE' && browser !== 'Edge';
        });
        return filteredBrowsers;
      }
    },
    plugins: [
      'karma-browserify',
      'karma-es6-shim',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher',
      'karma-detect-browsers'
    ],
    singleRun: true,
    concurrency: Infinity
  });

  if (process.env.CI) {
    config.browsers = ['ChromeHeadlessCI'];
  }
};
