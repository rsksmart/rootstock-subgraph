/**
 * Load subgraph.template.yaml
 * Make array of strings of event handler names
 * For each, load the correct file and search for handler name
 * Throw error if handler is not found
 */

require('dotenv').config()
const fs = require('fs-extra')
const { Command } = require('commander');
const program = new Command();
program.version('0.0.1');
const yaml = require('js-yaml');

function main() {
    console.log("Testing handlers exist")
    let doc = yaml.load(fs.readFileSync('./subgraph.template.yaml', 'utf8'));
    let handlers = doc.dataSources.map(item => {
        return {
            file: item.mapping.file,
            handlers: item.mapping.eventHandlers.map(item => item.handler)
        }
    })
    handlers.forEach(item => {
        /** Load js file */
        fs.readFile(`${item.file}`, function (err, data) {
            if (err) throw err;
            item.handlers.forEach(functionName => {
                if (data.indexOf(functionName) < 0) {
                    console.error(`${functionName} missing from file ${item.file}`)
                    process.exit(1)
                }
            })
        });
    })
    console.log("All handlers exist\n\n")
    process.exit(0)
}

main()