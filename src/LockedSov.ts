import { DEFAULT_DECIMALS, decimal } from '@protofire/subgraph-toolkit'
import { TokenStaked as TokenStakedEvent } from '../generated/LockedSov/LockedSov'
import { RewardsEarnedAction } from './utils/types'
import { createAndReturnTransaction } from './utils/Transaction'
import { createOrIncrementRewardItem } from './utils/RewardsEarnedHistoryItem'
import { resetAvailableTradingRewards } from './utils/UserRewardsEarnedHistory'
import { SOVAddress } from './contracts/contracts'

export function handleTokenStaked(event: TokenStakedEvent): void {
  const amount = decimal.fromBigInt(event.params._amount, DEFAULT_DECIMALS)
  createAndReturnTransaction(event)
  resetAvailableTradingRewards(event.params._initiator)
  createOrIncrementRewardItem({
    action: RewardsEarnedAction.RewardSovStaked,
    user: event.params._initiator,
    amount: amount,
    timestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    token: SOVAddress,
    event,
  })
}
