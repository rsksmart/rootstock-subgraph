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
import { SOVTransferred, VestingContract } from '../generated/schema'
import { VestingLogic as VestingContractTemplate } from '../generated/templates'

import { loadTransaction } from './utils/Transaction'
import { vestingRegistry3 } from './contracts/contracts'
import { createAndReturnUser } from './utils/User'
import { log } from '@graphprotocol/graph-ts'

export function handleAdminAdded(event: AdminAddedEvent): void {}

export function handleAdminRemoved(event: AdminRemovedEvent): void {}

export function handleCSOVReImburse(event: CSOVReImburseEvent): void {}

export function handleCSOVTokensExchanged(event: CSOVTokensExchangedEvent): void {}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {}

export function handleSOVTransferred(event: SOVTransferredEvent): void {
  let entity = new SOVTransferred(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.receiver = event.params.receiver.toHexString()
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()
}

export function handleTeamVestingCreated(event: TeamVestingCreatedEvent): void {
  log.debug('VESTING CREATED', [event.params.vesting.toHexString()])
  let entity = new VestingContract(event.params.vesting.toHexString())
  let user = createAndReturnUser(event.params.tokenOwner)
  entity.user = user.id
  entity.cliff = event.params.cliff
  entity.duration = event.params.duration
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.createdAtTransaction = transaction.id
  entity.createdAtTimestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.type = 'Team'
  entity.save()

  VestingContractTemplate.create(event.params.vesting)
}

export function handleTokensStaked(event: TokensStakedEvent): void {}

export function handleVestingCreated(event: VestingCreatedEvent): void {
  log.debug('VESTING CREATED', [event.params.vesting.toHexString()])
  let entity = new VestingContract(event.params.vesting.toHexString())
  let user = createAndReturnUser(event.params.tokenOwner)
  entity.user = user.id
  entity.cliff = event.params.cliff
  entity.duration = event.params.duration
  entity.amount = event.params.amount
  let transaction = loadTransaction(event)
  entity.createdAtTransaction = transaction.id
  entity.createdAtTimestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.type = event.address.toHexString().toLowerCase() == vestingRegistry3.toLowerCase() ? 'Rewards' : 'Non-team'
  entity.save()

  VestingContractTemplate.create(event.params.vesting)
}
