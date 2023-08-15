import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { FourYearVestingCreated as FourYearVestingCreatedEvent } from '../generated/FourYearVesting/FourYearVesting'
import { VestingContract } from '../generated/schema'
import { VestingContract as VestingLogic } from '../generated/templates/VestingContract/VestingContract'
import { VestingContract as VestingContractTemplate } from '../generated/templates'
import { createAndReturnTransaction } from './utils/Transaction'
import { VestingContractType } from './utils/types'
import { createAndReturnUser } from './utils/User'

export function handleFourYearVestingCreated(event: FourYearVestingCreatedEvent): void {
  createAndReturnTransaction(event)
  createAndReturnUser(event.params._tokenOwner, event.block.timestamp)

  VestingContractTemplate.create(event.params.fourYearVesting)
  log.info('FourYearVesting created: {}', [event.params.fourYearVesting.toHexString()])

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

  const contract = VestingLogic.bind(event.params.fourYearVesting)
  const token = contract.try_SOV()
  const staking = contract.try_staking()

  if (!token.reverted) {
    newVestingContract.token = token.value
  }

  if (!staking.reverted) {
    newVestingContract.staking = staking.value
  }

  newVestingContract.save()
}
