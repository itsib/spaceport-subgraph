import { BigInt } from '@graphprotocol/graph-ts';
import { ethereum, store } from '@graphprotocol/graph-ts/index';
import { LatestUpdatedBlock, UpdateTask } from '../types/schema';
import { Approval, Deposit, Withdrawal } from '../types/Updater/Updater';
import { ONE_BI, ONE_MINUTE_IN_SECONDS, THIRTEEN_BI, UPDATE_PERIOD_IN_SECONDS } from './constants';
import { logger, updateSpaceportStatus } from './helpers';

export function handleWithdrawal(event: Withdrawal): void {
  updateSpaceports(event)
}

export function handleApproval(event: Approval): void {
  updateSpaceports(event)
}

export function handleDeposit(event: Deposit): void {
  updateSpaceports(event)
}

function updateSpaceports(event: ethereum.Event): void {
  // Get stored latest updated block
  let lastUpdatedBlock = LatestUpdatedBlock.load('1');
  if (lastUpdatedBlock === null) {
    lastUpdatedBlock = new LatestUpdatedBlock('1');
    lastUpdatedBlock.blockNumber = event.block.number.minus(ONE_BI);
    lastUpdatedBlock.blockTimestamp = event.block.timestamp.minus(THIRTEEN_BI);
  }

  // Update stats every UPDATE_PERIOD_IN_SECONDS, not more often.
  if (event.block.timestamp.minus(lastUpdatedBlock.blockTimestamp).lt(UPDATE_PERIOD_IN_SECONDS)) {
    return;
  }

  // Call updateSpaceportStatus for each spaceport from queue
  let blocksCount = event.block.number.minus(lastUpdatedBlock.blockNumber).toI32();
  for (let i = 0; i < blocksCount; ++i) {
    let updateQueueId = lastUpdatedBlock.blockNumber.plus(BigInt.fromI32(i)).toString();
    let updateQueue = UpdateTask.load(updateQueueId);

    if (updateQueue !== null) {
      handleQueue(updateQueue as UpdateTask, event);

      store.remove('UpdateTask', updateQueueId);
      logger('Spaceport has been updated for block number - {}', [updateQueueId])
    }
  }

  // Store block number as latest handled
  lastUpdatedBlock.blockNumber = event.block.number;
  lastUpdatedBlock.blockTimestamp = event.block.timestamp;
  lastUpdatedBlock.save();
}

function handleQueue(updateQueue: UpdateTask, event: ethereum.Event): void {
  let currentBlockTime = event.block.timestamp;
  let spaceports = updateQueue.spaceports;

  for (let j = 0; j < spaceports.length; j++) {
    let spaceportId = spaceports[j];
    updateSpaceportStatus(spaceportId, currentBlockTime);
  }
}
