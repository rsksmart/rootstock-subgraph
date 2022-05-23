require('dotenv').config()
const fs = require('fs-extra')
const path = require('path')
const { Command } = require('commander');
const { readFileSync, writeFileSync } = require('fs');
const program = new Command();
program.version('0.0.1');
const yaml = require('js-yaml');
const { dump } = require('js-yaml')

const manifestSections = {
    amm: ["ConverterRegistry", "ConverterFactory", "LiquidityPoolV1Converter", "LiquidityPoolV2Converter", "LiquidityPoolV1ConverterProtocolFee", "SmartToken"],
    governance: [],
    trading: []
}

const pruneManifest = (section) => {
    const contracts = manifestSections[section]
    let doc = yaml.load(fs.readFileSync('./subgraph.yaml', 'utf8'));
    let newDataSources = []
    let newTemplates = []

    for (const dataSource of doc.dataSources) {
        if (!contracts.includes(dataSource.name)) {
            console.log(`${dataSource.name} removed`)
        } else {
            newDataSources.push(dataSource)
            console.log('\x1b[36m%s\x1b[0m', `${dataSource.name} kept`)
        }
    }

    for (const dataSource of doc.templates) {
        if (!contracts.includes(dataSource.name)) {
            console.log(`${dataSource.name} removed`)
        } else {
            newTemplates.push(dataSource)
            console.log('\x1b[36m%s\x1b[0m', `${dataSource.name} kept`)
        }
    }

    doc.dataSources = newDataSources
    doc.templates = newTemplates
    console.log(doc)
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
    if (!manifestSections[section]) {
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

