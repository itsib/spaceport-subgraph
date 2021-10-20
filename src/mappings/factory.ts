import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Spaceport, SpaceportFactory } from '../types/schema';
import {
  SpaceportInfo as SpaceportInfoContract,
  SpaceportInfo__SPACEPORT_INFOResult,
} from '../types/SpaceportFactory/SpaceportInfo'
import { spaceportRegistered } from '../types/SpaceportFactory/SpaceportFactory';
import { Spaceport as SpaceportTemplate, DeprecatedSpaceport as DeprecatedSpaceportTemplate } from '../types/templates'
import {
  DEPRECATED_INCLUDES_IDO,
  DEX_ADDRESS,
  DEX_NAME,
  SPACEPORTS_INIT_ADDRESSES,
  SPACEPORTS_INIT_GENERATOR_ADDRESS,
  SPACEPORTS_INIT_INFO_AMOUNT,
  SPACEPORTS_INIT_INFO_BASE_TOKEN, SPACEPORTS_INIT_INFO_END_BLOCK,
  SPACEPORTS_INIT_INFO_HARDCAP, SPACEPORTS_INIT_INFO_IN_ETH,
  SPACEPORTS_INIT_INFO_LIQUIDITY_PERCENT, SPACEPORTS_INIT_INFO_LISTING_RATE, SPACEPORTS_INIT_INFO_LOCK_PERIOD,
  SPACEPORTS_INIT_INFO_MAX_SPEND_PER_BUYER,
  SPACEPORTS_INIT_INFO_OWNER,
  SPACEPORTS_INIT_INFO_SOFTCAP,
  SPACEPORTS_INIT_INFO_SPACE_TOKEN, SPACEPORTS_INIT_INFO_START_BLOCK,
  SPACEPORTS_INIT_INFO_TOKEN_PRICE,
} from '../constants/variables';
import { ONE_BI, ZERO_BD, ZERO_BI } from '../constants/constants';
import { addToUpdateQueue } from '../utils/add-to-update-queue';
import { convertTokenToDecimal, getOrCreateToken } from '../utils/tokens';

function getSpaceportGenerator(address: Address): string {
  let index = SPACEPORTS_INIT_ADDRESSES.indexOf(address.toHexString());
  if (index != -1) {
    return SPACEPORTS_INIT_GENERATOR_ADDRESS[index];
  }

  let spaceportContract = SpaceportInfoContract.bind(address);
  let spaceportGenerator = spaceportContract.SPACEPORT_GENERATOR();

  return spaceportGenerator.toHexString();
}

function getSpaceportInfo(address: Address): SpaceportInfo__SPACEPORT_INFOResult {
  let index = SPACEPORTS_INIT_ADDRESSES.indexOf(address.toHexString());
  if (index != -1) {
    return new SpaceportInfo__SPACEPORT_INFOResult(
      Address.fromString(SPACEPORTS_INIT_INFO_OWNER[index]),
      Address.fromString(SPACEPORTS_INIT_INFO_SPACE_TOKEN[index]),
      Address.fromString(SPACEPORTS_INIT_INFO_BASE_TOKEN[index]),
      SPACEPORTS_INIT_INFO_TOKEN_PRICE[index],
      SPACEPORTS_INIT_INFO_MAX_SPEND_PER_BUYER[index],
      SPACEPORTS_INIT_INFO_AMOUNT[index],
      SPACEPORTS_INIT_INFO_HARDCAP[index],
      SPACEPORTS_INIT_INFO_SOFTCAP[index],
      SPACEPORTS_INIT_INFO_LIQUIDITY_PERCENT[index],
      SPACEPORTS_INIT_INFO_LISTING_RATE[index],
      SPACEPORTS_INIT_INFO_START_BLOCK[index],
      SPACEPORTS_INIT_INFO_END_BLOCK[index],
      SPACEPORTS_INIT_INFO_LOCK_PERIOD[index],
      SPACEPORTS_INIT_INFO_IN_ETH[index],
    );
  }

  let spaceportContract = SpaceportInfoContract.bind(address);
  return spaceportContract.SPACEPORT_INFO();
}

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

    let spaceportInfo = getSpaceportInfo(event.params.spaceportContract);
    let spaceportGenerator = getSpaceportGenerator(event.params.spaceportContract);

    let dex: string;
    let isDeprecated: boolean;
    let index = DEX_ADDRESS.indexOf(spaceportGenerator);
    if (index !== -1) {
      dex = DEX_NAME[index];
      isDeprecated = false;
    } else if (DEPRECATED_INCLUDES_IDO.indexOf(spaceportId) !== -1) {
      dex = DEX_NAME[0];
      isDeprecated = true;
    } else {
      return;
    }

    let spaceTokenAddress: Address = spaceportInfo.value1;
    let baseTokenAddress: Address = spaceportInfo.value2;
    let spaceToken = getOrCreateToken(spaceTokenAddress);
    let baseToken = getOrCreateToken(baseTokenAddress);

    spaceport.index = spaceportFactory.spaceportsLength;
    spaceport.isDeprecated = isDeprecated;
    spaceport.spaceToken = spaceToken.id;
    spaceport.baseToken = baseToken.id;
    spaceport.inEth = spaceportInfo.value13;
    spaceport.amount = convertTokenToDecimal(spaceportInfo.value5, spaceToken.decimals);
    spaceport.status = ZERO_BI;
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
    if (spaceport.isDeprecated) {
      DeprecatedSpaceportTemplate.create(event.params.spaceportContract);
    } else {
      SpaceportTemplate.create(event.params.spaceportContract);
    }
  }
}
