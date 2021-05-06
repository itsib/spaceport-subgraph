import { Address } from '@graphprotocol/graph-ts';
import { Spaceport } from '../types/schema';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport'
import { spaceportRegistered } from '../types/SpaceportFactory/SpaceportFactory';
import { getOrCreateToken } from './helpers';

export function handleSpaceportRegistered(event: spaceportRegistered): void {
  let address = event.params.spaceportContract;
  let spaceport = Spaceport.load(address.toHex())
  if (spaceport == null) {
    spaceport = new Spaceport(address.toHex());
    spaceport.createdAtTimestamp = event.block.timestamp;
    spaceport.createdAtBlockNumber = event.block.number;

    let spaceportContract = SpaceportContract.bind(address);
    let spaceportInfo = spaceportContract.SPACEPORT_INFO();

    let spaceTokenAddress: Address = spaceportInfo.value1;
    let baseTokenAddress: Address = spaceportInfo.value2;
    let spaceToken = getOrCreateToken(spaceTokenAddress);
    let baseToken = getOrCreateToken(baseTokenAddress);

    spaceport.spaceToken = spaceToken.id;
    spaceport.baceToken = baseToken.id;
    spaceport.owner = spaceportInfo.value0.toHex();

    spaceport.save();
  }
}
