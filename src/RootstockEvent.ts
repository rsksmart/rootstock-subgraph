import { Log as LogEvent } from '../generated/RootstockEvent/RootstockEvent'
import { Log } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'

export function handleLog(event: LogEvent): void {
  const entity = new Log(event.transaction.hash.concatI32(event.logIndex.toI32()))
  entity.sender = event.params.sender
  entity.message = event.params.message

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  const transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
