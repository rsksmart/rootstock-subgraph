import { Address, BigInt } from '@graphprotocol/graph-ts'
import { User, UserStakeHistory } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'

export function createAndReturnUser(address: Address): User {
  let userEntity = User.load(address.toHex())

  if (userEntity == null) {
    userEntity = new User(address.toHex())
    userEntity.numSwaps = 0
    let protocolStats = createAndReturnProtocolStats()
    protocolStats.totalUsers = protocolStats.totalUsers.plus(BigInt.fromI32(1))
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
    historyEntity.totalStaked = BigInt.zero()
    historyEntity.totalWithdrawn = BigInt.zero()
    historyEntity.totalRemaining = BigInt.zero()
    historyEntity.save()
  }
  return historyEntity
}
