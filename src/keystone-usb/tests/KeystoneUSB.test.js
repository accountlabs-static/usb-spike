/** @type {import('jest').Config} */

import { KeystoneUSB } from '../KeystoneUSB';

const stubUSB = {
  opened: true,
  configuration: {
    interfaces: [
      {
        claimed: true,
        alternate: {
          endpoints: [
            {
              direction: 'in',
              packageSize: 64,
            },
          ],
        },
      },
    ],
  },
  transferOut: jest.fn().mockResolvedValue({
    bytesWritten: 14,
    status: 'ok',
  }),
  transferIn: jest.fn().mockResolvedValue({
    data: {
      buffer: Buffer.from(
        '6B000000010100012C00010D4B657973746F6E653350726F00020B3030303030303030303100030545565431000406302E362E3800712c98c2',
        'hex',
      ),
    },
  }),
};

describe('KeystoneUSB', () => {
  it('should able to get device base info', async () => {
    const keystone = new KeystoneUSB(stubUSB);
    const baseInfo = await keystone.getDeviceBaseInfo();

    expect(baseInfo).toMatchObject({
      model: 'Keystone3Pro',
      sn: '0000000001',
      hardVersion: 'EVT1',
      romVersion: '0.6.8',
    });
  });

  it('should able to get send file info ack', async () => {
    jest.spyOn(stubUSB, 'transferIn').mockResolvedValue({
      status: 'ok',
      data: {
        // ack hex
        buffer: Buffer.from('6B0000000201000000004A1F25BA', 'hex'),
      },
    });
    const keystone = new KeystoneUSB(stubUSB);
    const sendFileInfoRes = await keystone.sendFileInfo({
      filename: 'pillar.bin',
      filesize: 345678,
      filemd5: 'asdfsadfsdafsdafasfsdafsadfsafd',
      fileSig: 'asdfsadfsdafsdafasfsdafsadfsafd',
    });

    expect(sendFileInfoRes._frame.flags.ack).toBe(0);
  });

  it('should able to get send file success', async () => {
    jest.spyOn(stubUSB, 'transferIn').mockResolvedValue({
      status: 'ok',
      data: {
        buffer: Buffer.from('6B000000020200000600030400100000A8B42B92', 'hex'),
      },
    });
    const keystone = new KeystoneUSB(stubUSB);
    const sendFileRes = await keystone.sendFile({
      fileContent: new Uint8Array(4096),
      chunkSize: 4096,
    });
    expect(sendFileRes).toBe(true);
  });
});
