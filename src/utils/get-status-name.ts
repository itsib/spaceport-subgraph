import { BigInt } from '@graphprotocol/graph-ts/index';
import { STATUS_ACTIVE, STATUS_QUEUED, STATUS_SUCCESS } from '../constants/constants';

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
