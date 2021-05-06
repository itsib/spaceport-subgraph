import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts';
import { ERC20 } from '../types/PlasmaStaking/ERC20';
import { Action, TimeFrame, User } from '../types/schema';
import {
  ADDRESS_ZERO,
  LOG_ID,
  ONE_BI,
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
  ONE_MONTH_IN_SECONDS,
  ONE_WEEK_IN_SECONDS,
  PERIOD,
  PPAY_ADDRESS,
  TOKEN_DECIMAL,
  XPPAY_ADDRESS,
  ZERO_BI,
} from './constants';

export let PPAY = ERC20.bind(Address.fromString(PPAY_ADDRESS));
export let XPPAY = ERC20.bind(Address.fromString(XPPAY_ADDRESS));

/**
 * Create user and update user xPPAY balance
 * @param address
 */
export function createUser(address: Address): User | null {
  let strAddress = address.toHexString();
  if (strAddress == ADDRESS_ZERO || strAddress == XPPAY_ADDRESS) {
    return null;
  }

  let user = User.load(strAddress);
  if (user === null) {
    user = new User(address.toHexString());
    logger('Create user with address {}', [strAddress]);
  }

  user.balance = toDecimalAmount(XPPAY.balanceOf(address));
  user.save();

  return user;
}

/**
 * Build data timeframes (for hour, day, week, month)
 * @param blockTimestamp
 * @param ppayBalance
 * @param totalSupply
 */
export function createTimeFrames(blockTimestamp: BigInt, ppayBalance: BigDecimal, totalSupply: BigDecimal): void {
  let periods = new Array<PERIOD>(4);
  periods[0] = PERIOD.ONE_HOUR;
  periods[1] = PERIOD.ONE_DAY;
  periods[2] = PERIOD.ONE_WEEK;
  periods[3] = PERIOD.ONE_MONTH;

  let rate = ppayBalance.div(totalSupply);

  for (let i = 0; i < periods.length; i++) {
    let period = periods[i];
    let periodInSeconds = periodToSeconds(period);
    let periodIndex = blockTimestamp.div(periodInSeconds); // Get unique hour within unix history
    let periodStart = periodIndex.times(periodInSeconds); // Want the rounded effect
    let timeFrameID = periodIndex.toString();

    let timeFrame = TimeFrame.load(timeFrameID);
    if (timeFrame === null) {
      timeFrame = new TimeFrame(timeFrameID);
      timeFrame.period = getPeriodName(period);
      timeFrame.periodStart = periodStart;
    }

    timeFrame.ppayBalance = ppayBalance;
    timeFrame.totalSupply = totalSupply;
    timeFrame.rate = rate;

    timeFrame.save();
  }
}

/**
 * Create user action (mint, burn, send, receive)
 * @param timestamp
 * @param txHash
 * @param type
 * @param userId
 * @param amount
 * @param rate
 * @param balance - The balance at the time of the transaction.
 */
export function createAction(timestamp: BigInt, txHash: string, type: string, userId: string, amount: BigDecimal, rate: BigDecimal, balance: BigDecimal): void {
  let actionId = txHash.concat('_').concat(type);

  let action = Action.load(actionId);
  if (action) {
    logger('Action with id {} already exist', [actionId]);
    return;
  }

  action = new Action(actionId);
  action.type = type;
  action.user = userId;
  action.amount = amount;
  action.balance = balance;
  action.rate = rate;
  action.timestamp = timestamp;

  action.save();
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

/**
 * Convert BigInt tokens amount to BigDecimal (2000000000000000000 => 2)
 * @param amount
 */
export function toDecimalAmount(amount: BigInt): BigDecimal {
  let bigDecimal = BigDecimal.fromString('1');
  for (let i = ZERO_BI; i.lt(TOKEN_DECIMAL); i = i.plus(ONE_BI)) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString('10'));
  }
  return amount.toBigDecimal().div(bigDecimal);
}

/**
 * Round to 18 decimal places
 * @param amount
 */
export function roundToTokenDecimal(amount: BigDecimal): BigDecimal {
  let bigDecimal = BigDecimal.fromString('1');
  for (let i = ZERO_BI; i.lt(TOKEN_DECIMAL); i = i.plus(ONE_BI)) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString('10'));
  }

  let splitted = amount.times(bigDecimal).toString().split('.');
  let integer = splitted[0];

  return BigDecimal.fromString(integer).div(bigDecimal);
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
