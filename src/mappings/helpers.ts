import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';
import { Spaceport, SpaceportStatistic, SpaceportsToUpdate, Token } from '../types/schema';
import { ERC20 } from '../types/SpaceportFactory/ERC20';
import { ERC20NameBytes } from '../types/SpaceportFactory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../types/SpaceportFactory/ERC20SymbolBytes';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport';
import { BI_18, ONE_BI, STATUS_ACTIVE, STATUS_FAILED, STATUS_QUEUED, STATUS_SUCCESS, ZERO_BI } from './constants';
import { logger, warning } from './log';

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
      } else {
        warning('Cannot find symbol for token {}', [tokenAddress.toHexString()]);
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
      } else {
        warning('Cannot find token name {}', [tokenAddress.toHexString()]);
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  if (tokenAddress.toHexString() == '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9') {
    return BigInt.fromI32(18)
  }

  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = null
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
    return BigInt.fromI32(decimalValue as i32)
  } else {
    warning('Cannot find token decimals {}', [tokenAddress.toHexString()]);
    return BI_18;
  }
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString())
  // Fetch info if null
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.name = fetchTokenName(tokenAddress)
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
export function createTimeframe(blockTimestamp: BigInt, spaceport: Spaceport): void {
  let timeframeId = blockTimestamp.toString() + "-" + spaceport.id;

  let timeframe = SpaceportStatistic.load(timeframeId);
  if (timeframe === null) {
    timeframe = new SpaceportStatistic(timeframeId);
    timeframe.spaceport = spaceport.id;
    timeframe.timestamp = blockTimestamp;
  }
  timeframe.participantsCount = spaceport.participantsCount;
  timeframe.depositTotal = spaceport.depositTotal;
  timeframe.save();
}

export function getStatusName(statusId: BigInt): string {
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
 * To call spaceport contract and get new status
 * @param spaceportId
 * @param timestamp
 */
export function updateSpaceportStatus(spaceportId: string, timestamp: BigInt): void {
  let spaceport = Spaceport.load(spaceportId);
  if (spaceport == null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }
  let spaceportContract = SpaceportContract.bind(Address.fromString(spaceportId));
  let result = spaceportContract.try_spaceportStatus();
  if (result.reverted) {
    warning('Couldn\'t update spaceport status {}', [spaceportId]);
    return;
  }

  let oldStatus = spaceport.status;

  if (spaceport.finishedAtTimestamp == null && (result.value.equals(STATUS_FAILED) || result.value.equals(STATUS_SUCCESS))) {
    spaceport.finishedAtTimestamp = timestamp;
  }
  spaceport.status = result.value;
  spaceport.save();

  let oldStatusName = getStatusName(oldStatus);
  let newStatusName = getStatusName(spaceport.status);

  logger('The spaceport status has been changed {} => {}', [oldStatusName, newStatusName]);
}

/**
 * Add spaceport to the update queue
 * @param spaceportId
 * @param updateAtBlockNumbers
 */
export function addToUpdateQueue(spaceportId: string, updateAtBlockNumbers: Array<BigInt>): void {
  let spaceportsToUpdate = SpaceportsToUpdate.load('1');
  if (spaceportsToUpdate === null) {
    spaceportsToUpdate = new SpaceportsToUpdate('1');
    spaceportsToUpdate.latestUpdatedBlock = ONE_BI;
    spaceportsToUpdate.spaceports = [];
    spaceportsToUpdate.blockNumbers = [];
  }

  let spaceports = spaceportsToUpdate.spaceports;
  let blockNumbers = spaceportsToUpdate.blockNumbers;

  for (let i = 0; i < updateAtBlockNumbers.length; ++i) {
    spaceports.push(spaceportId);
    blockNumbers.push(updateAtBlockNumbers[i]);
  }

  spaceportsToUpdate.spaceports = spaceports;
  spaceportsToUpdate.blockNumbers = blockNumbers;

  spaceportsToUpdate.save();

  logger('The spaceport {} has been added to the update queue', [spaceportId]);
}
