import { Address } from '@graphprotocol/graph-ts';
import { Spaceport, SpaceportFactory } from '../types/schema';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport'
import { spaceportRegistered } from '../types/SpaceportFactory/SpaceportFactory';
import { Spaceport as SpaceportTemplate } from '../types/templates'
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants';
import { addToUpdateQueue, createTimeFrames, getOrCreateToken, getStatus } from './helpers';

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
    let statusId = spaceportContract.spaceportStatus();

    let spaceTokenAddress: Address = spaceportInfo.value1;
    let baseTokenAddress: Address = spaceportInfo.value2;
    let spaceToken = getOrCreateToken(spaceTokenAddress);
    let baseToken = getOrCreateToken(baseTokenAddress);

    spaceport.spaceportIndex = spaceportFactory.spaceportsLength;
    spaceport.spaceToken = spaceToken.id;
    spaceport.baseToken = baseToken.id;
    spaceport.inEth = spaceportInfo.value13;
    spaceport.status = getStatus(statusId);
    spaceport.participantsCount = ZERO_BI;
    spaceport.depositTotal = ZERO_BD;
    spaceport.owner = spaceportInfo.value0.toHex();
    spaceport.startBlock = spaceportInfo.value10;
    spaceport.endBlock = spaceportInfo.value11;
    spaceport.createdAtTimestamp = event.block.timestamp;
    spaceport.createdAtBlockNumber = event.block.number;

    spaceport.save();

    // Add startBlock to update spaceport queue
    if (event.block.number.lt(spaceport.startBlock)) {
      addToUpdateQueue(spaceportId, spaceport.startBlock);
    }

    // Add endBlock to update spaceport queue
    if (event.block.number.lt(spaceport.endBlock)) {
      addToUpdateQueue(spaceportId, spaceport.endBlock);
    }

    spaceportFactory.spaceportsLength = spaceportFactory.spaceportsLength.plus(ONE_BI);
    spaceportFactory.save();

    createTimeFrames(event.block.timestamp, spaceport as Spaceport);

    // Create the tracked contract based on the template
    SpaceportTemplate.create(event.params.spaceportContract);
  }
}
