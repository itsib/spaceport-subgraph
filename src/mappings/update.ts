import { BigInt } from '@graphprotocol/graph-ts';
import { ethereum, store } from '@graphprotocol/graph-ts/index';
import { LatestUpdatedBlock, UpdateTask } from '../types/schema';
import { Approval, Deposit, Withdrawal } from '../types/Updater/Updater';
import { ONE_BI } from './constants';
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
  let currentBlockNumber = event.block.number;

  // Get stored latest updated block
  let lastUpdatedBlock = LatestUpdatedBlock.load('1');
  if (lastUpdatedBlock === null) {
    lastUpdatedBlock = new LatestUpdatedBlock('1');
    lastUpdatedBlock.blockNumber = currentBlockNumber.minus(ONE_BI);
  }

  if (lastUpdatedBlock.blockNumber.equals(currentBlockNumber)) {
    return;
  }

  // Call updateSpaceportStatus for each spaceport from queue
  let blocksCount = currentBlockNumber.minus(lastUpdatedBlock.blockNumber).toI32();
  for (let i = 0; i < blocksCount; ++i) {
    let updateQueueId = lastUpdatedBlock.blockNumber.plus(BigInt.fromI32(i)).toString();
    let updateQueue = UpdateTask.load(updateQueueId);

    if (updateQueue !== null) {
      updateQueue.spaceports.forEach(spaceportId => {
        updateSpaceportStatus(spaceportId);
      });

      store.remove('UpdateTask', updateQueueId);
      logger('Spaceport has been updated for block number - {}', [updateQueueId])
    }
  }

  // Store block number as latest handled
  lastUpdatedBlock.blockNumber = currentBlockNumber;
  lastUpdatedBlock.save();
}
