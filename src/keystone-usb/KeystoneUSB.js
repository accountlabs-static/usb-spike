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

  async signTx(unsignedTx, fromAddress) {
    const protocol = new KeystoneProtocol();
    const cmd = KeystoneProtocol.Command.SignTxMessage.signTx;
    protocol.frame.appendData(cmd.data.data, 'hello world?????');
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
      throw new Error('get device info failed');
    }
    return parseResult;
  }

  async sendFileInfo({ filename, filesize, filemd5, fileSig }) {
    const protocol = new KeystoneProtocol();
    const cmd = KeystoneProtocol.Command.FileTransfer.FileInfo;
    protocol.frame.appendData(cmd.data.filename, filename || 'pillar.bin');
    protocol.frame.appendData(cmd.data.filesize, filesize, 4);
    protocol.frame.appendData(cmd.data.filemd5, filemd5);
    protocol.frame.appendData(cmd.data.fileSig, fileSig);
    const sendRes = await this.send(protocol.generateCommand(cmd));
    protocol.incrementPackageIndex(this.packageIndex);
    if (sendRes.status !== 'ok') throw new Error('send file info error');

    const receiveRes = await this.receive();
    const parseResult = KeystoneProtocol.parseResult(
      new Uint8Array(receiveRes.data.buffer),
    );
    if (receiveRes.status !== 'ok') throw new Error('receive file info error');
    const isFileInfo = parseResult._frame.isCommand(
      KeystoneProtocol.Command.FileTransfer.FileInfo,
    );
    const isTlvAck = parseResult._frame.hasType(
      KeystoneProtocol.Command.FileTransfer.FileInfo.data.ack.id,
    );
    if (isFileInfo && isTlvAck) {
      const error = find(UsbErrorStatus, it => it.id === parseResult.ack);
      if (error) {
        throw new Error(error.msg);
      }
      if (parseResult.ack !== 0) {
        throw new Error(UsbErrorStatus.Incorrect.msg);
      }
    }
    return parseResult;
  }

  async sendFile({ fileContent, chunkSize = 4096, onProgress }) {
    const protocol = new KeystoneProtocol();
    const cmd = KeystoneProtocol.Command.FileTransfer.FileContent;

    this.sendProgress.allSize = fileContent.byteLength;
    const chunkedData = chunk(fileContent, chunkSize);

    let receiveRes = null;
    let parseResult = null;
    let isSended = false;
    let sendedAck = false;
    for (const [idx, data] of Object.entries(chunkedData)) {
      protocol.frame.appendData(cmd.data.offset, idx * chunkSize, 4);
      protocol.frame.appendData(
        cmd.data.data,
        Buffer.from(data).toString('hex'),
        4,
      );
      const sendData = protocol.generateCommand(
        KeystoneProtocol.Command.FileTransfer.FileContent,
      );
      const sendRes = await this.send(sendData);
      protocol.incrementPackageIndex(this.packageIndex);
      if (sendRes.status !== 'ok') {
        throw new Error(`Send failed: ${sendRes.status}`);
      }

      receiveRes = await this.receive();
      parseResult = KeystoneProtocol.parseResult(
        new Uint8Array(receiveRes?.data.buffer),
      );
      if (receiveRes.status === 'ok' && parseResult) {
        const isReceiveType = parseResult._frame.dataZone.at(0)?.type === 3;
        if (parseResult.ack !== 0 && !isReceiveType) {
          throw new Error('Invalid Received device size');
        }
        this.sendProgress.current = parseResult.deviceReceive;
        onProgress?.(this.sendProgress);
        if (
          Number(idx) === chunkedData.length - 1 &&
          fileContent.byteLength === parseResult.deviceReceive
        ) {
          isSended = true;
        }
      }
      protocol.frame.clearData();
    }
    if (isSended) {
      const sendData = protocol.generateCommand(
        KeystoneProtocol.Command.FileTransfer.Transfered,
      );
      protocol.frame.setAck(1);
      const sendRes = await this.send(sendData);
      if (sendRes.status !== 'ok') {
        throw new Error(`Send failed: ${sendRes.status}`);
      }

      receiveRes = await this.receive();
      parseResult = KeystoneProtocol.parseResult(
        new Uint8Array(receiveRes.data.buffer),
      );
      if (parseResult._frame.flags.ack === 0) {
        sendedAck = true;
      }
    }

    return isSended && sendedAck;
  }
}
