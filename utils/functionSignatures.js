/**
 * This script prints the call signature of all the functions of an ABI
 * It is a work in progress,to be used for creating a csv file of all call signatures that appear in this subgraph
 */

require('dotenv').config()
const { Command } = require('commander');
const program = new Command();
const fs = require('fs-extra')
program.version('0.0.1');
const keccak256 = require('keccak256')
const { loadAbiFromFile } = require('./helpers')

async function main() {
    const csvFile = './functionSignatures.csv'
    if (fs.existsSync(csvFile)) {
        fs.unlinkSync(csvFile)
    }
    fs.createFile(csvFile)
    fs.readdir('./abis', async (err, files) => {
        files.forEach(async (file) => {
            console.log(file)
            const filePath = `abis/${file}`
            const contractName = file.split('.json')[0]
            await loadAbiFromFile(filePath).then(abi => {
                if (abi.callFunctionSignatures()._tail !== undefined) {
                    abi.callFunctionSignatures()._tail.array.forEach(item => {
                        const functionName = item.slice(0, item.indexOf('('))
                        const signature = `0x${keccak256(item).toString('hex').slice(0, 8)}`
                        fs.appendFile(csvFile, `${contractName}, ${functionName}, ${signature}\n`)
                    }
                    )
                }
            })
        });
    });
}

main()