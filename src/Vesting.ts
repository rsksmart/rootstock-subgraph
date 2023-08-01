import { VestingContract } from '../generated/schema'
import { VotesDelegated as VotesDelegatedEvent } from '../generated/templates/VestingContract/VestingContract'
import { createAndReturnUser } from './utils/User'

export function handleVotesDelegated(event: VotesDelegatedEvent): void {
  const vesting = VestingContract.load(event.address.toHexString())
  if (vesting != null) {
    vesting.delegate = createAndReturnUser(event.params.delegatee, event.block.timestamp).id
    vesting.save()
  }
}
