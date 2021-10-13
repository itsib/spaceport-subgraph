import { Address } from '@graphprotocol/graph-ts';
import { Spaceport, SpaceportFactory } from '../types/schema';
import { Spaceport as SpaceportContract } from '../types/SpaceportFactory/Spaceport'
import { spaceportRegistered } from '../types/SpaceportFactory/SpaceportFactory';
import { Spaceport as SpaceportTemplate } from '../types/templates'
import { ONE_BI, ZERO_BD, ZERO_BI } from './constants';
import { DEPRECATED_INCLUDES_IDO, DEX_ADDRESS, DEX_NAME } from './addresses';
import { addToUpdateQueue, convertTokenToDecimal, getOrCreateToken } from './helpers';

export function handleRegisterSpaceport(event: spaceportRegistered): void {
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
    let spaceportGenerator = spaceportContract.SPACEPORT_GENERATOR();
    let status = spaceportContract.spaceportStatus();

    let dex: string;
    let index = DEX_ADDRESS.indexOf(spaceportGenerator.toHexString());
    if (index !== -1) {
      dex = DEX_NAME[index];
    } else if (DEPRECATED_INCLUDES_IDO.indexOf(spaceportId) !== -1) {
      dex = DEX_NAME[0];
    } else {
      return;
    }

    let spaceTokenAddress: Address = spaceportInfo.value1;
    let baseTokenAddress: Address = spaceportInfo.value2;
    let spaceToken = getOrCreateToken(spaceTokenAddress);
    let baseToken = getOrCreateToken(baseTokenAddress);

    spaceport.index = spaceportFactory.spaceportsLength;
    spaceport.spaceToken = spaceToken.id;
    spaceport.baseToken = baseToken.id;
    spaceport.inEth = spaceportInfo.value13;
    spaceport.amount = convertTokenToDecimal(spaceportInfo.value5, spaceToken.decimals);
    spaceport.status = status;
    spaceport.participantsCount = ZERO_BI;
    spaceport.hardCap = convertTokenToDecimal(spaceportInfo.value6, baseToken.decimals);
    spaceport.softCap = convertTokenToDecimal(spaceportInfo.value7, baseToken.decimals);
    spaceport.depositTotal = ZERO_BD;
    spaceport.owner = spaceportInfo.value0.toHex();
    spaceport.dex = dex;
    spaceport.tokenPrice = spaceportInfo.value3;
    spaceport.listingRate = spaceportInfo.value9;
    spaceport.liquidityPercent = spaceportInfo.value8;
    spaceport.lockPeriod = spaceportInfo.value12;
    spaceport.lpGenerationComplete = false;
    spaceport.lpGenerationCompleteTime = ZERO_BI;
    spaceport.startBlock = spaceportInfo.value10;
    spaceport.endBlock = spaceportInfo.value11;
    spaceport.createdAtTimestamp = event.block.timestamp;
    spaceport.createdAtBlockNumber = event.block.number;

    spaceport.save();

    // Add spaceport to update queue
    addToUpdateQueue(spaceportId, [spaceport.startBlock, spaceport.endBlock.plus(ONE_BI)]);

    spaceportFactory.spaceportsLength = spaceportFactory.spaceportsLength.plus(ONE_BI);
    spaceportFactory.save();

    // Create the tracked contract based on the template
    SpaceportTemplate.create(event.params.spaceportContract);
  }
}
