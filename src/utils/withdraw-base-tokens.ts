import { ONE_BI, ZERO_BD } from '../constants/constants';
import { Participant, Spaceport, Token, User } from '../types/schema';
import { logger, warning } from './log';

export function withdrawBaseTokens(userId: string, spaceport: Spaceport): void {
  let baseToken = Token.load(spaceport.baseToken.toString());
  if (baseToken === null) {
    warning('There is no base token of spaceport with address {}', [spaceport.baseToken.toString()]);
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

  let withdraw = participant.deposit;
  participant.deposit = ZERO_BD
  participant.save();

  spaceport.participantsCount = spaceport.participantsCount.minus(ONE_BI);
  spaceport.depositTotal = spaceport.depositTotal.minus(withdraw);
}
