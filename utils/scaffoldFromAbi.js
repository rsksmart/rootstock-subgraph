const fs = require('fs-extra')
const path = require('path')
const prettier = require('prettier')
const glob = require("glob");
const util = require('../node_modules/@graphprotocol/graph-cli/src/codegen/util')
const ABI = require('../node_modules/@graphprotocol/graph-cli/src/abi')
const scaffold = require('../node_modules/@graphprotocol/graph-cli/src/scaffold')
const toolbox = require('gluegun/toolbox');
const { Command } = require('commander');
const program = new Command();
program.version('0.0.1');

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

const generateDataSource = ({ abi, address, network, blockNumber, contractName, relativePath, scaffoldAll = false }) => {
  // return prettier.format(
  const space = scaffoldAll ? '' : '  - '
  return `${space}kind: ethereum/contract
    name: ${contractName}
    network: ${network}
    source:
      address: '${address}'
      abi: ${contractName}
      startBlock: ${blockNumber}
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
      if (!path.toLowerCase().includes('test') && !path.toLowerCase().includes('mock') && !path.toLowerCase().includes('dummy')) {
        paths.push(path)
      }
    }
  })
  return paths
}

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
const startScaffoldAll = async () => {
  console.log('starting scaffolding process')
  const network = process.env.network || 'mainnet'
  // TODO: move path to env var or config or input args
  const paths = getFilePaths(path.join(__dirname, '../abis'))
  console.log('emptying schema.graphql file content')
  fs.truncateSync('schema.graphql', 0)
  const promises = paths.map(async (filePath) => {
    try {
      const relativePath = path.relative(__dirname + '/../', filePath)
      const pathArr = filePath.split('/')
      const contractName = pathArr[pathArr.length - 1].split('.json')[0]
      console.log(`loading ${contractName} ABI from ${relativePath}`)
      const abi = await loadAbiFromFile(filePath)
      console.log(`generating data source for ${contractName}`)
      const dataSource = generateDataSource({ abi, address: null, network, contractName, relativePath, scaffoldAll: true })
      console.log(`generating ts file mapping for ${contractName}`)
      const tsCode = generateMapping({ abi, indexEvents: true, contractName })
      console.log(`writing ts file mapping for ${contractName}`)
      fs.writeFile(`./src/${contractName}.ts`, tsCode)
      console.log(`adding ${contractName} entities to schema.graphsql`)
      const schema = generateSchema({ abi, indexEvents: true })
      fs.appendFile('schema.graphql', schema);
      return dataSource
    } catch (error) {
      console.log('error', error)
    }
  })
  const dataSources = await Promise.all(promises)
  console.log(`generating complete manifest for subgraph`)
  const manifest = generateManifest({ dataSources })
  fs.writeFileSync(path.join(__dirname, '../subgraph.yaml'), manifest)
  console.log('done')
}

const startScaffoldAbi = async (filepath, address, blockNumber, isGenerateMapping, isGenerateSchema) => {
  console.log('starting scaffolding process')
  const network = process.env.network || 'mainnet'
  const relativePath = path.relative(__dirname + '/../', filepath)
  const pathArr = relativePath.split('/')
  const contractName = pathArr[pathArr.length - 1].split('.json')[0]
  console.log(`loading ${contractName} ABI from ${relativePath}`)
  const abi = await loadAbiFromFile(relativePath)
  console.log(`generating data source for ${contractName}`)
  const dataSource = generateDataSource({ abi, address, network, blockNumber, contractName, relativePath })
  console.log(`generating ts file mapping for ${contractName}`)
  const tsCode = generateMapping({ abi, indexEvents: isGenerateMapping, contractName })
  console.log(`writing ts file mapping for ${contractName}`)
  fs.writeFile(`./src/${contractName}.ts`, tsCode)
  console.log(`adding ${contractName} entities to schema.graphsql`)
  const schema = generateSchema({ abi, indexEvents: isGenerateSchema })
  fs.appendFile('schema.graphql', schema);
  console.log(`adding datasource to manifest for subgraph`)
  fs.appendFile(path.join(__dirname, '../subgraph.yaml'), dataSource);
}

const run = async () => {
  program
    .requiredOption('-all, --scaffoldAll', 'scaffold all abis in the given directory instead of one specific', false)
    .requiredOption('-fp, --filepath <filepath>', 'if scaffoldAll path to contract abi directory, if not path to contract abi file')
    .option('-a, --address <address>', 'contract address')
    .option('-b, --blockNumber <blockNumber>', 'contract deployment block number', 0)
    .option('-gm, --generate-mapping', 'generate contract mapping file', false)
    .option('-gs, --generate-schema', 'generate graphql schema', false)

  program.parse()
  const options = program.opts()
  const { filepath, address, blockNumber, scaffoldAll } = options
  const isGenerateMapping = options.generateMapping
  const isGenerateSchema = options.generateSchema
  if (scaffoldAll) {
    await startScaffoldAll()
  } else {
    await startScaffoldAbi(filepath, address, blockNumber, isGenerateMapping, isGenerateSchema)
  }
}

run().catch(error => {
  console.log('error', error)
  process.exit(1)
})
