import { BigInt, dataSource } from '@graphprotocol/graph-ts'
import {
  ProposalCanceled as ProposalCanceledEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalQueued as ProposalQueuedEvent,
  VoteCast as VoteCastEvent,
} from '../generated/GovernorAlphaEvents/GovernorAlphaEvents'
import { VoteCast, Proposal } from '../generated/schema'

import { createAndReturnTransaction } from './utils/Transaction'

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  let transaction = createAndReturnTransaction(event)
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.canceled = transaction.id
    proposalEntity.save()
  }
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  let transaction = createAndReturnTransaction(event)
  /** Create Proposal event */
  let proposalEntity = new Proposal(dataSource.address().toHexString() + '-' + event.params.id.toString())
  proposalEntity.created = event.transaction.hash.toHex()
  proposalEntity.votesFor = BigInt.zero()
  proposalEntity.votesAgainst = BigInt.zero()
  proposalEntity.countVotersFor = 0
  proposalEntity.countVotersAgainst = 0
  proposalEntity.proposalId = event.params.id.toI32()
  proposalEntity.proposer = event.params.proposer
  proposalEntity.targets = event.params.targets.map<string>((item) => item.toHexString())
  proposalEntity.values = event.params.values
  proposalEntity.signatures = event.params.signatures
  proposalEntity.startBlock = event.params.startBlock.toI32()
  proposalEntity.endBlock = event.params.endBlock.toI32()
  proposalEntity.description = event.params.description
  proposalEntity.timestamp = transaction.timestamp
  proposalEntity.emittedBy = event.address
  proposalEntity.save()
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  let transaction = createAndReturnTransaction(event)

  /** Load and update proposal event */
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.executed = transaction.id
    proposalEntity.save()
  }
}

export function handleProposalQueued(event: ProposalQueuedEvent): void {
  let transaction = createAndReturnTransaction(event)

  /** Load and update proposal event */
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.id.toString())
  if (proposalEntity != null) {
    proposalEntity.queued = transaction.id
    proposalEntity.save()
  }
}

export function handleVoteCast(event: VoteCastEvent): void {
  let entity = new VoteCast(event.transaction.hash.toHex() + '-' + event.logIndex.toString())

  entity.voter = event.params.voter.toHexString()
  entity.proposalId = event.params.proposalId.toI32()
  entity.proposal = event.address.toHexString() + '-' + event.params.proposalId.toHexString()
  entity.support = event.params.support
  entity.votes = event.params.votes
  let transaction = createAndReturnTransaction(event)
  entity.transaction = transaction.id
  entity.timestamp = transaction.timestamp
  entity.emittedBy = event.address
  entity.save()

  /** Load and update proposal event */
  let proposalEntity = Proposal.load(dataSource.address().toHexString() + '-' + event.params.proposalId.toString())
  if (proposalEntity != null) {
    if (event.params.support == true) {
      proposalEntity.votesFor = proposalEntity.votesFor.plus(event.params.votes)
      proposalEntity.countVotersFor++
    } else if (event.params.support == false) {
      proposalEntity.votesAgainst = proposalEntity.votesAgainst.plus(event.params.votes)
      proposalEntity.countVotersAgainst++
    }
    proposalEntity.save()
  }
}
