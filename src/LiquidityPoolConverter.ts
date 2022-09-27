import {
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
  Activation as ActivationEvent,
  Conversion as ConversionEventV1,
  LiquidityPoolV1Converter as LiquidityPoolV1Contract,
  WithdrawFees as WithdrawFeesEvent,
} from '../generated/templates/LiquidityPoolV1Converter/LiquidityPoolV1Converter'
import {
  Conversion as ConversionEventV2,
  LiquidityPoolV2Converter as LiquidityPoolV2Contract,
} from '../generated/templates/LiquidityPoolV2Converter/LiquidityPoolV2Converter'
import { Conversion as ConversionEventV1WithProtocol } from '../generated/templates/LiquidityPoolV1ConverterProtocolFee/LiquidityPoolV1ConverterProtocolFee'
import { Conversion, LiquidityPool, LiquidityPoolToken, Token, Transaction } from '../generated/schema'
import { ConversionEventForSwap, createAndReturnSwap, updatePricing } from './utils/Swap'
import { createAndReturnToken, decimalizeFromToken } from './utils/Token'
import { createAndReturnTransaction } from './utils/Transaction'
import { BigInt, dataSource, Address } from '@graphprotocol/graph-ts'
import { createAndReturnSmartToken } from './utils/SmartToken'
import { createAndReturnPoolToken } from './utils/PoolToken'
import { updateVolumes } from './utils/Volumes'
import { updateCandleSticks } from './utils/Candlesticks'
import { LiquidityHistoryType } from './utils/types'
import { decrementPoolBalance, incrementPoolBalance } from './utils/LiquidityPool'
import { updateLiquidityHistory } from './utils/UserLiquidityHistory'
import { decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import { incrementProtocolAmmTotals, incrementUserAmmTotals } from './utils/ProtocolStats'

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  createAndReturnTransaction(event)
  const liquidityPool = LiquidityPool.load(event.address.toHexString())
  const liquidityPoolToken = LiquidityPoolToken.load(event.address.toHexString() + event.params._reserveToken.toHexString())
  const token = Token.load(event.params._reserveToken.toHexString())

  if (liquidityPool != null && liquidityPoolToken != null && token != null) {
    updateLiquidityHistory({
      id: event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
      user: event.transaction.from.toHexString(),
      type: LiquidityHistoryType.Added,
      provider: event.params._provider.toHexString(),
      reserveToken: event.params._reserveToken.toHexString(),
      amount: decimalizeFromToken(event.params._amount, token),
      newBalance: decimalizeFromToken(event.params._newBalance, token),
      newSupply: decimalizeFromToken(event.params._newSupply, token),
      transaction: event.transaction.hash.toHexString(),
      timestamp: event.block.timestamp,
      emittedBy: event.address.toHexString(),
      liquidityPool: liquidityPool,
      liquidityPoolToken: liquidityPoolToken,
      token: event.params._reserveToken,
    })
  }
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  createAndReturnTransaction(event)
  const liquidityPool = LiquidityPool.load(event.address.toHexString())
  const liquidityPoolToken = LiquidityPoolToken.load(event.address.toHexString() + event.params._reserveToken.toHexString())
  const token = Token.load(event.params._reserveToken.toHexString())

  if (liquidityPool != null && liquidityPoolToken != null && token != null) {
    updateLiquidityHistory({
      id: event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
      user: event.transaction.from.toHexString(),
      type: LiquidityHistoryType.Removed,
      provider: event.params._provider.toHexString(),
      reserveToken: event.params._reserveToken.toHexString(),
      amount: decimalizeFromToken(event.params._amount, token),
      newBalance: decimalizeFromToken(event.params._newBalance, token),
      newSupply: decimalizeFromToken(event.params._newSupply, token),
      transaction: event.transaction.hash.toHexString(),
      timestamp: event.block.timestamp,
      emittedBy: event.address.toHexString(),
      liquidityPool: liquidityPool,
      liquidityPoolToken: liquidityPoolToken,
      token: event.params._reserveToken,
    })
  }
}

/** This event is triggered when a pool is activated or deactivated
 * TODO: Dry up this code by creating a base ABI with only the methods shared by all liquidity pools
 */
export function handleActivation(event: ActivationEvent): void {
  createAndReturnTransaction(event)
  const liquidityPool = LiquidityPool.load(dataSource.address().toHex())

  if (liquidityPool != null) {
    liquidityPool.activated = event.params._activated

    if (event.params._activated == true) {
      const smartToken = createAndReturnSmartToken(event.params._anchor)
      liquidityPool.smartToken = smartToken.smartToken.id
    }

    if (event.params._type == 1) {
      const contract = LiquidityPoolV1Contract.bind(event.address)
      const reserveTokenCountResult = contract.try_reserveTokenCount()
      if (!reserveTokenCountResult.reverted) {
        for (let i = 0; i < reserveTokenCountResult.value; i++) {
          const reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
          if (!reserveTokenResult.reverted) {
            createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
            createAndReturnPoolToken(event.params._anchor, event.address, reserveTokenResult.value)
          }
          if (i == 0) {
            liquidityPool.token0 = reserveTokenResult.value.toHexString()
          } else if (i == 1) {
            liquidityPool.token1 = reserveTokenResult.value.toHexString()
          }
        }
      }
    } else if (event.params._type == 2) {
      const contract = LiquidityPoolV2Contract.bind(event.address)
      const reserveTokenCountResult = contract.try_reserveTokenCount()
      if (!reserveTokenCountResult.reverted) {
        for (let i = 0; i < reserveTokenCountResult.value; i++) {
          const reserveTokenResult = contract.try_reserveTokens(BigInt.fromI32(i))
          if (!reserveTokenResult.reverted) {
            createAndReturnToken(reserveTokenResult.value, event.address, event.params._anchor)
            const poolTokenResult = contract.try_poolToken(reserveTokenResult.value)
            if (!poolTokenResult.reverted) {
              createAndReturnPoolToken(poolTokenResult.value, event.address, reserveTokenResult.value)
            }
          }
          if (i == 0) {
            liquidityPool.token0 = reserveTokenResult.value.toHexString()
          } else if (i == 1) {
            liquidityPool.token1 = reserveTokenResult.value.toHexString()
          }
        }
      }
    }

    liquidityPool.save()
  }
}

export function handleConversionV1(event: ConversionEventV1): void {
  const transaction = createAndReturnTransaction(event)

  handleConversion({
    transaction: transaction,
    logIndex: event.logIndex,
    liquidityPool: event.address,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: event.params._amount,
    toAmount: event.params._return,
    trader: event.params._trader,
    user: event.transaction.from,
    conversionFee: event.params._conversionFee,
    protocolFee: BigInt.zero(),
  })
}

export function handleConversionV2(event: ConversionEventV2): void {
  const transaction = createAndReturnTransaction(event)

  handleConversion({
    transaction: transaction,
    logIndex: event.logIndex,
    liquidityPool: event.address,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: event.params._amount,
    toAmount: event.params._return,
    trader: event.params._trader,
    user: event.transaction.from,
    conversionFee: event.params._conversionFee,
    protocolFee: BigInt.zero(),
  })
}

export function handleConversionV1_2(event: ConversionEventV1WithProtocol): void {
  const transaction = createAndReturnTransaction(event)

  handleConversion({
    transaction: transaction,
    logIndex: event.logIndex,
    liquidityPool: event.address,
    fromToken: event.params._fromToken,
    toToken: event.params._toToken,
    fromAmount: event.params._amount,
    toAmount: event.params._return,
    trader: event.params._trader,
    user: event.transaction.from,
    conversionFee: event.params._conversionFee,
    protocolFee: event.params._protocolFee,
  })
}

class IConversionEvent {
  transaction: Transaction
  logIndex: BigInt
  liquidityPool: Address
  fromToken: Address
  toToken: Address
  fromAmount: BigInt
  toAmount: BigInt
  trader: Address
  user: Address
  conversionFee: BigInt
  protocolFee: BigInt
}

function handleConversion(event: IConversionEvent): void {
  const toToken = Token.load(event.toToken.toHexString())
  const fromToken = Token.load(event.fromToken.toHexString())
  const toDecimals = toToken !== null ? toToken.decimals : DEFAULT_DECIMALS
  const fromAmount = decimal.fromBigInt(event.fromAmount, fromToken !== null ? fromToken.decimals : DEFAULT_DECIMALS)
  const toAmount = decimal.fromBigInt(event.toAmount, toDecimals)
  const conversionFee = decimal.fromBigInt(event.conversionFee, toDecimals)
  const protocolFee = decimal.fromBigInt(event.protocolFee, toDecimals)
  let liquidityPool = LiquidityPool.load(event.liquidityPool.toHexString())

  const entity = new Conversion(event.transaction.id + '-' + event.logIndex.toString())
  entity._fromToken = event.fromToken.toHexString()
  entity._toToken = event.toToken.toHexString()
  entity._trader = event.trader
  entity._amount = fromAmount
  entity._return = toAmount
  entity._conversionFee = conversionFee
  entity._protocolFee = protocolFee
  entity.transaction = event.transaction.id
  entity.timestamp = event.transaction.timestamp
  entity.emittedBy = event.liquidityPool.toHexString()
  entity.blockNumber = event.transaction.blockNumber
  entity.save()

  const parsedEvent: ConversionEventForSwap = {
    transactionHash: event.transaction.id,
    fromToken: event.fromToken,
    toToken: event.toToken,
    fromAmount: fromAmount,
    toAmount: toAmount,
    timestamp: event.transaction.timestamp,
    user: event.user,
    trader: event.trader,
    lpFee: conversionFee,
    protocolFee: protocolFee,
  }

  createAndReturnSwap(parsedEvent)
  updatePricing(parsedEvent)
  updateVolumes(parsedEvent, dataSource.address())
  updateCandleSticks(parsedEvent)
  if (liquidityPool != null) {
    liquidityPool = incrementPoolBalance(liquidityPool, event.fromToken, fromAmount)
    decrementPoolBalance(liquidityPool, event.toToken, toAmount)
  }
  if (toToken != null) {
    incrementProtocolAmmTotals(toAmount, conversionFee, protocolFee, toToken)
    incrementUserAmmTotals(toAmount, conversionFee, protocolFee, toToken, event.user)
  }
}

/** For debugging: Emitted from SOV pool at 2425895 */
export function handleWithdrawFees(event: WithdrawFeesEvent): void {
  const liquidityPool = LiquidityPool.load(event.address.toHexString())
  const token = Token.load(event.params.token.toHexString())
  if (liquidityPool !== null && token !== null) {
    const feeAmount = decimal.fromBigInt(event.params.protocolFeeAmount, token.decimals)
    decrementPoolBalance(liquidityPool, event.params.token, feeAmount)
  }
}
