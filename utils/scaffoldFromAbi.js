require('dotenv').config()
const fs = require('fs-extra')
const path = require('path')
const prettier = require('prettier')
const glob = require("glob");
const { abiEvents } = require('@graphprotocol/graph-cli/src/scaffold/schema')
const Protocol = require('@graphprotocol/graph-cli/src/protocols/')
const Scaffold = require('@graphprotocol/graph-cli/src/scaffold')
const toolbox = require('gluegun/toolbox');
const { Command } = require('commander');
const { readFileSync, writeFileSync } = require('fs');
const program = new Command();
const { addTransactionToMapping, addTransactionToSchema } = require('./scaffoldHelpers')
program.version('0.0.1');

const protocolInstance = new Protocol('ethereum')
const ABI = protocolInstance.getABI()

// const { abiEvents, generateMapping, generateSchema } = scaffold

// Subgraph manifest

const generateManifest = ({ dataSources }) => {
  return prettier.format(
    `
specVersion: 0.0.2
schema:
  file: ./schema.graphql
dataSources:
  ${dataSources.map(dataSource => `- ${dataSource}`)
      .join('\n  ')}
  `,
    { parser: 'yaml', bracketSpacing: false })
}

const generateDataSource = ({ abi, contractName, relativePath, scaffoldAll = false }) => {
  // return prettier.format(
  const space = scaffoldAll ? '' : '\n  - '
  return `${space}kind: ethereum/contract
    name: ${contractName}
    network: {{network}}
    source:
      address: '{{${contractName}.address}}'
      abi: ${contractName}
      startBlock: {{${contractName}.startBlock}}
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

const updateMustacheConfigFile = ({ contractName, network = 'mainnet', address, startBlock = 0 }) => {
  const mustacheConfigPath = path.resolve(__dirname + '/../config/' + `RSK.${network}.json`)
  const mustacheConfig = readFileSync(mustacheConfigPath, 'utf8')
  const mustacheConfigParsed = JSON.parse(mustacheConfig)
  mustacheConfigParsed[contractName] = {
    network: 'mainnet',
    address,
    startBlock
  }
  writeFileSync(mustacheConfigPath, JSON.stringify(mustacheConfigParsed), 'utf8')
}

const getAddressFromConfig = (network, contractName) => {
  const contractAddressesPath = path.resolve(__dirname + '/../config/' + `${network}_contracts.json`)
  const contractAddresses = readFileSync(contractAddressesPath, 'utf8')
  const contractAddressesObj = JSON.parse(contractAddresses)
  const address = contractAddressesObj[contractName]
  return address
}

// TODO: get contract addresses from specified json file
// TODO: get contract start block with web3/etherscan or other
// TODO: indexEvents param should be configurable
const startScaffoldAll = async () => {
  console.log('starting scaffolding process')
  const network = process.env.NETWORK || 'mainnet'
  // TODO: move path to env var or config or input args
  const paths = getFilePaths(path.join(__dirname, '../abis'))
  console.log('emptying schema.graphql file content')
  fs.truncateSync('schema.graphql', 0)
  const promises = paths.map(async (filePath) => {
    try {
      const relativePath = path.relative(__dirname + '/../', filePath)
      const pathArr = filePath.split('/')
      const contractName = pathArr[pathArr.length - 1].split('.json')[0]
      address = getAddressFromConfig(network, contractName)
      if (address) {
        console.log(`found address for contract ${contractName}: ${address}`)
      } else {
        throw new Error(`no address provided for contract ${contractName}`)
      }
      console.log(`loading ${contractName} ABI from ${relativePath}`)
      const abi = await loadAbiFromFile(filePath)
      const scaffolds = getScaffoldInstance({
        protocol: protocolInstance,
        abi,
        contract: address,
        network,
        contractName
      })
      const scaffold = scaffolds.scaffold
      const scaffoldWithIndexEvents = scaffolds.scaffoldWithIndexEvents
      console.log(`generating data source for ${contractName}`)
      const dataSource = generateDataSource({ abi, address: null, network, contractName, relativePath, scaffoldAll: true })
      console.log(`updateing mustache json file for ${contractName}`)
      updateMustacheConfigFile({ contractName, network, address })
      console.log(`generating ts file mapping for ${contractName}`)
      const tsCode = scaffoldWithIndexEvents.generateMapping()
      console.log(`writing ts file mapping for ${contractName}`)
      fs.writeFile(`./src/${contractName}.ts`, tsCode)
      console.log(`adding ${contractName} entities to schema.graphsql`)
      const schema = scaffoldWithIndexEvents.generateSchema()
      fs.writeFile(`./schema/${contractName}.graphql`, schema);
      return dataSource
    } catch (error) {
      console.log('error', error)
    }
  })
  const dataSources = await Promise.all(promises)
  console.log(`generating complete manifest for subgraph`)
  const manifest = generateManifest({ dataSources })
  fs.writeFileSync(path.join(__dirname, '../subgraph.template.yaml'), manifest)
  console.log('done')
}

const getScaffoldInstance = (options) => {
  // console.debug("Options", options)
  console.debug("Options", {
    ...options,
    indexEvents: true
  })
  const scaffold = new Scaffold(options)
  const scaffoldWithIndexEvents = new Scaffold({
    ...options,
    indexEvents: true
  })
  console.debug("Scaffold with index events", scaffoldWithIndexEvents)

  return {
    scaffold,
    scaffoldWithIndexEvents
  }
}
const startScaffoldAbi = async (filepath, address, blockNumber, isGenerateMapping, isGenerateSchema) => {
  if (blockNumber === 0 || blockNumber === undefined || blockNumber === null) {
    console.warn(`WARNING: no proper block number provided for ${address} - ${filepath}`)
  }
  console.log('starting scaffolding process')
  const network = process.env.NETWORK || 'mainnet'

  const relativePath = path.relative(__dirname + '/../', filepath)
  const pathArr = relativePath.split('/')
  const contractName = pathArr[pathArr.length - 1].split('.json')[0]
  if (address === undefined || address === null) {
    console.log(`no address provided for ${contractName}, trying to load from json file`)
    address = getAddressFromConfig(network)
    if (address) {
      console.log(`found address for contract ${contractName}: ${address}`)
    } else {
      throw new Error(`no address provided for contract ${contractName}`)
    }
  }
  console.log(`loading ${contractName} ABI from ${relativePath}`)
  const abi = await loadAbiFromFile(relativePath)
  const scaffolds = getScaffoldInstance({
    protocol: protocolInstance,
    abi,
    contract: address,
    network,
    contractName
  })
  console.log("Get scaffold instance", scaffolds)
  const scaffold = scaffolds.scaffold
  const scaffoldWithIndexEvents = scaffolds.scaffoldWithIndexEvents

  console.log(`generating data source for ${contractName}`)
  const dataSource = generateDataSource({ abi, contractName, relativePath })
  console.log(`updateing mustache json file for ${contractName}`)
  updateMustacheConfigFile({ contractName, network, address, startBlock: blockNumber })
  console.log(`generating ts file mapping for ${contractName}`)
  const tsCode = isGenerateMapping ? scaffoldWithIndexEvents.generateMapping() : scaffold.generateMapping()
  const tsCodeWithTx = isGenerateMapping ? addTransactionToMapping(tsCode) : tsCode
  // console.log("Mapping code", tsCodeWithTx)
  console.log(`writing ts file mapping for ${contractName}`)
  fs.writeFile(`./src/${contractName}.ts`, tsCodeWithTx)
  console.log(`adding ${contractName} entities to schema.graphsql`)
  const schema = isGenerateSchema ? scaffoldWithIndexEvents.generateSchema() : scaffold.generateSchema()
  const schemaWithTx = isGenerateSchema ? addTransactionToSchema(schema) : schema
  /** TODO: Add Transaction to schema */
  console.log("Schema code", schemaWithTx)
  fs.writeFile(`./schema/${contractName}.graphql`, schemaWithTx);
  console.log(`adding datasource to manifest for subgraph`)
  fs.appendFile(path.join(__dirname, '../subgraph.template.yaml'), dataSource);
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
