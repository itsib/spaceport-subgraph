import { Address } from '@graphprotocol/graph-ts';
import { Spaceport, SpaceportFactory } from '../types/schema';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport'
import { RegisterSpaceportCall } from '../types/SpaceportFactory/SpaceportFactory';
import { Spaceport as SpaceportTemplate } from '../types/templates'
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants';
import { addToUpdateQueue, createTimeframe, getOrCreateToken } from './helpers';

export function handleRegisterSpaceport(call: RegisterSpaceportCall): void {
  let spaceportFactoryId = call.to.toHexString()
  let spaceportFactory = SpaceportFactory.load(spaceportFactoryId)
  if (spaceportFactory == null) {
    spaceportFactory = new SpaceportFactory(spaceportFactoryId);
    spaceportFactory.spaceportsLength = ZERO_BI;
    spaceportFactory.save();
  }

  let spaceportId = call.inputs._spaceportAddress.toHexString();
  let spaceport = Spaceport.load(spaceportId)
  if (spaceport == null) {
    spaceport = new Spaceport(spaceportId);

    let spaceportContract = SpaceportContract.bind(call.inputs._spaceportAddress);
    let spaceportInfo = spaceportContract.SPACEPORT_INFO();
    let status = spaceportContract.spaceportStatus();

    let spaceTokenAddress: Address = spaceportInfo.value1;
    let baseTokenAddress: Address = spaceportInfo.value2;
    let spaceToken = getOrCreateToken(spaceTokenAddress);
    let baseToken = getOrCreateToken(baseTokenAddress);

    spaceport.index = spaceportFactory.spaceportsLength;
    spaceport.spaceToken = spaceToken.id;
    spaceport.baseToken = baseToken.id;
    spaceport.inEth = spaceportInfo.value13;
    spaceport.status = status;
    spaceport.participantsCount = ZERO_BI;
    spaceport.depositTotal = ZERO_BD;
    spaceport.owner = spaceportInfo.value0.toHex();
    spaceport.tokenPrice = spaceportInfo.value3;
    spaceport.listingRate = spaceportInfo.value9;
    spaceport.liquidityPercent = spaceportInfo.value8;
    spaceport.lpGenerationComplete = false;
    spaceport.lpGenerationCompleteTime = ZERO_BI;
    spaceport.startBlock = spaceportInfo.value10;
    spaceport.endBlock = spaceportInfo.value11;
    spaceport.createdAtTimestamp = call.block.timestamp;
    spaceport.createdAtBlockNumber = call.block.number;

    spaceport.save();

    // Add spaceport to update queue
    addToUpdateQueue(spaceportId, [spaceport.startBlock, spaceport.endBlock.plus(ONE_BI)]);

    spaceportFactory.spaceportsLength = spaceportFactory.spaceportsLength.plus(ONE_BI);
    spaceportFactory.save();

    // Create the tracked contract based on the template
    SpaceportTemplate.create(call.inputs._spaceportAddress);
  }
}
