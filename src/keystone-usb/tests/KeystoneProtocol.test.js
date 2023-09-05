/** @type {import('jest').Config} */

import { KeystoneProtocol } from '../KeystoneProtocol';

describe('KeystoneProtocol', () => {
  describe('generateCommand', () => {
    it('should generate device base info request message', () => {
      const keystoneProtocal = new KeystoneProtocol();

      const deviceInfoCmdHex = '6b000000010100010000d307733d';
      const deviceInfoCmd = Uint8Array.from(
        Buffer.from(deviceInfoCmdHex, 'hex'),
      );
      expect(
        keystoneProtocal.generateCommand(
          KeystoneProtocol.Command.DeviceInfo.BaseInfo,
        ),
      ).toEqual(deviceInfoCmd);
    });
  });

  describe('parseResult', () => {
    it('should parse message to object', async () => {
      const deviceBaseInfoHexResult =
        '6B000000010100012C00010D4B657973746F6E653350726F00020B3030303030303030303100030545565431000406302E362E3800712c98c2';
      const deviceInfoResult = Uint8Array.from(
        Buffer.from(deviceBaseInfoHexResult, 'hex'),
      );

      const expectResult = {
        model: 'Keystone3Pro',
        sn: '0000000001',
        hardVersion: 'EVT1',
        romVersion: '0.6.8',
      };

      expect(KeystoneProtocol.parseResult(deviceInfoResult)).toMatchObject(
        expectResult,
      );
    });
  });
});
