import { BigDecimal } from '@graphprotocol/graph-ts';
import { Participant, Spaceport, Token, User } from '../types/schema';
import {
  AddLiquidityCall,
  ForceFailByPlfiCall,
  ForceFailIfPairExistsCall, spaceportAddLiquidity,
  UpdateBlocksCall,
  UserDepositCall,
  UserWithdrawBaseTokensCall,
} from '../types/templates/Spaceport/Spaceport';
import { BI_18, ONE_BI, ZERO_BD } from './constants';
import { addToUpdateQueue, convertTokenToDecimal, createTimeframe, updateSpaceportStatus } from './helpers';
import { logger, warning } from './log';

export function handleUserDeposit(call: UserDepositCall): void {
  let spaceportId = call.to.toHexString()
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

  let userId = call.from.toHexString();
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.save();
  }

  let deposit: BigDecimal;
  if (spaceport.inEth) {
    deposit = convertTokenToDecimal(call.transaction.value, BI_18);
  } else {
    deposit = convertTokenToDecimal(call.inputs._amount, baseToken.decimals);
  }

  let participantId = spaceportId + '-' + userId;
  let participant = Participant.load(participantId);
  if (participant == null) {
    participant = new Participant(participantId);
    participant.participant = userId;
    participant.spaceToken = spaceport.spaceToken;
    participant.spaceport = spaceportId;
    participant.deposit = ZERO_BD;
    participant.timestamp = call.block.timestamp;

    spaceport.participantsCount = spaceport.participantsCount.plus(ONE_BI);
  }
  participant.deposit = participant.deposit.plus(deposit)
  participant.save();

  spaceport.depositTotal = spaceport.depositTotal.plus(deposit);
  spaceport.save();

  createTimeframe(call.block.timestamp, spaceport as Spaceport);

  updateSpaceportStatus(spaceportId, call.block.timestamp);
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
 * @param call
 */
export function handleUserWithdrawBaseTokens(call: UserWithdrawBaseTokensCall): void {
  let spaceportId = call.to.toHexString()
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

  let userId = call.from.toHexString();
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

  createTimeframe(call.block.timestamp, spaceport as Spaceport);
}

export function handleUpdateBlocksCall(call: UpdateBlocksCall): void {
  let spaceportId = call.to.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  spaceport.startBlock = call.inputs._startBlock;
  spaceport.endBlock = call.inputs._endBlock;
  spaceport.save();

  addToUpdateQueue(spaceportId, [call.inputs._startBlock, call.inputs._endBlock.plus(ONE_BI)]);
}

export function handleForceFailIfPairExistsCall(call: ForceFailIfPairExistsCall): void {
  updateSpaceportStatus(call.to.toHexString(), call.block.timestamp);
}

export function handleForceFailByPlfiCall(call: ForceFailByPlfiCall): void {
  updateSpaceportStatus(call.to.toHexString(), call.block.timestamp);
}
