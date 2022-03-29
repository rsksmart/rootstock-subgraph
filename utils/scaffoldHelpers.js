const addImportTransactionString = (str) => {
    const transactionString = `import { createAndReturnTransaction } from './utils/Transaction'

`
    const position = str.indexOf("export")
    return [str.slice(0, position), transactionString, str.slice(position)].join('');
}

const addTransactionMappingString = (str) => {
    const transactionMappingString = `let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()`

    return str.replace(/entity.save\(\)/g, transactionMappingString)
}

const addTransactionToSchema = (str) => {
    const transactionSchemaString = `  timestamp: BigInt!
  emittedBy: Bytes! #address
  transaction: Transaction!
}`

    return str.replace(/\}/g, transactionSchemaString)
}

const addTransactionToMapping = (str) => {
    const addImport = addImportTransactionString(str)
    const addMapping = addTransactionMappingString(addImport)
    return addMapping
}

module.exports = {
    addTransactionToMapping,
    addTransactionToSchema
}