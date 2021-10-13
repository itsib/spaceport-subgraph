import { BigDecimal } from '@graphprotocol/graph-ts';
import { Participant, Spaceport, Token, User } from '../types/schema';
import {
  spaceportAddLiquidity,
  spaceportForceFailByPlfi,
  spaceportForceFailIfPairExists,
  spaceportUpdateBlocks,
  spaceportUserDeposit,
  spaceportUserWithdrawBaseTokens,
} from '../types/templates/Spaceport/Spaceport';
import { BI_18, ONE_BI, ZERO_BD } from './constants';
import { addToUpdateQueue, convertTokenToDecimal, createTimeframe, updateSpaceportStatus } from './helpers';
import { logger, warning } from './log';

export function handleUserDeposit(event: spaceportUserDeposit): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  let baseToken = Token.load(spaceport.baseToken.toString());
  if (baseToken === null) {
    warning('There is no base token of spaceport with address {}', [spaceport.baseToken.toString()]);
    return;
  }

  let userId = event.transaction.from.toHexString();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.save();
  }

  let deposit: BigDecimal;
  if (spaceport.inEth) {
    deposit = convertTokenToDecimal(event.params.value, BI_18);
  } else {
    deposit = convertTokenToDecimal(event.params.value, baseToken.decimals);
  }

  let participantId = spaceportId + '-' + userId;
  let participant = Participant.load(participantId);
  if (participant == null) {
    participant = new Participant(participantId);
    participant.participant = userId;
    participant.spaceToken = spaceport.spaceToken;
    participant.spaceport = spaceportId;
    participant.deposit = ZERO_BD;
    participant.timestamp = event.block.timestamp;

    spaceport.participantsCount = spaceport.participantsCount.plus(ONE_BI);
  }
  participant.deposit = participant.deposit.plus(deposit)
  participant.save();

  spaceport.depositTotal = spaceport.depositTotal.plus(deposit);
  spaceport.save();

  createTimeframe(event.block.timestamp, spaceport as Spaceport);

  updateSpaceportStatus(spaceportId, event.block.timestamp);
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

  updateSpaceportStatus(spaceportId, event.block.timestamp);
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

  let baseToken = Token.load(spaceport.baseToken.toString());
  if (baseToken === null) {
    warning('There is no base token of spaceport with address {}', [spaceport.baseToken.toString()]);
    return;
  }

  let userId = event.transaction.from.toHexString();
  let user = User.load(userId);
  if (user == null) {
    logger('The user with id {} does not exist', [userId]);
    return;
  }

  let participantId = spaceportId + '-' + userId;
  let participant = Participant.load(participantId);
  if (participant == null) {
    warning('There is no participant with id {}', [participantId]);
    return;
  }

  let withdraw = participant.deposit;
  participant.deposit = ZERO_BD
  participant.save();

  spaceport.participantsCount = spaceport.participantsCount.minus(ONE_BI);
  spaceport.depositTotal = spaceport.depositTotal.minus(withdraw);
  spaceport.save();

  createTimeframe(event.block.timestamp, spaceport as Spaceport);
}

export function handleUpdateBlocks(event: spaceportUpdateBlocks): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  spaceport.startBlock = event.params.start;
  spaceport.endBlock = event.params.end;
  spaceport.save();

  addToUpdateQueue(spaceportId, [event.params.start, event.params.end.plus(ONE_BI)]);
}

export function handleForceFailIfPairExists(event: spaceportForceFailIfPairExists): void {
  updateSpaceportStatus(event.address.toHexString(), event.block.timestamp);
}

export function handleForceFailByPlfi(event: spaceportForceFailByPlfi): void {
  updateSpaceportStatus(event.address.toHexString(), event.block.timestamp);
}
