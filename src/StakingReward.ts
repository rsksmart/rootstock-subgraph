import { RewardWithdrawn as RewardWithdrawnEvent } from '../generated/StakingReward/StakingReward'
import { RewardWithdrawn } from '../generated/schema'

import { loadTransaction } from './utils/Transaction'
import { createAndReturnUser } from './utils/User'
import { BigInt } from '@graphprotocol/graph-ts'

export function handleRewardWithdrawn(event: RewardWithdrawnEvent): void {
  let entity = new RewardWithdrawn(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.receiver = event.params.receiver
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  let user = createAndReturnUser(event.params.receiver)
  /** TODO: Find out if we can change this to user.availableRewardSov = user.availableRewardSov.minus(event.params.amount)
   * This should have the same effect of reseting it to 0, but the logic would be more future-proof
   */
  user.availableRewardSov = BigInt.zero()
  user.save()
}
