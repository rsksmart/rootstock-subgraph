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
}

export class VestingHistoryActionItem {
  static TokensStaked: string = 'TokensStaked'
  static TeamTokensRevoked: string = 'TeamTokensRevoked'
  static TokensWithdrawn: string = 'TokensWithdrawn'
}
