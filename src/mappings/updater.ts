import { BigInt } from '@graphprotocol/graph-ts';
import { Address, EthereumBlock, EthereumEvent } from '@graphprotocol/graph-ts/index';
import { STATUS_FAILED, STATUS_SUCCESS } from '../constants/constants';
import { HISTORY_NODE_START_OF } from '../constants/variables';
import { Spaceport, SpaceportsToUpdate } from '../types/schema';
import { SpaceportInfo as SpaceportContract } from '../types/Updater/SpaceportInfo';
import { Approval, Deposit, Transfer, Withdrawal } from '../types/Updater/Updater';
import { getStatusName } from '../utils/get-status-name';
import { logger, warning } from '../utils/log';

/**
 * To call spaceport contract and get new status
 * @param spaceportId
 * @param block
 */
function updateSpaceportStatus(spaceportId: string, block: EthereumBlock): void {
  if (HISTORY_NODE_START_OF.gt(block.number)) {
    return;
  }

  let spaceport = Spaceport.load(spaceportId);
  if (spaceport == null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }
  let spaceportContract = SpaceportContract.bind(Address.fromString(spaceportId));
  let result = spaceportContract.try_spaceportStatus();
  if (result.reverted) {
    warning('Couldn\'t update spaceport status {}', [spaceportId]);
    return;
  }

  let oldStatus = spaceport.status;

  if (spaceport.finishedAtTimestamp == null && (result.value.equals(STATUS_FAILED) || result.value.equals(STATUS_SUCCESS))) {
    spaceport.finishedAtTimestamp = block.timestamp;
  }
  spaceport.status = result.value;
  spaceport.save();

  let oldStatusName = getStatusName(oldStatus);
  let newStatusName = getStatusName(spaceport.status);

  logger('The spaceport status has been changed {} => {}', [oldStatusName, newStatusName]);
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
    updateSpaceportStatus(spaceportId, event.block);
  }
}

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
