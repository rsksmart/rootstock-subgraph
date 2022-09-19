import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { UserStakeHistory } from '../../generated/schema'

function loadUserStakeHistory(address: Address): UserStakeHistory {
  let historyEntity = UserStakeHistory.load(address.toHex())
  if (historyEntity == null) {
    historyEntity = new UserStakeHistory(address.toHex())
    historyEntity.user = address.toHex()
    historyEntity.totalStaked = BigDecimal.zero()
    historyEntity.totalWithdrawn = BigDecimal.zero()
    historyEntity.totalRemaining = BigDecimal.zero()
  }
  return historyEntity
}

export function incrementUserStakeHistory(user: Address, amount: BigDecimal): void {
  const userStakeHistory = loadUserStakeHistory(user)
  userStakeHistory.totalStaked = userStakeHistory.totalStaked.plus(amount)
  userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.plus(amount)
  userStakeHistory.save()
}

export function decrementUserStakeHistory(user: Address, amount: BigDecimal, slashingFee: BigDecimal): void {
  const userStakeHistory = loadUserStakeHistory(user)
  userStakeHistory.totalStaked = userStakeHistory.totalWithdrawn.plus(amount)
  userStakeHistory.totalRemaining = userStakeHistory.totalRemaining.minus(amount.plus(slashingFee))
  userStakeHistory.save()
}
