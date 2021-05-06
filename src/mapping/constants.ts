import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const LOG_ID = 'XPPAYLOG';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const PPAY_ADDRESS = '0x054d64b73d3d8a21af3d764efd76bcaa774f3bb2';
export const XPPAY_ADDRESS = '0x9fd1d329bb687fef164f529f6f6dcd6f69e7b978';

export enum PERIOD {
  ONE_HOUR,
  ONE_DAY,
  ONE_WEEK,
  ONE_MONTH,
}

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);

export let ONE_HOUR_IN_SECONDS = BigInt.fromI32(3600);        // 60 * 60
export let ONE_DAY_IN_SECONDS = BigInt.fromI32(86400);        // 3600 * 24
export let ONE_WEEK_IN_SECONDS = BigInt.fromI32(604800);      // 86400 * 7
export let ONE_MONTH_IN_SECONDS = BigInt.fromI32(2592000);    // 86400 * 30

export let TOKEN_DECIMAL = BigInt.fromI32(18);
