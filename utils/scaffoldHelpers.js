const addImportTransactionString = (str) => {
    const transactionString = `import { loadTransaction } from './utils/Transaction'

`
    const position = str.indexOf("export")
    return [str.slice(0, position), transactionString, str.slice(position)].join('');
}

const addTransactionMappingString = (str) => {
    const transactionMappingString = `let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.save()`

    return str.replace(/entity.save\(\)/g, transactionMappingString)
}

const addTransactionToSchema = (str) => {
    const transactionSchemaString = `  transaction: Transaction!
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