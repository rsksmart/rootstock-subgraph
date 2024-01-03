import { Address, BigInt } from '@graphprotocol/graph-ts'
import { User } from '../../generated/schema'

export function createAndReturnUser(address: Address, timestamp: BigInt): User {
  let userEntity = User.load(address.toHex())

  if (userEntity == null) {
    userEntity = new User(address.toHex())
    userEntity.createdAtTimestamp = timestamp.toI32()
    userEntity.save()
  }

  return userEntity
}
