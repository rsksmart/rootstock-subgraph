const Protocol = require('@graphprotocol/graph-cli/dist/protocols/').default
const toolbox = require('gluegun/toolbox');
const protocolInstance = new Protocol('ethereum')
const ABI = protocolInstance.getABI()


const loadAbiFromFile = async filename => {
    let exists = await toolbox.filesystem.exists(filename)
    if (!exists) {
        throw Error(`File ${filename} does not exist.`)
    } else if (exists === 'dir') {
        throw Error('Path points to a directory, not a file.')
    } else if (exists === 'other') {
        throw Error('Not sure what this path points to.')
    } else {
        return await ABI.load('Contract', filename)
    }
}

module.exports = {
    loadAbiFromFile
}