import { BigDecimal, store } from '@graphprotocol/graph-ts';
import { Participant, Spaceport, Token, Transaction, User } from '../types/schema';
import {
  ForceFailByPlfiCall,
  ForceFailIfPairExistsCall,
  spaceportAddLiquidity,
  spaceportOwnerWithdrawTokens,
  spaceportUserDeposit,
  spaceportUserWithdrawBaseTokens,
  spaceportUserWithdrawTokens,
  UpdateBlocksCall,
} from '../types/templates/Spaceport/Spaceport';
import { BI_18, ONE_BI, STATUS_FAILED, ZERO_BD } from './constants';
import {
  addToUpdateQueue,
  convertTokenToDecimal,
  createTimeFrames,
  getStatus,
  logger,
  updateSpaceportStatus,
} from './helpers';

export function handleSpaceportAddLiquidity(event: spaceportAddLiquidity): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    logger('There is no spaceport with address {}', [spaceportId]);
    return;
  }
  updateSpaceportStatus(spaceportId);
}

export function handleSpaceportOwnerWithdrawTokens(event: spaceportOwnerWithdrawTokens): void {

}

/**
 * The user makes a deposit in base tokens (or ETH)
 * @param event
 */
export function handleSpaceportUserDeposit(event: spaceportUserDeposit): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    logger('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  let baseToken = Token.load(spaceport.baseToken.toString());
  if (baseToken === null) {
    logger('There is no base token of spaceport with address {}', [spaceport.baseToken.toString()]);
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
  }
  participant.deposit = participant.deposit.plus(deposit)
  participant.save();

  spaceport.depositTotal = spaceport.depositTotal.plus(deposit);
  spaceport.participantsCount = spaceport.participantsCount.plus(ONE_BI);
  spaceport.save();

  createTimeFrames(event.block.timestamp, spaceport as Spaceport);

  let transaction = Transaction.load(event.transaction.hash.toHex());
  if (transaction == null) {
    transaction = new Transaction(event.transaction.hash.toHex());
    transaction.user = userId;
    transaction.from = event.transaction.from.toHex();
    transaction.to = event.transaction.to.toHex();
    transaction.value = event.transaction.value.toBigDecimal();

    transaction.save();
  }
}

/**
 * The user withdraws the nested tokens if the IDO failed
 * @param event
 */
export function handleSpaceportUserWithdrawBaseTokens(event: spaceportUserWithdrawBaseTokens): void {
  let spaceportId = event.address.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    logger('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  let baseToken = Token.load(spaceport.baseToken.toString());
  if (baseToken === null) {
    logger('There is no base token of spaceport with address {}', [spaceport.baseToken.toString()]);
    return;
  }

  let userId = event.transaction.from.toHexString();
  let user = User.load(userId);
  if (user == null) {
    logger('The user with id {} does not exist', [userId]);
    return;
  }

  let withdraw: BigDecimal;
  if (spaceport.inEth) {
    withdraw = convertTokenToDecimal(event.params.value, BI_18);
  } else {
    withdraw = convertTokenToDecimal(event.params.value, baseToken.decimals);
  }

  let participantId = spaceportId + '-' + userId;
  let participant = Participant.load(participantId);
  if (participant == null) {
    // There is no participant with ID 1
    logger('There is no participant with id {}', [participantId]);
    return;
  }
  participant.deposit = participant.deposit.minus(withdraw)
  participant.save();

  if (participant.deposit.equals(ZERO_BD)) {
    spaceport.participantsCount = spaceport.participantsCount.minus(ONE_BI);
  }
  spaceport.depositTotal = spaceport.depositTotal.minus(withdraw);
  spaceport.save();

  createTimeFrames(event.block.timestamp, spaceport as Spaceport);

  let transaction = Transaction.load(event.transaction.hash.toHex());
  if (transaction == null) {
    transaction = new Transaction(event.transaction.hash.toHex());
    transaction.user = userId;
    transaction.from = event.transaction.from.toHex();
    transaction.to = event.transaction.to.toHex();
    transaction.value = event.transaction.value.toBigDecimal();

    transaction.save();
  }
}

export function handleSpaceportUserWithdrawTokens(event: spaceportUserWithdrawTokens): void {

}

export function handleUpdateBlocksCall(call: UpdateBlocksCall): void {
  let spaceportId = call.to.toHexString()
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    logger('There is no spaceport with address {}', [spaceportId]);
    return;
  }

  spaceport.startBlock = call.inputs._startBlock;
  spaceport.endBlock = call.inputs._endBlock;

  // Add startBlock to update spaceport queue
  if (call.block.number.lt(call.inputs._startBlock)) {
    addToUpdateQueue(spaceportId, call.inputs._startBlock);
  }

  // Add endBlock to update spaceport queue
  if (call.block.number.lt(call.inputs._endBlock)) {
    addToUpdateQueue(spaceportId, call.inputs._endBlock);
  }

  spaceport.save();
}

export function handleForceFailIfPairExistsCall(call: ForceFailIfPairExistsCall): void {
  // call.transaction
}

export function handleForceFailByPlfiCall(call: ForceFailByPlfiCall): void {
  let spaceportId = call.to.toHexString();
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport === null) {
    logger('There is no spaceport with address {}', [spaceportId]);
    return;
  }
  spaceport.status = getStatus(STATUS_FAILED);
  spaceport.save();
}
