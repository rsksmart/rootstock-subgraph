import { log } from '@graphprotocol/graph-ts'
import { VestingContract } from '../generated/schema'
import {
  TokensStaked as TokensStakedEvent,
  TokensWithdrawn as TokensWithdrawnEvent,
  VotesDelegated as VotesDelegatedEvent,
} from '../generated/templates/VestingContract/VestingContract'
import { createAndReturnUser } from './utils/User'

export function handleTokensStaked(event: TokensStakedEvent): void {
  log.info('handleTokensStaked: {}', [event.address.toHexString()])
}
export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
  log.info('handleTokensWithdrawn: {}', [event.address.toHexString()])
}
export function handleVotesDelegated(event: VotesDelegatedEvent): void {
  log.info('handleVotesDelegated: {}', [event.address.toHexString(), event.params.caller.toHexString(), event.params.delegatee.toHexString()])
  const vesting = VestingContract.load(event.address.toHexString())
  if (vesting != null) {
    vesting.delegate = createAndReturnUser(event.params.delegatee, event.block.timestamp).id
    vesting.save()
  }
}
