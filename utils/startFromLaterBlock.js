const fs = require('fs-extra')
const { Command } = require('commander');
const program = new Command();
const yaml = require('js-yaml');
const { dump } = require('js-yaml')

function setStartBlockForTesting(blockNumber) {
    try {
        let doc = yaml.load(fs.readFileSync('./subgraph.yaml', 'utf8'));
        doc.dataSources.forEach(item => item.source.startBlock = blockNumber)

        /** Convert json back to yaml */
        const newYamlDoc = dump(doc, { lineWidth: -1 })

        /** Rewrite subgraph.yaml with new content */
        fs.writeFile('./subgraph.yaml', newYamlDoc)
        console.log('New subgraph.yaml written with block number: ', blockNumber)
        console.log('To reset, just run the npm prepare script.')

    } catch (e) {
        console.log(e);
    }
}

const run = async () => {
    program
        .option('-b , --blockNumber <blockNumber>', 'contract deployment block number')
    program.parse()
    const options = program.opts()
    const { blockNumber } = options
    await setStartBlockForTesting(parseInt(blockNumber))

}

run().catch(error => {
    console.log('error', error)
    process.exit(1)
})

