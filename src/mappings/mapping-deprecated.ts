import { Address, BigInt, EthereumBlock } from '@graphprotocol/graph-ts';
import { ONE_BI, STATUS_FAILED, STATUS_SUCCESS } from '../constants/constants';
import { HISTORY_NODE_START_OF } from '../constants/variables';
import { Spaceport } from '../types/schema';
import {
  DeprecatedSpaceport as SpaceportContract,
  spaceportAddLiquidity,
  spaceportUserDeposit,
  spaceportUserWithdrawBaseTokens,
  spaceportUserWithdrawTokens,
} from '../types/templates/DeprecatedSpaceport/DeprecatedSpaceport';
import { addToUpdateQueue } from '../utils/add-to-update-queue';
import { claimSpaceTokens } from '../utils/claim-space-tokens';
import { createTimeframe } from '../utils/create-timeframe';
import { getStatusName } from '../utils/get-status-name';
import { logger, warning } from '../utils/log';
import { updateParticipantDeposit } from '../utils/update-participant-deposit';
import { withdrawBaseTokens } from '../utils/withdraw-base-tokens';

/**
 * To call spaceport contract and get new status
 * @param spaceport
 * @param block
 */
function updateSpaceportStatus(spaceport: Spaceport, block: EthereumBlock): void {
  if (HISTORY_NODE_START_OF.gt(block.number)) {
    return;
  }

  let spaceportContract = SpaceportContract.bind(Address.fromString(spaceport.id));
  let result = spaceportContract.try_spaceportStatus();
  if (result.reverted) {
    warning('Couldn\'t update spaceport status {}', [spaceport.id]);
    return;
  }

  let oldStatus = spaceport.status;

  if (spaceport.finishedAtTimestamp == null && (result.value.equals(STATUS_FAILED) || result.value.equals(STATUS_SUCCESS))) {
    spaceport.finishedAtTimestamp = block.timestamp;
  }
  spaceport.status = result.value;

  let oldStatusName = getStatusName(oldStatus);
  let newStatusName = getStatusName(spaceport.status);

  logger('The spaceport status has been changed {} => {}', [oldStatusName, newStatusName]);
}

/**
 * Check and update start/end blocks
 * @param spaceport
 * @param block
 */
function updateSpaceportBlocks(spaceport: Spaceport, block: EthereumBlock): void {
  if (HISTORY_NODE_START_OF.gt(block.number)) {
    return;
  }

  let spaceportContract = SpaceportContract.bind(Address.fromString(spaceport.id));
  let result = spaceportContract.try_SPACEPORT_INFO();
  if (result.reverted) {
    warning('Fetch SPACEPORT_INFO error for {}', [spaceport.id]);
    return;
  }

  let startBlock = result.value.value10;
  let endBlock = result.value.value11;

  if (spaceport.startBlock != startBlock || spaceport.endBlock != endBlock) {
    spaceport.startBlock = startBlock;
    spaceport.endBlock = endBlock;
    addToUpdateQueue(spaceport.id, [startBlock, endBlock.plus(ONE_BI)]);
  }
}

export function handleUserDeposit(event: spaceportUserDeposit): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  updateParticipantDeposit(event.transaction.from.toHexString(), event.params.value, spaceport as Spaceport, event.block.timestamp);
  updateSpaceportStatus(spaceport as Spaceport, event.block);
  updateSpaceportBlocks(spaceport as Spaceport, event.block);

  spaceport.save();

  createTimeframe(event.block.timestamp, spaceport as Spaceport);
}

export function handleAddLiquidity(event: spaceportAddLiquidity): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  spaceport.lpGenerationComplete = true;
  spaceport.lpGenerationCompleteTime = event.block.timestamp;

  updateSpaceportStatus(spaceport as Spaceport, event.block);
  updateSpaceportBlocks(spaceport as Spaceport, event.block);

  spaceport.save();
}

/**
 * The user withdraws the nested tokens if the IDO failed
 * @param event
 */
export function handleUserWithdrawBaseTokens(event: spaceportUserWithdrawBaseTokens): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  withdrawBaseTokens(event.transaction.from.toHexString(), spaceport as Spaceport);
  updateSpaceportStatus(spaceport as Spaceport, event.block);
  updateSpaceportBlocks(spaceport as Spaceport, event.block);

  spaceport.save();

  createTimeframe(event.block.timestamp, spaceport as Spaceport);
}

export function handleUserWithdrawTokens(event: spaceportUserWithdrawTokens): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  claimSpaceTokens(event.transaction.from.toHexString(), event.params.value, spaceport as Spaceport);
  updateSpaceportBlocks(spaceport as Spaceport, event.block);

  spaceport.save();
}
