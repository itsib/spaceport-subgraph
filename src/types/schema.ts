// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class SpaceportFactory extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save SpaceportFactory entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save SpaceportFactory entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("SpaceportFactory", id.toString(), this);
  }

  static load(id: string): SpaceportFactory | null {
    return store.get("SpaceportFactory", id) as SpaceportFactory | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get spaceportsLength(): BigInt {
    let value = this.get("spaceportsLength");
    return value.toBigInt();
  }

  set spaceportsLength(value: BigInt) {
    this.set("spaceportsLength", Value.fromBigInt(value));
  }
}

export class Spaceport extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Spaceport entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Spaceport entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Spaceport", id.toString(), this);
  }

  static load(id: string): Spaceport | null {
    return store.get("Spaceport", id) as Spaceport | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get spaceportIndex(): BigInt {
    let value = this.get("spaceportIndex");
    return value.toBigInt();
  }

  set spaceportIndex(value: BigInt) {
    this.set("spaceportIndex", Value.fromBigInt(value));
  }

  get owner(): string {
    let value = this.get("owner");
    return value.toString();
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get spaceToken(): string {
    let value = this.get("spaceToken");
    return value.toString();
  }

  set spaceToken(value: string) {
    this.set("spaceToken", Value.fromString(value));
  }

  get baseToken(): string {
    let value = this.get("baseToken");
    return value.toString();
  }

  set baseToken(value: string) {
    this.set("baseToken", Value.fromString(value));
  }

  get inEth(): boolean {
    let value = this.get("inEth");
    return value.toBoolean();
  }

  set inEth(value: boolean) {
    this.set("inEth", Value.fromBoolean(value));
  }

  get status(): BigInt {
    let value = this.get("status");
    return value.toBigInt();
  }

  set status(value: BigInt) {
    this.set("status", Value.fromBigInt(value));
  }

  get participants(): Array<string> {
    let value = this.get("participants");
    return value.toStringArray();
  }

  set participants(value: Array<string>) {
    this.set("participants", Value.fromStringArray(value));
  }

  get participantsCount(): BigInt {
    let value = this.get("participantsCount");
    return value.toBigInt();
  }

  set participantsCount(value: BigInt) {
    this.set("participantsCount", Value.fromBigInt(value));
  }

  get depositTotal(): BigDecimal {
    let value = this.get("depositTotal");
    return value.toBigDecimal();
  }

  set depositTotal(value: BigDecimal) {
    this.set("depositTotal", Value.fromBigDecimal(value));
  }

  get lpGenerationComplete(): boolean {
    let value = this.get("lpGenerationComplete");
    return value.toBoolean();
  }

  set lpGenerationComplete(value: boolean) {
    this.set("lpGenerationComplete", Value.fromBoolean(value));
  }

  get lpGenerationCompleteTime(): BigInt {
    let value = this.get("lpGenerationCompleteTime");
    return value.toBigInt();
  }

  set lpGenerationCompleteTime(value: BigInt) {
    this.set("lpGenerationCompleteTime", Value.fromBigInt(value));
  }

  get createdAtTimestamp(): BigInt {
    let value = this.get("createdAtTimestamp");
    return value.toBigInt();
  }

  set createdAtTimestamp(value: BigInt) {
    this.set("createdAtTimestamp", Value.fromBigInt(value));
  }

  get createdAtBlockNumber(): BigInt {
    let value = this.get("createdAtBlockNumber");
    return value.toBigInt();
  }

  set createdAtBlockNumber(value: BigInt) {
    this.set("createdAtBlockNumber", Value.fromBigInt(value));
  }

  get finishedAtTimestamp(): BigInt | null {
    let value = this.get("finishedAtTimestamp");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set finishedAtTimestamp(value: BigInt | null) {
    if (value === null) {
      this.unset("finishedAtTimestamp");
    } else {
      this.set("finishedAtTimestamp", Value.fromBigInt(value as BigInt));
    }
  }

  get startBlock(): BigInt {
    let value = this.get("startBlock");
    return value.toBigInt();
  }

  set startBlock(value: BigInt) {
    this.set("startBlock", Value.fromBigInt(value));
  }

  get endBlock(): BigInt {
    let value = this.get("endBlock");
    return value.toBigInt();
  }

  set endBlock(value: BigInt) {
    this.set("endBlock", Value.fromBigInt(value));
  }
}

export class User extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save User entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save User entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("User", id.toString(), this);
  }

  static load(id: string): User | null {
    return store.get("User", id) as User | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get spaceports(): Array<string> | null {
    let value = this.get("spaceports");
    if (value === null || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toStringArray();
    }
  }

  set spaceports(value: Array<string> | null) {
    if (value === null) {
      this.unset("spaceports");
    } else {
      this.set("spaceports", Value.fromStringArray(value as Array<string>));
    }
  }
}

export class Participant extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Participant entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Participant entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Participant", id.toString(), this);
  }

  static load(id: string): Participant | null {
    return store.get("Participant", id) as Participant | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get participant(): string {
    let value = this.get("participant");
    return value.toString();
  }

  set participant(value: string) {
    this.set("participant", Value.fromString(value));
  }

  get spaceport(): string {
    let value = this.get("spaceport");
    return value.toString();
  }

  set spaceport(value: string) {
    this.set("spaceport", Value.fromString(value));
  }

  get deposit(): BigDecimal {
    let value = this.get("deposit");
    return value.toBigDecimal();
  }

  set deposit(value: BigDecimal) {
    this.set("deposit", Value.fromBigDecimal(value));
  }
}

export class Token extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Token entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Token entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Token", id.toString(), this);
  }

  static load(id: string): Token | null {
    return store.get("Token", id) as Token | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get symbol(): string {
    let value = this.get("symbol");
    return value.toString();
  }

  set symbol(value: string) {
    this.set("symbol", Value.fromString(value));
  }

  get name(): string {
    let value = this.get("name");
    return value.toString();
  }

  set name(value: string) {
    this.set("name", Value.fromString(value));
  }

  get decimals(): BigInt {
    let value = this.get("decimals");
    return value.toBigInt();
  }

  set decimals(value: BigInt) {
    this.set("decimals", Value.fromBigInt(value));
  }
}

export class SpaceportStat extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save SpaceportStat entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save SpaceportStat entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("SpaceportStat", id.toString(), this);
  }

  static load(id: string): SpaceportStat | null {
    return store.get("SpaceportStat", id) as SpaceportStat | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get spaceport(): string {
    let value = this.get("spaceport");
    return value.toString();
  }

  set spaceport(value: string) {
    this.set("spaceport", Value.fromString(value));
  }

  get period(): string {
    let value = this.get("period");
    return value.toString();
  }

  set period(value: string) {
    this.set("period", Value.fromString(value));
  }

  get periodStart(): BigInt {
    let value = this.get("periodStart");
    return value.toBigInt();
  }

  set periodStart(value: BigInt) {
    this.set("periodStart", Value.fromBigInt(value));
  }

  get participantsCount(): BigInt {
    let value = this.get("participantsCount");
    return value.toBigInt();
  }

  set participantsCount(value: BigInt) {
    this.set("participantsCount", Value.fromBigInt(value));
  }

  get depositTotal(): BigDecimal {
    let value = this.get("depositTotal");
    return value.toBigDecimal();
  }

  set depositTotal(value: BigDecimal) {
    this.set("depositTotal", Value.fromBigDecimal(value));
  }
}

export class LatestUpdatedBlock extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save LatestUpdatedBlock entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save LatestUpdatedBlock entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("LatestUpdatedBlock", id.toString(), this);
  }

  static load(id: string): LatestUpdatedBlock | null {
    return store.get("LatestUpdatedBlock", id) as LatestUpdatedBlock | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get blockNumber(): BigInt {
    let value = this.get("blockNumber");
    return value.toBigInt();
  }

  set blockNumber(value: BigInt) {
    this.set("blockNumber", Value.fromBigInt(value));
  }

  get blockTimestamp(): BigInt {
    let value = this.get("blockTimestamp");
    return value.toBigInt();
  }

  set blockTimestamp(value: BigInt) {
    this.set("blockTimestamp", Value.fromBigInt(value));
  }
}

export class UpdateTask extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save UpdateTask entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save UpdateTask entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("UpdateTask", id.toString(), this);
  }

  static load(id: string): UpdateTask | null {
    return store.get("UpdateTask", id) as UpdateTask | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get spaceports(): Array<string> {
    let value = this.get("spaceports");
    return value.toStringArray();
  }

  set spaceports(value: Array<string>) {
    this.set("spaceports", Value.fromStringArray(value));
  }
}
