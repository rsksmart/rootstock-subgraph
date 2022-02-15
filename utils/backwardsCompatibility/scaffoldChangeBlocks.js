/**
 * Case 1 - Address changes, ABI stays the same
 * 1. Find original instance in subgraph.yaml
 * 2. Loop over array of new addresses
 * 3.
 * 
 * Case 2 - ABI changes, no address changes
 * 
 * Case 3 - Address and abi changes
 */

const yaml = require('js-yaml');
const { dump } = require('js-yaml')
const fs = require('fs-extra');
const { wrapperProxyContracts } = require('./changeBlocks')

function scaffoldChangeBlocks(contractObj) {
    try {
        const doc = yaml.load(fs.readFileSync('./subgraph.yaml', 'utf8'));
        const originalContract = doc.dataSources.find(item => item.name === contractObj.originalName)

        if (!originalContract) {
            console.error("ERROR: Original contract is not in the subgraph.yaml. Check for spelling errors in originalName property.")
            return
        }

        let index = doc.dataSources.indexOf(originalContract) + 1

        for (const contract of contractObj.changeBlocks) {
            /** Check if datasource already exists */
            const alreadyExists = doc.dataSources.find(item => item.name === contract.name)
            if (alreadyExists) {
                console.log(`Not scaffolding ${contract.name}. It already exists.`)
            } else {
                const newSource = JSON.parse(JSON.stringify(originalContract))
                newSource.source.address = contract.address
                newSource.source.startBlock = contract.block
                newSource.name = contract.name

                /** Insert new data source into yml json */
                doc.dataSources.splice(index, 0, newSource)
                index++
                console.log(`Scaffolded ${contract.name}`)
            }
        }

        /** Convert json back to yaml */
        const newYamlDoc = dump(doc)

        // console.log(newYamlDoc)

        /** Rewrite subgraph.yaml with new content */
        fs.writeFile('./subgraph.yaml', newYamlDoc)

    } catch (e) {
        console.log(e);
    }
}

scaffoldChangeBlocks(wrapperProxyContracts)