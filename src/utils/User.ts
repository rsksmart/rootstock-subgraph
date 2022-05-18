import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { User, UserStakeHistory } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'

export function createAndReturnUser(address: Address, timestamp: BigInt): User {
  let userEntity = User.load(address.toHex())

  if (userEntity == null) {
    userEntity = new User(address.toHex())
    userEntity.createdAtTimestamp = timestamp.toI32()
    let protocolStats = createAndReturnProtocolStats()
    protocolStats.totalUsers++
    protocolStats.save()
  }

  userEntity.save()
  return userEntity
}

export function createAndReturnUserStakeHistory(address: Address): UserStakeHistory {
  let historyEntity = UserStakeHistory.load(address.toHex())
  if (historyEntity == null) {
    historyEntity = new UserStakeHistory(address.toHex())
    historyEntity.user = address.toHex()
    historyEntity.totalStaked = BigDecimal.zero()
    historyEntity.totalWithdrawn = BigDecimal.zero()
    historyEntity.totalRemaining = BigDecimal.zero()
    historyEntity.save()
  }
  return historyEntity
}
