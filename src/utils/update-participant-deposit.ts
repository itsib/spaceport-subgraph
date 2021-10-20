import { BigDecimal, BigInt } from '@graphprotocol/graph-ts/index';
import { BI_18, ONE_BI, ZERO_BD } from '../constants/constants';
import { Participant, Spaceport, Token, User } from '../types/schema';
import { warning } from './log';
import { convertTokenToDecimal, exponentToBigDecimal } from './tokens';

export function updateParticipantDeposit(userId: string, amount: BigInt, spaceport: Spaceport, timestamp: BigInt): void {
  let baseToken = Token.load(spaceport.baseToken.toString());
  if (baseToken === null) {
    warning('There is no base token of spaceport with address {}', [spaceport.baseToken.toString()]);
    return;
  }

  let spaceToken = Token.load(spaceport.spaceToken.toString());
  if (spaceToken === null) {
    warning('There is no space token of spaceport with address {}', [spaceport.spaceToken.toString()]);
    return;
  }

  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.save();
  }

  let deposit: BigDecimal;
  if (spaceport.inEth) {
    deposit = convertTokenToDecimal(amount, BI_18);
  } else {
    deposit = convertTokenToDecimal(amount, baseToken.decimals);
  }

  let spaceTokensSold = deposit.times(spaceport.tokenPrice.toBigDecimal().div(exponentToBigDecimal(spaceToken.decimals)));

  let participantId = spaceport.id + '-' + userId;
  let participant = Participant.load(participantId);
  if (participant == null) {
    participant = new Participant(participantId);
    participant.participant = userId;
    participant.spaceToken = spaceport.spaceToken;
    participant.spaceTokensOwned = ZERO_BD;
    participant.spaceTokensClaim = ZERO_BD;
    participant.spaceport = spaceport.id;
    participant.deposit = ZERO_BD;
    participant.timestamp = timestamp;

    spaceport.participantsCount = spaceport.participantsCount.plus(ONE_BI);
  }
  participant.deposit = participant.deposit.plus(deposit)
  participant.spaceTokensOwned = participant.spaceTokensOwned.plus(spaceTokensSold);
  participant.save();

  spaceport.depositTotal = spaceport.depositTotal.plus(deposit);
}
