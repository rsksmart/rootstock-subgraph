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

const wrapperProxyContracts = {
    originalName: "FeeSharingProxy",
    changeBlocks: [
        {
            name: "FeeSharingProxy1729783",
            address: '0xFFB9470e0B11aAC25a331D8E6Df557Db6c3c0c53',
            block: 1729783
        },
        {
            name: "FeeSharingProxy1748059",
            address: '0x106f117Af68586A994234E208c29DE0f1A764C60',
            block: 1748059
        },
        {
            name: "FeeSharingProxy1834540",
            address: '0x2C468f9c82C20c37cd1606Cf3a09702f94910691',
            block: 1834540
        },
        {
            name: "FeeSharingProxy1839810",
            address: '0x6b1a4735b1E25ccE9406B2d5D7417cE53d1cf90e',
            block: 1839810
        },
    ]
}

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
                const newSource = JSON.parse(JSON.stringify(feeSharingProxy))
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