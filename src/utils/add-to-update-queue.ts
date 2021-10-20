import { BigInt } from '@graphprotocol/graph-ts/index';
import { ONE_BI } from '../constants/constants';
import { SpaceportsToUpdate } from '../types/schema';
import { logger } from './log';

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
