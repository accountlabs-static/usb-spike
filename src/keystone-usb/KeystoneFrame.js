import crc32 from 'crc32';
import { isEqual } from 'lodash';
import { bufToNum, getTLVFromHex, toHex, toLittleEndianStr } from './utils';
import { TLV } from './TLV';
import { Buffer } from 'buffer';

export class KeystoneFrame {
  static head = 0x6b;

  protocalVersion = 0;

  packetIndex = 0;

  serviceId = 1;

  commandId = 1;

  flags = {
    ack: 0,
    isHost: 1,
  };

  dataZone = [];

  constructor({ protocalVersion, serviceId, commandId, flags, dataZone } = {}) {
    this.protocalVersion = protocalVersion || this.protocalVersion;
    this.serviceId = serviceId || this.serviceId;
    this.commandId = commandId || this.commandId;
    this.flags.ack = flags?.ack || this.flags.ack;
    this.flags.isHost = flags?.isHost || this.flags.isHost;

    if (Array.isArray(dataZone)) {
      dataZone.forEach(it => {
        if (it instanceof TLV) {
          this.dataZone.push(it);
        }
      });
    }
  }

  static from(hexStr) {
    if (!hexStr) throw new Error('Invalid hex string');
    const buf = Buffer.from(hexStr, 'hex');
    const [
      head,
      protocalVersion,
      packetIndex0,
      packetIndex1,
      serviceId,
      commandId,
      flagsAck,
      flagsIsHost,
      _len0,
      _len1,
      ...dataZoneAndCrc32
    ] = buf;
    if (head !== this.head) throw new Error('Invalid frame head');

    const originChecksum = hexStr.slice(-8);
    const hexContent = hexStr.slice(0, hexStr.length - 8);
    const calculatedChecksum = crc32(Buffer.from(hexContent, 'hex')).padStart(
      8,
      '0',
    );
    // if (
    //   toLittleEndianStr(calculatedChecksum).toLowerCase() !==
    //   originChecksum.toLowerCase()
    // ) {
    //   throw new Error('Invalid CRC');
    // }

    const packetIndex = bufToNum([packetIndex1, packetIndex0]);
    const flags = {
      ack: flagsAck,
      isHost: flagsIsHost,
    };

    const hexDataZone = dataZoneAndCrc32.slice(0, dataZoneAndCrc32.length - 4);
    const dataZone = getTLVFromHex(hexDataZone).map(res => TLV.from(res));

    return new KeystoneFrame({
      protocalVersion,
      packetIndex,
      serviceId,
      commandId,
      flags,
      dataZone,
    });
  }

  serliaze() {
    const dataZoneHex = this.dataZone.reduce((p, n) => p + n.serliaze(), '');
    let str = `
    ${toHex(KeystoneFrame.head)}
    ${toHex(this.protocalVersion)}
    ${toHex(this.packetIndex, 4)}
    ${toHex(this.serviceId)}
    ${toHex(this.commandId)}
    ${toHex(this.flags.ack)}
    ${toHex(this.flags.isHost)}
    ${toHex(dataZoneHex.length / 2, 4, true)}
    ${dataZoneHex}
    `;
    str = str.replace(/\s+/g, '');
    const crc32Checksum = crc32(Buffer.from(str, 'hex')).padStart(8, 0);
    return str + toLittleEndianStr(crc32Checksum);
  }

  toU8a() {
    return Uint8Array.from(Buffer.from(this.serliaze(), 'hex'));
  }

  setServiceId(id) {
    this.serviceId = id;
  }

  setCommandId(id) {
    this.commandId = id;
  }

  getServiceCommandId() {
    return {
      serviceId: this.serviceId,
      commandId: this.commandId,
    };
  }

  isCommand(cmd) {
    return isEqual(this.getServiceCommandId(), {
      serviceId: cmd.serviceId,
      commandId: cmd.commandId,
    });
  }

  hasType(type) {
    return !!this.dataZone.find(it => it.type === type);
  }

  setAck(value) {
    this.ack = value;
  }

  appendData(type, value, byteLength) {
    const tlv = new TLV({ type: type?.id || type, value, byteLength });
    this.dataZone.push(tlv);
  }

  clearData() {
    this.dataZone = [];
  }

  getData(index, format) {
    if (arguments.length === 0) {
      return this.dataZone;
    }
    const tlv = this.dataZone.at(index - 1);
    return tlv?.formatValue(format);
  }

  incrementPackageIndex(index) {
    this.packetIndex = index;
  }
}
