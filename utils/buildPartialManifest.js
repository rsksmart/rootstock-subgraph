require('dotenv').config()
const fs = require('fs-extra')
const { Command } = require('commander');
const program = new Command();
program.version('0.0.1');
const yaml = require('js-yaml');
const { dump } = require('js-yaml')

const manifestSections = {
    amm: ["ConverterRegistry", "ConverterFactory", "LiquidityPoolV1Converter", "LiquidityPoolV2Converter", "LiquidityPoolV1ConverterProtocolFee", "SmartToken"],
    voting: ["ManagedWallet"],
    trading: [],
    bridge: ["BridgeETH", "BridgeBSC", "Federation"],
    // sovrynProtocol: [...amm, "ISovryn"]
    vestingStaking: ["FourYearVesting", "Staking", "VestingRegistryProxy", "VestingRegistry1", "VestingRegistry2", "VestingRegistry3", "VestingRegistryFish"],
    fastBTC: ["FastBTCBridge", "ManagedWallet"]
}

const keyWords = {
    stakingVesting: ["Staking", "Vesting"],
    managedWallet: ["ManagedWallet"]
}

const pruneManifest = (section) => {
    const contracts = manifestSections[section] || []
    const keyword = keyWords[section] || []
    let doc = yaml.load(fs.readFileSync('./subgraph.yaml', 'utf8'));
    let newDataSources = []
    let newTemplates = []

    const appendNewDataSources = (dataSource, arr) => {
        const containsKeywords = keyword.filter(item => dataSource.name.includes(item)).length > 0
        if (!contracts.includes(dataSource.name) && !containsKeywords) {
            console.log(`${dataSource.name} removed`)
        } else {
            arr.push(dataSource)
            console.log('\x1b[36m%s\x1b[0m', `${dataSource.name} kept`)
        }
    }

    for (const dataSource of doc.dataSources) {
        appendNewDataSources(dataSource, newDataSources)
    }

    for (const dataSource of doc.templates) {
        appendNewDataSources(dataSource, newTemplates)
    }

    doc.dataSources = newDataSources
    doc.templates = newTemplates
    const newYamlDoc = dump(doc, { lineWidth: -1 })
    fs.writeFile('./subgraph.yaml', newYamlDoc)
    console.log("Partial manifest written")
}

const run = async () => {
    program
        .requiredOption('-sect, --section <section>', 'section you want to scaffold')
    program.parse()
    const options = program.opts()
    const { section } = options

    console.log(section)
    if (!manifestSections[section] && !keyWords[section]) {
        console.error(`Valid sections are: ${Object.keys(manifestSections)}`)
        throw new Error(`${section} is not a valid section`)
    } else {
        pruneManifest(section)
    }
}

run().catch(error => {
    console.log('error', error)
    process.exit(1)
})

