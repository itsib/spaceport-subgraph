import { BigDecimal } from '@graphprotocol/graph-ts';
import { Participant, Spaceport, Token, User } from '../types/schema';
import {
  AddLiquidityCall,
  ForceFailByPlfiCall,
  ForceFailIfPairExistsCall,
  spaceportUserDeposit,
  UpdateBlocksCall,
  UserWithdrawBaseTokensCall,
} from '../types/templates/Spaceport/Spaceport';
import { BI_18, ONE_BI, STATUS_FAILED, ZERO_BD } from './constants';
import {
  addToUpdateQueue,
  convertTokenToDecimal,
  createTimeFrames,
  logger,
  updateSpaceportStatus,
  warning,
} from './helpers';

export function handleAddLiquidity(call: AddLiquidityCall): void {
  let spaceportId = call.to.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  spaceport.lpGenerationComplete = true;
  spaceport.lpGenerationCompleteTime = call.block.timestamp;

  updateSpaceportStatus(spaceportId, call.block.timestamp);
}

/**
 * The user makes a deposit in base tokens (or ETH)
 * @param event
 */
export function handleSpaceportUserDeposit(event: spaceportUserDeposit): void {
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
    participant.spaceport = spaceportId;
    participant.deposit = ZERO_BD;

    spaceport.participantsCount = spaceport.participantsCount.plus(ONE_BI);
  }
  participant.deposit = participant.deposit.plus(deposit)
  participant.save();

  spaceport.depositTotal = spaceport.depositTotal.plus(deposit);
  spaceport.save();

  createTimeFrames(event.block.timestamp, spaceport as Spaceport);

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
    // There is no participant with ID 1
    warning('There is no participant with id {}', [participantId]);
    return;
  }

  let withdraw = participant.deposit;
  participant.deposit = ZERO_BD
  participant.save();

  spaceport.participantsCount = spaceport.participantsCount.minus(ONE_BI);
  spaceport.depositTotal = spaceport.depositTotal.minus(withdraw);
  spaceport.save();

  createTimeFrames(call.block.timestamp, spaceport as Spaceport);
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

  let shouldBeUpdated = false;
  // Add startBlock to update spaceport queue
  if (call.block.number.lt(call.inputs._startBlock)) {
    addToUpdateQueue(spaceportId, call.inputs._startBlock);
  } else {
    shouldBeUpdated = true;
  }

  // Add endBlock to update spaceport queue
  if (call.block.number.lt(call.inputs._endBlock)) {
    addToUpdateQueue(spaceportId, call.inputs._endBlock);
  } else {
    shouldBeUpdated = true;
  }

  if (shouldBeUpdated) {
    addToUpdateQueue(spaceportId, call.block.number);
  }
  spaceport.save();
}

export function handleForceFailIfPairExistsCall(call: ForceFailIfPairExistsCall): void {
  let spaceportId = call.to.toHexString();
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  addToUpdateQueue(spaceportId, call.block.number)
}

export function handleForceFailByPlfiCall(call: ForceFailByPlfiCall): void {
  let spaceportId = call.to.toHexString();
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    warning('There is no spaceport with address {}', [spaceportId]);
    return;
  }
  spaceport.status = STATUS_FAILED;
  spaceport.save();
}
