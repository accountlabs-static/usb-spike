/** @type {import('jest').Config} */

import { TLV } from '../TLV';

describe('TLV', () => {
  describe('serliaze', () => {
    it('should seriliaze object to messag with suffix 00 given value is string', () => {
      const tlv = new TLV({ type: 1, value: 'pillar.bin' });
      const message = tlv.serliaze();
      expect('010b70696c6c61722e62696e00').toBe(message);
    });

    it('should seriliaze object to message given value is number', () => {
      const tlv = new TLV({ type: 2, value: 3693958, byteLength: 4 });
      const message = tlv.serliaze();
      expect('0204865d3800').toBe(message);
    });

    it('should seriliaze object to message given value is hex string', () => {
      const tlv = new TLV({
        type: 3,
        value: '4e55ac56dbb89c29f57b89eff0b2d990',
      });
      const message = tlv.serliaze();
      expect('03104e55ac56dbb89c29f57b89eff0b2d990').toBe(message);
    });
  });

  describe('parse', () => {
    it('should parse string in given TLV', () => {
      const tlv = TLV.from('010b70696c6c61722e62696e00', 'string');

      expect(tlv.type).toBe(1);
      expect(tlv.value).toEqual('pillar.bin');
    });

    it('should parse number in given TLV', () => {
      const tlv = TLV.from('0204865d3800', 'number');

      expect(tlv.type).toBe(2);
      expect(tlv.value).toBe(3693958);
    });

    it('should parse hex string in given TLV', () => {
      const tlv = TLV.from('03104e55ac56dbb89c29f57b89eff0b2d990', 'hex');

      expect(tlv.type).toBe(3);
      expect(tlv.value).toEqual('4e55ac56dbb89c29f57b89eff0b2d990');
    });

    it('should parse message larger than 256 bytes', async () => {
      const stubData = Array.from({ length: 4096 })
        .fill(0)
        .map(_ => '00')
        .join('');
      const tlv = TLV.from(`029000${stubData}`);

      expect(tlv.type).toEqual(2);
      expect(tlv.byteLength).toEqual(4096);
      expect(tlv.value).toEqual(stubData);
    });
  });
});
