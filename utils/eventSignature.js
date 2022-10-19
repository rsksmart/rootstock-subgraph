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

    await loadAbiFromFile('./abis/rbtcWrapperProxyTokenConverted.json').then(abi => {
        console.log(`0x${keccak256(abi.eventSignatures()._tail.array[0]).toString('hex')}`)

    });
}

main()