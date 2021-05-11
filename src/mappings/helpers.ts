import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { Spaceport, SpaceportStat, Token, UpdateQueue } from '../types/schema';
import { ERC20 } from '../types/SpaceportFactory/ERC20';
import { ERC20NameBytes } from '../types/SpaceportFactory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../types/SpaceportFactory/ERC20SymbolBytes';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport';
import {
  BI_18,
  LOG_ID,
  ONE_BI,
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS, ONE_MONTH_IN_SECONDS,
  ONE_WEEK_IN_SECONDS,
  PERIOD, STATUS_ACTIVE, STATUS_QUEUED, STATUS_SUCCESS,
  ZERO_BI,
} from './constants';

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  // hard coded overrides
  if (tokenAddress.toHexString() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') {
    return 'DGD'
  }
  if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return 'AAVE'
  }

  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  // hard coded overrides
  if (tokenAddress.toHexString() == '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a') {
    return 'DGD'
  }
  if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return 'Aave Token'
  }

  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = null
  let totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult as i32
  }
  return BigInt.fromI32(totalSupplyValue as i32)
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  // hardcode overrides
  if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return BigInt.fromI32(18)
  }

  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = null
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return BigInt.fromI32(decimalValue as i32)
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString())
  // Fetch info if null
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.name = fetchTokenName(tokenAddress)
    token.totalSupply = fetchTokenTotalSupply(tokenAddress)
    let decimals = fetchTokenDecimals(tokenAddress)
    if (decimals !== null) {
      token.decimals = decimals
    } else {
      token.decimals = BI_18
    }
    token.save();
  }
  return token as Token;
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

/**
 * Build data timeframes (for hour, day, week, month)
 * @param blockTimestamp
 * @param spaceport
 */
export function createTimeFrames(blockTimestamp: BigInt, spaceport: Spaceport): void {
  let periods = new Array<PERIOD>(4);
  periods[0] = PERIOD.ONE_HOUR;
  periods[1] = PERIOD.ONE_DAY;
  periods[2] = PERIOD.ONE_WEEK;
  periods[3] = PERIOD.ONE_MONTH;

  for (let i = 0; i < periods.length; i++) {
    let period = periods[i];
    let periodInSeconds = periodToSeconds(period);
    let periodIndex = blockTimestamp.div(periodInSeconds); // Get unique hour within unix history
    let periodStart = periodIndex.times(periodInSeconds); // Want the rounded effect
    let timeFrameID = periodIndex.toString() + "-" + spaceport.id;

    let timeFrame = SpaceportStat.load(timeFrameID);
    if (timeFrame === null) {
      timeFrame = new SpaceportStat(timeFrameID);
      timeFrame.spaceport = spaceport.id;
      timeFrame.period = getPeriodName(period);
      timeFrame.periodStart = periodStart;
    }

    timeFrame.participantsCount = spaceport.participantsCount;
    timeFrame.depositTotal = spaceport.depositTotal;

    timeFrame.save();
  }
}

/**
 * Converting period name to period in seconds (PERIOD.ONE_HOUR => 3600)
 * @param period
 */
export function periodToSeconds(period: PERIOD): BigInt {
  switch (period) {
    case PERIOD.ONE_HOUR:
      return ONE_HOUR_IN_SECONDS;
    case PERIOD.ONE_DAY:
      return ONE_DAY_IN_SECONDS;
    case PERIOD.ONE_WEEK:
      return ONE_WEEK_IN_SECONDS;
    case PERIOD.ONE_MONTH:
      return ONE_MONTH_IN_SECONDS;
    default:
      return ONE_HOUR_IN_SECONDS;
  }
}

/**
 * Returns period name for stored in BD
 * @param period
 */
export function getPeriodName(period: PERIOD): string {
  switch (period) {
    case PERIOD.ONE_HOUR:
      return 'ONE_HOUR';
    case PERIOD.ONE_DAY:
      return 'ONE_DAY';
    case PERIOD.ONE_WEEK:
      return 'ONE_WEEK';
    case PERIOD.ONE_MONTH:
      return 'ONE_MONTH';
    default:
      return 'ONE_HOUR';
  }
}

export function getStatus(statusId: BigInt): string {
  if (statusId.equals(STATUS_QUEUED)) {
    return 'QUEUED';
  } else if (statusId.equals(STATUS_ACTIVE)) {
    return 'ACTIVE';
  } else if (statusId.equals(STATUS_SUCCESS)) {
    return 'SUCCESS';
  } else {
    return 'FAILED';
  }
}

/**
 * Add spaceport to the update queue
 * @param spaceportId
 * @param blockNumber
 */
export function addToUpdateQueue(spaceportId: string, blockNumber: BigInt): void {
  let updateQueueId = blockNumber.plus(ONE_BI).toString();
  let updateQueue = UpdateQueue.load(updateQueueId);
  if (updateQueue === null) {
    updateQueue = new UpdateQueue(updateQueueId);
    updateQueue.spaceports = [];
  }
  let spaceports = updateQueue.spaceports;
  spaceports.push(spaceportId);
  updateQueue.spaceports = spaceports;

  updateQueue.save();

  logger('The space port has been added to the update queue {}', [updateQueueId]);
}

/**
 * To call spaceport contract and get new status
 * @param spaceportId
 */
export function updateSpaceportStatus(spaceportId: string): void {
  let spaceport = Spaceport.load(spaceportId);
  if (spaceport == null) {
    return;
  }
  let spaceportContract = SpaceportContract.bind(Address.fromString(spaceportId));
  let statusId = spaceportContract.spaceportStatus();

  let oldStatus = spaceport.status;
  spaceport.status = getStatus(statusId);
  spaceport.save();

  logger('The spaceport status has been changed {} => {}', [oldStatus, spaceport.status]);
}

/**
 * Write log message in graph console with the log ID
 * @param msg
 * @param args
 */
export function logger(msg: string, args: Array<string>): void {
  args.unshift(LOG_ID)
  log.debug('{}: ' + msg, args);
}
