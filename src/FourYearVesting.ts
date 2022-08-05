import { BigDecimal } from '@graphprotocol/graph-ts'
import { FourYearVestingCreated as FourYearVestingCreatedEvent } from '../generated/FourYearVesting/FourYearVesting'
import { VestingContract } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'
import { VestingContractType } from './utils/types'
import { createAndReturnUser } from './utils/User'

export function handleFourYearVestingCreated(event: FourYearVestingCreatedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params._tokenOwner, event.block.timestamp)
  const newVestingContract = new VestingContract(event.params.fourYearVesting.toHexString())
  newVestingContract.user = event.params._tokenOwner.toHexString()
  newVestingContract.createdAtTimestamp = event.block.timestamp.toI32()
  const oneWeekInSeconds = 604800
  newVestingContract.cliff = oneWeekInSeconds * 4
  newVestingContract.duration = oneWeekInSeconds * 156
  newVestingContract.startingBalance = BigDecimal.zero()
  newVestingContract.currentBalance = BigDecimal.zero()
  newVestingContract.type = VestingContractType.FourYearVesting
  newVestingContract.emittedBy = event.address
  newVestingContract.createdAtTransaction = event.transaction.hash.toHexString()
  newVestingContract.save()
}
