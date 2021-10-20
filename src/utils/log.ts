import { log } from '@graphprotocol/graph-ts/index';
import { LOG_ID } from '../constants/constants';

/**
 * Write log message in graph console with the log ID
 * @param msg
 * @param args
 */
export function logger(msg: string, args: Array<string>): void {
  args.unshift(LOG_ID)
  log.info('{}: ' + msg, args);
}

/**
 * Write log message in graph console with the log ID
 * @param msg
 * @param args
 */
export function warning(msg: string, args: Array<string>): void {
  args.unshift(LOG_ID)
  log.warning('{}: ' + msg, args);
}

/**
 * Write log message in graph console with the log ID
 * @param msg
 * @param args
 */
export function error(msg: string, args: Array<string>): void {
  args.unshift(LOG_ID)
  log.error('{}: ' + msg, args);
}
