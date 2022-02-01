import { ethereum } from '@graphprotocol/graph-ts'
import { Transaction } from '../../generated/schema'

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.gasLimit = event.transaction.gasLimit
    transaction.gasPrice = event.transaction.gasPrice
    transaction.index = event.transaction.index
    transaction.from = event.transaction.from
    transaction.to = event.transaction.to
    transaction.value = event.transaction.value
    transaction.save()
  }
  return transaction as Transaction
}
