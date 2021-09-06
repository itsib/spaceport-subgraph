import { BigInt } from '@graphprotocol/graph-ts';
import { EthereumEvent } from '@graphprotocol/graph-ts/index';
import { SpaceportsToUpdate } from '../types/schema';
import { Approval, Deposit, Transfer, Withdrawal } from '../types/Updater/Updater';
import { updateSpaceportStatus } from './helpers';

export function handleWithdrawal(event: Withdrawal): void {
  updateSpaceports(event)
}

export function handleTransfer(event: Transfer): void {
  updateSpaceports(event)
}

export function handleApproval(event: Approval): void {
  updateSpaceports(event)
}

export function handleDeposit(event: Deposit): void {
  updateSpaceports(event)
}

function updateSpaceports(event: EthereumEvent): void {
  let spaceportsToUpdate = SpaceportsToUpdate.load('1');
  if (spaceportsToUpdate === null || spaceportsToUpdate.latestUpdatedBlock.equals(event.block.number)) {
    return;
  }

  let spaceports: string[] = spaceportsToUpdate.spaceports;
  let blockNumbers: BigInt[] = spaceportsToUpdate.blockNumbers;

  let spaceportsIdsNotUpdate = new Array<string>(0);
  let blockNumbersNotUpdate = new Array<BigInt>(0);
  let spaceportsIdsToUpdate = new Array<string>(0);

  // Find spaceports to update
  for (let i = 0; i < spaceports.length; ++i) {
    let spaceportId = spaceports[i];
    let blockNumber = blockNumbers[i];

    if (blockNumber.le(event.block.number)) {
      let index = spaceportsIdsToUpdate.indexOf(spaceportId as string);
      if (index == -1) {
        spaceportsIdsToUpdate.push(spaceportId as string);
      }
    } else {
      spaceportsIdsNotUpdate.push(spaceportId as string);
      blockNumbersNotUpdate.push(blockNumber as BigInt);
    }
  }

  // Nothing to update
  if (spaceportsIdsToUpdate.length == 0) {
    return;
  }

  spaceportsToUpdate.latestUpdatedBlock = event.block.number;
  spaceportsToUpdate.spaceports = spaceportsIdsNotUpdate;
  spaceportsToUpdate.blockNumbers = blockNumbersNotUpdate;
  spaceportsToUpdate.save();

  // Update spaceports
  for (let i = 0; i < spaceportsIdsToUpdate.length; i++) {
    let spaceportId = spaceportsIdsToUpdate[i];
    updateSpaceportStatus(spaceportId, event.block.timestamp);
  }
}
