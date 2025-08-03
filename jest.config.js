module.exports = {
    testEnvironment: 'node',
    reporters: [
      'default',
      ['jest-junit', { outputFile: 'junit.xml' }]
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov']
  };