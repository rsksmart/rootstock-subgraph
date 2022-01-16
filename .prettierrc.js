module.exports = {
  ...require('@protofire/subgraph-toolkit/prettier.config.js'),

  printWidth: 160,

  overrides: [
    {
      files: '*.json',
      options: {
        "tabWidth": 2,
        "useTabs": false,
        "semi": false,
        "printWidth": 160,
        "singleQuote": true
      },
    },
  ],
}
