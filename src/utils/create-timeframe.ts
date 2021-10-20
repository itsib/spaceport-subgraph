import { BigInt } from '@graphprotocol/graph-ts/index';
import { Spaceport, SpaceportStatistic } from '../types/schema';

/**
 * Build data timeframes (for hour, day, week, month)
 * @param blockTimestamp
 * @param spaceport
 */
export function createTimeframe(blockTimestamp: BigInt, spaceport: Spaceport): void {
  let timeframeId = blockTimestamp.toString() + "-" + spaceport.id;

  let timeframe = SpaceportStatistic.load(timeframeId);
  if (timeframe === null) {
    timeframe = new SpaceportStatistic(timeframeId);
    timeframe.spaceport = spaceport.id;
    timeframe.timestamp = blockTimestamp;
  }
  timeframe.participantsCount = spaceport.participantsCount;
  timeframe.depositTotal = spaceport.depositTotal;
  timeframe.save();
}
