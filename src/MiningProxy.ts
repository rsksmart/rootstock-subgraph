import { RewardClaimed as RewardClaimedEvent } from '../generated/MiningProxy/MiningProxy'
import { RewardClaimed } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  let entity = new RewardClaimed(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.user = event.params.user
  entity.poolToken = event.params.poolToken
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let user = createAndReturnUser(event.params.user)
  user.availableRewardSov = user.availableRewardSov.plus(event.params.amount)
  user.save()
}
