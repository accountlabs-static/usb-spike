import { chunk, find } from 'lodash';
import { KeystoneProtocol } from './KeystoneProtocol';
import { UsbErrorStatus } from './ErrorStatus';
import { Buffer } from 'buffer';

export const keystoneDeviceId = {
  productId: 12289,
  vendorId: 4617,
};

export class KeystoneUSB {
  endpoint;

  device = null;

  sendProgress = {
    current: 0,
    allSize: 0,
  };

  packageIndex = 0;

  endpointInfo = {
    inPackageSize: 64,
  };

  isConnect() {
    return this.device?.opened;
  }

  async init() {
    try {
      this.device = await navigator.usb.requestDevice({
        filters: [
          keystoneDeviceId,
        ],
      });
      if (!this.device) throw new Error('no selected device');

      if (!this.device.opened) {
        await this.device.open();
        if (this.device.configuration === null) {
          await this.devicet.selectConfiguration(1);
        }
        await this.device.claimInterface(1);

        this.endpoint = 3;
        this.initEndpointPackageSize();
      }
    } catch (err) {
      console.error('error useKeystoneUsb', err);
    }

    return this;
  }

  initEndpointPackageSize() {
    const deviceInterface = this.device.configuration?.interfaces?.find(
      it => it.claimed,
    );
    const inPackageSize = deviceInterface.alternate?.endpoints?.find(
      it => it.direction === 'in',
    )?.packetSize;

    this.endpointInfo.inPackageSize = inPackageSize;
  }

  incrementPackageIndex() {
    this.packageIndex += 1;
  }

  async send(command) {
    if (!this.device?.opened) {
      throw new Error('not connect device');
    }
    try {
      const res = await this.device.transferOut(this.endpoint, command);
      if (res.status !== 'ok') throw new Error('response status not ok', res);
      this.incrementPackageIndex();
      return res;
    } catch (err) {
      console.error('send out error', err);
    }
    return null;
  }

  async getAddress() {
    const protocol = new KeystoneProtocol();
    const cmd = KeystoneProtocol.Command.AddressInfo.params;
    protocol.frame.appendData(cmd.data.path, "44'/60'/0'/0'/0");
    await this.send(
      protocol.generateCommand(cmd),
    );
    protocol.incrementPackageIndex(this.packageIndex);
    const receiveRes = await this.receive();

    const parseResult = KeystoneProtocol.parseResult(
      new Uint8Array(receiveRes.data.buffer),
    );
    if (
      !parseResult._frame.isCommand(
        KeystoneProtocol.Command.AddressInfo.address,
      )
    ) {
      throw new Error('?');
    }
    return parseResult;
  }

  async receive() {
    if (!this.device?.opened) {
      throw new Error('not connect device');
    }
    try {
      const res = await this.device.transferIn(
        this.endpoint,
        this.endpointInfo.inPackageSize,
      );
      return res;
    } catch (err) {
      console.error('send out error', err);
    }
    return null;
  }

  async signTx({ data, rootPath }) {
    const protocol = new KeystoneProtocol();
    const cmd = KeystoneProtocol.Command.SignTxMessage.signTx;
    protocol.frame.appendData(cmd.data.data, data);
    protocol.frame.appendData(cmd.data.fromAddress, rootPath);
    protocol.frame.appendData(cmd.data.chainId, '0x666');
    await this.send(
      protocol.generateCommand(cmd),
    );
    protocol.incrementPackageIndex(this.packageIndex);
    const receiveRes = await this.receive();
    const parseResult = KeystoneProtocol.parseResult(
      new Uint8Array(receiveRes.data.buffer),
    );
    if (
      !parseResult._frame.isCommand(
        KeystoneProtocol.Command.SignTxMessage.signTxResponse,
      )
    ) {
      throw new Error('?');
    }
    return parseResult;
  }

  async getDeviceBaseInfo() {
    const protocol = new KeystoneProtocol();
    await this.send(
      protocol.generateCommand(KeystoneProtocol.Command.DeviceInfo.BaseInfo),
    );
    protocol.incrementPackageIndex(this.packageIndex);
    const receiveRes = await this.receive();
    const parseResult = KeystoneProtocol.parseResult(
      new Uint8Array(receiveRes.data.buffer),
    );
    if (
      !parseResult._frame.isCommand(
        KeystoneProtocol.Command.DeviceInfo.BaseInfo,
      )
    ) {
      throw new Error('get device info failed');
    }
    return parseResult;
  }
}
