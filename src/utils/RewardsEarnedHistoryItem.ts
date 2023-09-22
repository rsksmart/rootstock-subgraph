import { Bytes, Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { RewardsEarnedHistoryItem } from '../../generated/schema'

class CreateOrIncrementRewardParams {
  action: string
  transactionHash: Bytes
  user: Address
  amount: BigDecimal
  timestamp: BigInt
  token: string
  event: ethereum.Event
}

export function createOrIncrementRewardItem(params: CreateOrIncrementRewardParams): void {
  let rewardsEarnedHistoryItem = RewardsEarnedHistoryItem.load(params.transactionHash.toHexString() + '-' + params.event.logIndex.toString())
  if (rewardsEarnedHistoryItem == null) {
    rewardsEarnedHistoryItem = new RewardsEarnedHistoryItem(params.transactionHash.toHexString() + '-' + params.event.logIndex.toString())
    rewardsEarnedHistoryItem.action = params.action
    rewardsEarnedHistoryItem.user = params.user.toHexString()
    rewardsEarnedHistoryItem.amount = params.amount
    rewardsEarnedHistoryItem.timestamp = params.timestamp.toI32()
    rewardsEarnedHistoryItem.transaction = params.transactionHash.toHexString()
  } else {
    rewardsEarnedHistoryItem.amount = rewardsEarnedHistoryItem.amount.plus(params.amount)
  }
  rewardsEarnedHistoryItem.token = params.token
  rewardsEarnedHistoryItem.save()
}
