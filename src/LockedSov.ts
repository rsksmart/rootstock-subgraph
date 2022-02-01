import { Deposited as DepositedEvent } from '../generated/LockedSov/LockedSov'
import { Deposited } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleDeposited(event: DepositedEvent): void {
  let entity = new Deposited(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity._initiator = event.params._initiator
  entity._userAddress = event.params._userAddress
  entity._sovAmount = event.params._sovAmount
  entity._basisPoint = event.params._basisPoint
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let user = createAndReturnUser(event.params._userAddress)
  user.availableRewardSov = user.availableRewardSov.plus(event.params._sovAmount)
  user.save()
}

/** TODO:
 * Add mapping for TokensStaked event on LockedSov contract. It should set user.availableTradingRewards to 0
 */
