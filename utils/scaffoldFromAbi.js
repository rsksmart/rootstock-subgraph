const fs = require('fs-extra')
const path = require('path')
const prettier = require('prettier')
const glob = require("glob");
const util = require('../node_modules/@graphprotocol/graph-cli/src/codegen/util')
const ABI = require('../node_modules/@graphprotocol/graph-cli/src/abi')
const scaffold = require('../node_modules/@graphprotocol/graph-cli/src/scaffold')
const toolbox = require('gluegun/toolbox')

const { abiEvents, generateMapping, generateSchema } = scaffold

// Subgraph manifest

const generateManifest = ({ dataSources }) => {
  return prettier.format(
    `
specVersion: 0.0.1
schema:
  file: ./schema.graphql
dataSources:
  ${dataSources.map(dataSource => `- ${dataSource}`)
      .join('\n  ')}
  `,
    { parser: 'yaml' })
}

const generateDataSource = ({ abi, address, network, contractName, relativePath }) => {
  // return prettier.format(
  return `kind: ethereum/contract
    name: ${contractName}
    network: ${network}
    source:
      address: '${address}'
      abi: ${contractName}
      startBlock: <enter start block here or comment out>
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.5
      language: wasm/assemblyscript
      entities:
        ${abiEvents(abi)
      .map(event => `- ${event.get('_alias')}`)
      .join('\n        ')}
      abis:
        - name: ${contractName}
          file: ./${relativePath}
      eventHandlers:
        ${abiEvents(abi)
      .map(
        event => `
        - event: ${ABI.eventSignature(event)}
          handler: handle${event.get('_alias')}`,
      )
      .join('')}
      file: ./src/${contractName}.ts
`
  // { parser: 'yaml' })
}

var getDirectories = function (src) {
  const directories = glob.sync(src + '/**/*');
  return directories
};

const getFilePaths = (src) => {
  const directories = getDirectories(src);
  const paths = []
  directories.forEach((path) => {
    const stat = fs.lstatSync(path)
    if (stat.isFile(path)) {
      paths.push(path)
    }
  })
  return paths
}
// getDirectories('test', function (err, res) {
//   if (err) {
//     console.log('Error', err);
//   } else {
//     console.log(res);
//   }
// });

const loadAbiFromFile = async filename => {
  let exists = await toolbox.filesystem.exists(filename)

  if (!exists) {
    throw Error('File does not exist.')
  } else if (exists === 'dir') {
    throw Error('Path points to a directory, not a file.')
  } else if (exists === 'other') {
    throw Error('Not sure what this path points to.')
  } else {
    return await ABI.load('Contract', filename)
  }
}

// TODO: get contract addresses from specified json file
// TODO: get contract start block with web3/etherscan or other
// TODO: indexEvents param should be configurable
const run = async () => {
  const network = process.env.network || 'mainnet'
  // TODO: move path to env var or config or input args
  const paths = getFilePaths(path.join(__dirname, '../abis'))
  fs.truncateSync('schema.graphql', 0)
  const promises = paths.map(async (filePath) => {
    try {
      const relativePath = path.relative(__dirname + '/../', filePath)
      // console.log('🚀 ~ file: scaffoldFromAbi.js ~ line 105 ~ promises ~ relativePath', relativePath)
      const pathArr = filePath.split('/')
      const contractName = pathArr[pathArr.length - 1].split('.json')[0]
      const abi = await loadAbiFromFile(filePath)
      const dataSource = generateDataSource({ abi, address: null, network, contractName, relativePath })

      const tsCode = generateMapping({ abi, indexEvents: true, contractName })
      await fs.writeFile(`./src/${contractName}.ts`, tsCode)
      const schema = generateSchema({ abi, indexEvents: true })
      await fs.appendFile('schema.graphql', schema);
      console.log('🚀 ~ file: scaffoldFromAbi.js ~ line 113 ~ promises ~ schema', schema)
      return dataSource
    } catch (error) {
      console.log('error', error)
    }
  })
  const dataSources = await Promise.all(promises)
  const manifest = generateManifest({ dataSources })
  fs.writeFileSync(path.join(__dirname, '../subgraph.yaml'), manifest)
}

run()
