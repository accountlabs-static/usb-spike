import { map } from 'lodash';

export const FieldType = {
  Number: 'number',
  String: 'string',
  Hex: 'hex',
};

export const DeviceInfoService = {
  id: 1,
  commands: {
    BaseInfo: {
      id: 1,
      data: {
        model: { id: 1, type: FieldType.String },
        sn: { id: 2, type: FieldType.String },
        hardVersion: { id: 3, type: FieldType.String },
        romVersion: { id: 4, type: FieldType.String },
      },
    },
    RuntimeInfo: {
      id: 2,
      data: {
        a: { id: 1, type: FieldType.String },
        b: { id: 2, type: FieldType.String },
        c: { id: 3, type: FieldType.String },
        d: { id: 4, type: FieldType.String },
        e: { id: 5, type: FieldType.String },
      },
    },
  },
};

export const FileTransferService = {
  id: 2,
  commands: {
    FileInfo: {
      id: 1,
      data: {
        filename: { id: 1, type: FieldType.String },
        filesize: { id: 2, type: FieldType.Number },
        filemd5: { id: 3, type: FieldType.String },
        fileSig: { id: 4, type: FieldType.String },
        ack: { id: 0xff, type: FieldType.Number },
      },
    },
    FileContent: {
      id: 2,
      data: {
        offset: { id: 1, type: FieldType.Number },
        data: { id: 2, type: FieldType.Number },
        deviceReceive: { id: 3, type: FieldType.Number },
      },
    },
    Transfered: {
      id: 3,
    },
  },
};

export const SignTxService = {
  id: 3,
  commands: {
    signTx: {
      id: 1,
      data: {
        data: { id: 1, type: FieldType.String },
      },
    },
    signTxResponse: {
      id: 2,
      data: {
        data: { id: 2, type: FieldType.String },
      },
    },
  }
}

function mapToServiceCommandId(service) {
  const serviceId = service.id;
  return {
    id: serviceId,
    ...Object.fromEntries(
      map(service.commands, ({ id, ...v }, k) => [
        k,
        {
          serviceId,
          commandId: id,
          ...v,
        },
      ]),
    ),
  };
}

export const ServiceCommandId = {
  /** @type {typeof DeviceInfoService.commands} */
  DeviceInfo: mapToServiceCommandId(DeviceInfoService),
  /** @type {typeof FileTransferService.commands} */
  FileTransfer: mapToServiceCommandId(FileTransferService),
    /** @type {typeof SignTxService.commands} */
  SignTxMessage: mapToServiceCommandId(SignTxService),
};

export function getServiceCommandDefinition({ serviceId, commandId }) {
  const targetService = Object.values(ServiceCommandId).find(
    service => service.id === serviceId,
  );
  const targetCommand = Object.values(targetService).find(
    command => command.commandId === commandId,
  );
  return Object.keys(targetCommand.data || {}).map(commandKey => ({
    key: commandKey,
    ...targetCommand.data[commandKey],
  }));
}
