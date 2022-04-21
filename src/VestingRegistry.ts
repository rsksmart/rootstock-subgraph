import {
  AdminAdded as AdminAddedEvent,
  AdminRemoved as AdminRemovedEvent,
  CSOVReImburse as CSOVReImburseEvent,
  CSOVTokensExchanged as CSOVTokensExchangedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  SOVTransferred as SOVTransferredEvent,
  TeamVestingCreated as TeamVestingCreatedEvent,
  VestingCreated as VestingCreatedEvent,
  TokensStaked as TokensStakedEvent,
} from '../generated/VestingRegistry1/VestingRegistry'
import { VestingCreated as VestingCreatedProxyEvent, TeamVestingCreated as TeamVestingCreatedProxyEvent } from '../generated/VestingRegistryProxy/VestingProxy'
import { VestingContract } from '../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { createAndReturnTransaction } from './utils/Transaction'
import { vestingRegistry1, vestingRegistry2, vestingRegistry3, vestingRegistryFish } from './contracts/contracts'
import { createAndReturnUser } from './utils/User'
import { log } from '@graphprotocol/graph-ts'
import { VestingContractType } from './utils/types'

export function handleAdminAdded(event: AdminAddedEvent): void {}

export function handleAdminRemoved(event: AdminRemovedEvent): void {}

export function handleCSOVReImburse(event: CSOVReImburseEvent): void {}

export function handleCSOVTokensExchanged(event: CSOVTokensExchangedEvent): void {
  /**
   * Genesis vesting contract creation did not trigger a VestingCreated event.
   * However, it did trigger this event.
   */
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleSOVTransferred(event: SOVTransferredEvent): void {}

const vestingContractTypes = new Map<string, string>()
vestingContractTypes.set(vestingRegistry1.toLowerCase(), VestingContractType.Origins)
vestingContractTypes.set(vestingRegistry2.toLowerCase(), VestingContractType.Origins)
vestingContractTypes.set(vestingRegistry3.toLowerCase(), VestingContractType.Rewards)
vestingContractTypes.set(vestingRegistryFish.toLowerCase(), VestingContractType.Fish)

export function handleTeamVestingCreated(event: TeamVestingCreatedEvent): void {
  let entity = new VestingContract(event.params.vesting.toHexString())
  let user = createAndReturnUser(event.params.tokenOwner)
  entity.user = user.id
  entity.cliff = event.params.cliff
  entity.duration = event.params.duration
  entity.startingBalance = event.params.amount
  entity.currentBalance = BigInt.zero()
  let transaction = createAndReturnTransaction(event)
  entity.createdAtTransaction = transaction.id
  entity.createdAtTimestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.type =
    vestingContractTypes.get(event.address.toHexString().toLowerCase()) == VestingContractType.Fish ? VestingContractType.FishTeam : VestingContractType.Team
  entity.save()
}

export function handleTeamVestingCreatedProxy(event: TeamVestingCreatedEvent): void {
  let entity = new VestingContract(event.params.vesting.toHexString())
  let user = createAndReturnUser(event.params.tokenOwner)
  entity.user = user.id
  entity.cliff = event.params.cliff
  entity.duration = event.params.duration
  entity.startingBalance = event.params.amount
  entity.currentBalance = BigInt.zero()
  let transaction = createAndReturnTransaction(event)
  entity.createdAtTransaction = transaction.id
  entity.createdAtTimestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.type =
    vestingContractTypes.get(event.address.toHexString().toLowerCase()) == VestingContractType.Fish ? VestingContractType.FishTeam : VestingContractType.Team
  entity.save()
}

export function handleTokensStaked(event: TokensStakedEvent): void {}

export function handleVestingCreated(event: VestingCreatedEvent): void {
  log.debug('VESTING CREATED', [event.params.vesting.toHexString()])
  let entity = new VestingContract(event.params.vesting.toHexString())
  let user = createAndReturnUser(event.params.tokenOwner)
  entity.user = user.id
  entity.cliff = event.params.cliff
  entity.duration = event.params.duration
  entity.startingBalance = event.params.amount
  entity.currentBalance = BigInt.zero()
  let transaction = createAndReturnTransaction(event)
  entity.createdAtTransaction = transaction.id
  entity.createdAtTimestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.type = vestingContractTypes.get(event.address.toHexString().toLowerCase())
  entity.save()
}

export function handleVestingCreatedProxy(event: VestingCreatedProxyEvent): void {
  log.debug('VESTING CREATED', [event.params.vesting.toHexString()])
  let entity = new VestingContract(event.params.vesting.toHexString())
  let user = createAndReturnUser(event.params.tokenOwner)
  entity.user = user.id
  entity.cliff = event.params.cliff
  entity.duration = event.params.duration
  entity.startingBalance = event.params.amount
  entity.currentBalance = BigInt.zero()
  let transaction = createAndReturnTransaction(event)
  entity.createdAtTransaction = transaction.id
  entity.createdAtTimestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.type = VestingContractType.Rewards
  entity.save()
}
