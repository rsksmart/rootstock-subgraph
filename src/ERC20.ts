import { Approval as ApprovalEvent, Transfer as TransferEvent } from '../generated/templates/ERC20/ERC20'
import { Approval, Transfer } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.owner = event.params.owner
  entity.spender = event.params.spender
  entity.value = event.params.value
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}
