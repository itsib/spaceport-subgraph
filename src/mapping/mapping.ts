import { Spaceport } from '../types/schema';
import { spaceportRegistered } from '../types/SpaceportFactory/SpaceportFactory';

export function handleSpaceportRegistered(event: spaceportRegistered): void {
  let spaceport = Spaceport.load(event.params.spaceportContract.toHex())
  if (spaceport == null) {
    spaceport = new Spaceport(event.params.spaceportContract.toHex());
    spaceport.createdAtTimestamp = event.block.timestamp;
    spaceport.createdAtBlockNumber = event.block.number;
    spaceport.save();
  }
}
