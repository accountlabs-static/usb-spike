/** @type {import('jest').Config} */

import { KeystoneFrame } from '../KeystoneFrame';

describe('KeystoneFrame', () => {
  describe('serliaze', () => {
    it('should seriliaze object to message with default command', () => {
      const keystoneFrame = new KeystoneFrame();
      const message = keystoneFrame.serliaze();
      expect('6b000000010100010000d307733d').toBe(message);
    });

    it('should seriliaze object to message with command', () => {
      const keystoneFrame = new KeystoneFrame();

      keystoneFrame.setServiceId(2);
      keystoneFrame.setCommandId(1);

      keystoneFrame.appendData(1, 'pillar.bin');
      keystoneFrame.appendData(2, 3693958, 4);
      keystoneFrame.appendData(3, '4e55ac56dbb89c29f57b89eff0b2d990');

      const message = keystoneFrame.serliaze();
      expect(message).toBe(
        '6b000000020100012500010b70696c6c61722e62696e000204865d380003104e55ac56dbb89c29f57b89eff0b2d990815fbc8d',
      );
    });
  });

  describe('parse', () => {
    it('should parse keystone frame message', () => {
      const keystoneFrame = KeystoneFrame.from(
        '6B000000010100012C00010D4B657973746F6E653350726F00020B3030303030303030303100030545565431000406302E362E3800712c98c2',
      );

      expect(keystoneFrame.serviceId).toBe(1);
      expect(keystoneFrame.commandId).toBe(1);
      expect(keystoneFrame.flags.ack).toBe(0);
      expect(keystoneFrame.flags.isHost).toBe(1);

      expect(keystoneFrame.getData(1, 'string')).toEqual('Keystone3Pro');
      expect(keystoneFrame.getData(2, 'string')).toEqual('0000000001');
      expect(keystoneFrame.getData(3, 'string')).toEqual('EVT1');
      expect(keystoneFrame.getData(4, 'string')).toEqual('0.6.8');
    });

    it('should throw an error given keystone frame with wrong head', () => {
      const messageWithIncorrectHead =
        '55000000010100012C00010D4B657973746F6E653350726F00020B3030303030303030303100030545565431000406302E362E3800d4a128b7';

      expect(() => KeystoneFrame.from(messageWithIncorrectHead)).toThrowError(
        'Invalid frame head',
      );
    });

    it('should throw an error given keystone frame with wrong CRC', () => {
      const messageWithIncorrectHead =
        '6B000000010100012C00010D4B657973746F6E653350726F00020B3030303030303030303100030545565431000406302E362E3800d4a128b7';

      expect(() => KeystoneFrame.from(messageWithIncorrectHead)).toThrowError(
        'Invalid CRC',
      );
    });
  });
});
