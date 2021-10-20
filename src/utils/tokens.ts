import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts/index';
import { BI_18, ONE_BI, ZERO_BI } from '../constants/constants';
import { TOKENS_ADDRESSES, TOKENS_DECIMALS, TOKENS_NAMES, TOKENS_SYMBOLS } from '../constants/variables';
import { Token } from '../types/schema';
import { ERC20 } from '../types/SpaceportFactory/ERC20';
import { ERC20NameBytes } from '../types/SpaceportFactory/ERC20NameBytes';
import { ERC20SymbolBytes } from '../types/SpaceportFactory/ERC20SymbolBytes';
import { warning } from './log';

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let index = TOKENS_ADDRESSES.indexOf(tokenAddress.toHexString());
  if (index != -1) {
    return TOKENS_SYMBOLS[index];
  }

  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      } else {
        warning('Cannot find symbol for token {}', [tokenAddress.toHexString()]);
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(tokenAddress: Address): string {
  let index = TOKENS_ADDRESSES.indexOf(tokenAddress.toHexString());
  if (index != -1) {
    return TOKENS_NAMES[index];
  }

  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = contract.try_name()
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      } else {
        warning('Cannot find token name {}', [tokenAddress.toHexString()]);
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let index = TOKENS_ADDRESSES.indexOf(tokenAddress.toHexString());
  if (index != -1) {
    return BigInt.fromI32(TOKENS_DECIMALS[index]);
  }

  let contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  let decimalValue = null
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value;
    return BigInt.fromI32(decimalValue as i32)
  } else {
    warning('Cannot find token decimals {}', [tokenAddress.toHexString()]);
    return BI_18;
  }
}

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString())
  // Fetch info if null
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.name = fetchTokenName(tokenAddress)
    let decimals = fetchTokenDecimals(tokenAddress)
    if (decimals !== null) {
      token.decimals = decimals
    } else {
      token.decimals = BI_18
    }
    token.save();
  }
  return token as Token;
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}
