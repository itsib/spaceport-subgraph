import { BigInt } from '@graphprotocol/graph-ts/index';
import { Participant, Spaceport, Token, User } from '../types/schema';
import { logger, warning } from './log';
import { convertTokenToDecimal } from './tokens';

export function claimSpaceTokens(userId: string, amount: BigInt, spaceport: Spaceport): void {
  let spaceToken = Token.load(spaceport.spaceToken.toString());
  if (spaceToken === null) {
    warning('There is no space token of spaceport with address {}', [spaceport.spaceToken.toString()]);
    return;
  }

  let user = User.load(userId);
  if (user == null) {
    logger('The user with id {} does not exist', [userId]);
    return;
  }

  let participantId = spaceport.id + '-' + user.id;
  let participant = Participant.load(participantId);
  if (participant == null) {
    warning('There is no participant with id {}', [participantId]);
    return;
  }

  let claim = convertTokenToDecimal(amount, spaceToken.decimals);

  participant.spaceTokensClaim = participant.spaceTokensClaim.plus(claim);
  participant.save();
}
