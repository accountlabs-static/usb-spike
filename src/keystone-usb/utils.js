import { Buffer } from 'buffer';

export function toHex(value, padNum = 2, littleEndian = false) {
  const str =
    typeof value === 'string'
      ? Buffer.from(value, 'utf8').toString('hex')
      : value.toString(16).padStart(padNum, 0);
  return littleEndian ? toLittleEndianStr(str) : str;
}

export function toLittleEndianStr(str) {
  return Buffer.from(str, 'hex')
    .reverse()
    .toString('hex');
}

export function parseLittleEndianNumber(hex) {
  return parseInt(
    Buffer.from(hex, 'hex')
      .reverse()
      .toString('hex'),
    16,
  );
}

export function removeAllSpaces(str) {
  return str.replace(/\s+/g, '');
}

export function bufToNum(arr) {
  return parseInt(Buffer.from(arr).toString('hex'), 16);
}

export function getTLVFromHex(hex) {
  const buf = Buffer.from(hex, 'hex');

  const result = buf.reduce(
    (acc, cur) => {
      const tlvHex = acc.pop();
      const curHex = Buffer.from([cur]).toString('hex');
      const curTLV = tlvHex + curHex;

      let isTLVComplete = false;
      const currentResultContainsLength = curTLV.length >= 6;
      if (currentResultContainsLength) {
        // default length data in the string (2,4], one byte
        let length = parseInt(curTLV.slice(2, 4), 16);

        const isLengthLagerThanOneByte = length >= 0b10000000;
        if (isLengthLagerThanOneByte) {
          // length data in the string (2,6], two bytes
          length = parseInt(curTLV.slice(2, 6), 16) & 0x7fff;
        }
        const lengthBytes = isLengthLagerThanOneByte ? 2 : 1;
        //  type bytes + length bytes + data bytes
        isTLVComplete = curTLV.length === 2 + lengthBytes * 2 + length * 2;
      }

      if (isTLVComplete) {
        return [...acc, curTLV, ''];
      }
      return [...acc, curTLV];
    },
    [''],
  );
  return result.filter(res => !!res);
}
