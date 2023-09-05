export const ErrorType = {
  page: 'page',
  tip: 'tip',
};
export const UsbErrorStatus = {
  LowBattery: {
    id: 1,
    type: ErrorType.tip,
    msg: 'Device low battery',
  },
  DeviceLocked: {
    id: 2,
    type: ErrorType.tip,
    msg: 'Device is locked',
  },
  VerifySignError: {
    id: 3,
    type: ErrorType.page,
    msg: 'Verify signature error',
  },
  FileInfoError: {
    id: 4,
    type: ErrorType.page,
    msg: 'File name or File size error',
  },
  FileCreateFailed: {
    id: 5,
    type: ErrorType.page,
    msg: 'Device file creation failed',
  },
  Incorrect: {
    type: ErrorType.page,
    msg: 'Device status is incorrect',
  },
};
