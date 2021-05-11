import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const LOG_ID = 'LOG765026354';

export const EVENT_EMITTER_ADDRESS_MAIN = '0xc00e94cb662c3520282e6f5717214004a7f26888';  // In Mainnet
export const EVENT_EMITTER_ADDRESS_KOVAN = '0x4d6bb4ed029b33cf25d0810b029bd8b1a6bcab7b';  // In Kovan

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);

export enum PERIOD {
  ONE_HOUR,
  ONE_DAY,
  ONE_WEEK,
  ONE_MONTH,
}

export let STATUS_QUEUED = BigInt.fromI32(0);
export let STATUS_ACTIVE = BigInt.fromI32(1);
export let STATUS_SUCCESS = BigInt.fromI32(2);
export let STATUS_FAILED = BigInt.fromI32(3);


export let ONE_HOUR_IN_SECONDS = BigInt.fromI32(3600);        // 60 * 60
export let ONE_DAY_IN_SECONDS = BigInt.fromI32(86400);        // 3600 * 24
export let ONE_WEEK_IN_SECONDS = BigInt.fromI32(604800);      // 86400 * 7
export let ONE_MONTH_IN_SECONDS = BigInt.fromI32(2592000);    // 86400 * 30
