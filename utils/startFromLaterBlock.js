import config from '../config/RSK.testnet.json'
// import backupConfig from './RSK.testnetBackup.json'
const fs = require('fs-extra')
const { Command } = require('commander');
const program = new Command();

function setStartBlockForTesting(newStartBlock) {
    const startBlocks = Object.keys(config).map(item => config[item].startBlock).filter(item => item !== undefined)
    const rewriteBackupFile = !(startBlocks.every(v => v === startBlocks[0]))

    if (rewriteBackupFile) {
        fs.writeFile('./utils/RSK.testnetBackup.json', JSON.stringify(config))
        console.log('Backup file written')
    } else {
        console.log('Not writing backup file because it looks like config start blocks have already been altered for testing')
    }

    let newObj = config

    for (const key of Object.keys(newObj)) {
        if (newObj[key].startBlock !== undefined) {
            newObj[key].startBlock = newStartBlock
            console.log("Info", key, newStartBlock)
        }
    }

    fs.writeFile('./config/RSK.testnet.json', JSON.stringify(newObj))
    console.log("Start block set", newStartBlock)
    console.log("Run prepare:RSK:testnet to start from new block")
}

function resetStartBlocks() {
    const filePath = './utils/RSK.testnetBackup.json'
    fs.stat(filePath, function (err, stat) {
        if (err == null) {
            const backupConfig = require('./RSK.testnetBackup.json')
            console.log(backupConfig)
            console.log('Resetting original start blocks')
            fs.writeFile(filePath, JSON.stringify(backupConfig))
            console.log("Finished resetting config file")
        } else {
            console.error(err)
        }
    })
}

const run = async () => {
    program
        .option('-reset, --reset', 'reset block numbers to correct non-test versions')
        .option('-b , --blockNumber <blockNumber>', 'contract deployment block number')
    program.parse()
    const options = program.opts()
    const { reset, blockNumber } = options
    if (reset) {
        await resetStartBlocks()
    } else {
        await setStartBlockForTesting(parseInt(blockNumber))
    }
}

run().catch(error => {
    console.log('error', error)
    process.exit(1)
})
