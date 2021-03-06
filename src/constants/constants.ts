import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const LOG_ID = 'LOG765026354';

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString('0');
export let ONE_BD = BigDecimal.fromString('1');
export let BI_18 = BigInt.fromI32(18);

export let STATUS_QUEUED = BigInt.fromI32(0);
export let STATUS_ACTIVE = BigInt.fromI32(1);
export let STATUS_SUCCESS = BigInt.fromI32(2);
export let STATUS_FAILED = BigInt.fromI32(3);
