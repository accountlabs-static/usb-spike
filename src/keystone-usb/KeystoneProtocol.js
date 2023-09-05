import { KeystoneFrame } from './KeystoneFrame';
import { Buffer } from 'buffer';

import {
  getServiceCommandDefinition,
  ServiceCommandId,
} from './serviceCommands';

export class KeystoneProtocol {
  /** @type {KeystoneFrame} */
  frame = null;

  static Command = ServiceCommandId;

  constructor() {
    this.frame = new KeystoneFrame();
  }

  generateCommand(cmd) {
    this.#setCommand(cmd);
    return this.frame.toU8a();
  }

  #setCommand({ serviceId, commandId }) {
    this.frame.setServiceId(serviceId);
    this.frame.setCommandId(commandId);
  }

  incrementPackageIndex(index) {
    this.frame.incrementPackageIndex(index);
  }

  static parseResult(arr) {
    const frame = KeystoneFrame.from(Buffer.from(arr).toString('hex'));
    const data = frame.getData();
    const commandType = getServiceCommandDefinition({
      serviceId: frame.serviceId,
      commandId: frame.commandId,
    });
    const results = data.map(it => {
      const { key, type } = commandType.find(cIt => cIt.id === it.type);
      return [key, it?.formatValue(type)];
    });
    return {
      _frame: frame,
      ...Object.fromEntries(results),
    };
  }
}
