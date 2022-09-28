export class LendingHistoryType {
  static Lend: string = 'Lend'
  static UnLend: string = 'UnLend'
}

export class LiquidityHistoryType {
  static Added: string = 'Added'
  static Removed: string = 'Removed'
}

export class LoanType {
  static Trade: string = 'Trade'
  static Borrow: string = 'Borrow'
}

export class RewardsEarnedAction {
  static StakingRewardWithdrawn: string = 'StakingRewardWithdrawn'
  static EarnReward: string = 'EarnReward'
  static RewardClaimed: string = 'RewardClaimed'
  static RewardSovStaked: string = 'RewardSovStaked'
  static UserFeeWithdrawn: string = 'UserFeeWithdrawn'
}

export class StakeHistoryAction {
  static Stake: string = 'Stake'
  static IncreaseStake: string = 'IncreaseStake'
  static ExtendStake: string = 'ExtendStake'
  static Delegate: string = 'Delegate'
  static Unstake: string = 'Unstake'
  static WithdrawStaked: string = 'WithdrawStaked'
  static FeeWithdrawn: string = 'FeeWithdrawn'
}

export class VestingContractType {
  static Origins: string = 'Origins'
  static Genesis: string = 'Genesis'
  static Fish: string = 'Fish'
  static FishTeam: string = 'FishTeam'
  static Team: string = 'Team'
  static Rewards: string = 'Rewards'
  static FourYearVesting: string = 'FourYearVesting'
  static Strategic: string = 'Strategic'
}

export class VestingHistoryActionItem {
  static TokensStaked: string = 'TokensStaked'
  static TeamTokensRevoked: string = 'TeamTokensRevoked'
  static TokensWithdrawn: string = 'TokensWithdrawn'
}

export class CrossDirection {
  static Incoming: string = 'Incoming'
  static Outgoing: string = 'Outgoing'
}

export class CrossStatus {
  static Voting: string = 'Voting'
  static Executed: string = 'Executed'
  static Revoked: string = 'Revoked'
}

export class BridgeChain {
  static RSK: string = 'RSK'
  static ETH: string = 'ETH'
  static BSC: string = 'BSC'
}

export class BridgeType {
  static RSK_BSC: string = 'RSK_BSC'
  static RSK_ETH: string = 'RSK_ETH'
}

export class PoolTokenType {
  static Lending: string = 'Lending'
  static Amm: string = 'Amm'
}

export class ProtocolFeeType {
  static Trading: string = 'Trading'
  static Borrowing: string = 'Borrowing'
  static Lending: string = 'Lending'
  static AMM: string = 'AMM'
}

export class SwapType {
  static Market: string = 'Market'
  static Limit: string = 'Limit'
  static Other: string = 'Other'
}
