import { Address } from '@graphprotocol/graph-ts';
import { SpaceportFactory, Spaceport } from '../types/schema';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport'
import { Spaceport as SpaceportTemplate } from '../types/templates'
import { spaceportRegistered } from '../types/SpaceportFactory/SpaceportFactory';
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants';
import { createTimeFrames, getOrCreateToken } from './helpers';

export function handleSpaceportRegistered(event: spaceportRegistered): void {
  let spaceportFactoryId = event.address.toHexString()
  let spaceportFactory = SpaceportFactory.load(spaceportFactoryId)
  if (spaceportFactory == null) {
    spaceportFactory = new SpaceportFactory(spaceportFactoryId);
    spaceportFactory.spaceportsLength = ZERO_BI;
    spaceportFactory.save();
  }

  let spaceportId = event.params.spaceportContract.toHexString();
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport == null) {
    spaceport = new Spaceport(spaceportId);

    let spaceportContract = SpaceportContract.bind(event.params.spaceportContract);
    let spaceportInfo = spaceportContract.SPACEPORT_INFO();

    let spaceTokenAddress: Address = spaceportInfo.value1;
    let baseTokenAddress: Address = spaceportInfo.value2;
    let spaceToken = getOrCreateToken(spaceTokenAddress);
    let baseToken = getOrCreateToken(baseTokenAddress);

    spaceport.index = spaceportFactory.spaceportsLength;
    spaceport.spaceToken = spaceToken.id;
    spaceport.baseToken = baseToken.id;
    spaceport.inEth = spaceportInfo.value13;
    spaceport.participantsCount = ZERO_BI;
    spaceport.depositTotal = ZERO_BD;
    spaceport.owner = spaceportInfo.value0.toHex();
    spaceport.createdAtTimestamp = event.block.timestamp;
    spaceport.createdAtBlockNumber = event.block.number;

    spaceport.save();

    spaceportFactory.spaceportsLength = spaceportFactory.spaceportsLength.plus(ONE_BI);
    spaceportFactory.save();

    createTimeFrames(event.block.timestamp, spaceport as Spaceport);

    // create the tracked contract based on the template
    SpaceportTemplate.create(event.params.spaceportContract);
  }
}
