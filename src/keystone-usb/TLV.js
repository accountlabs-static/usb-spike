import { parseLittleEndianNumber, removeAllSpaces, toHex } from './utils';
import { Buffer } from 'buffer';

function isHex(val) {
  return typeof val !== 'number' && /^[A-Fa-f0-9]+$/.test(val);
}

function isStr(val) {
  return typeof val === 'string' && !isHex(val);
}

export class TLV {
  type;

  byteLength = 1;

  value = '';

  static from(hexStr, format) {
    const type = parseInt(hexStr.slice(0, 2), 16);
    let index = 4;
    let length = parseInt(hexStr.slice(2, index), 16);
    if (length >= 128) {
      index = 6;
      length = parseInt(hexStr.slice(2, index), 16) & 0x7fff;
    }
    let value = hexStr.slice(index);
    switch (format) {
      case 'string':
        value = Buffer.from(value.slice(0, value.length - 2), 'hex').toString(
          'utf8',
        );
        break;
      case 'number':
        value = parseLittleEndianNumber(value);
        break;
      default:
    }
    return new TLV({
      type,
      value,
      byteLength: length,
    });
  }

  constructor({ type, value, byteLength }) {
    this.type = type;
    if (byteLength) {
      this.byteLength = byteLength;
    }
    this.value = value;
  }

  formatValue(format) {
    let { value } = this;
    switch (format) {
      case 'string':
        value = Buffer.from(value.slice(0, value.length - 2), 'hex').toString(
          'utf8',
        );
        break;
      case 'number':
        value = parseLittleEndianNumber(value);
        break;
      case 'hex':
        break;
      default:
    }
    return value;
  }

  serliaze() {
    let { value } = this;
    if (isStr(value)) {
      value = `${toHex(value)}00`;
    } else if (typeof value === 'number') {
      value = toHex(value, this.byteLength * 2, true);
    }

    const len = value.length / 2;
    const length = len < 128 ? len : len | 0x8000;

    const str = `
      ${toHex(this.type)}
      ${toHex(length)}
      ${value}
    `;
    return removeAllSpaces(str);
  }
}
