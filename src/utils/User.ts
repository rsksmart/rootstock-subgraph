import { Address, BigInt } from '@graphprotocol/graph-ts'
import { User } from '../../generated/schema'
import { createAndReturnProtocolStats } from './ProtocolStats'

export function createAndReturnUser(address: Address, timestamp: BigInt): User {
  let userEntity = User.load(address.toHex())

  if (userEntity == null) {
    userEntity = new User(address.toHex())
    userEntity.createdAtTimestamp = timestamp.toI32()
    const protocolStats = createAndReturnProtocolStats()
    protocolStats.totalUsers++
    protocolStats.save()
    userEntity.save()
  }

  return userEntity
}
