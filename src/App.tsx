import React from 'react';
import './App.css';
import Button from '@mui/material/Button';
import { KeystoneUSB } from './keystone-usb/KeystoneUSB';
import TextField from '@mui/material/TextField';

function App() {
  const [keystone, setKeystone] = React.useState<KeystoneUSB | null>(null);
  const [path, setPath] = React.useState<string>("44'/60'/0'/0");
  const [rootPath, setRootPath] = React.useState<string>("44'/60'/0'");

  const connect = async () => {
    const instance = new KeystoneUSB();

    if (instance) {
      await instance.init();
      setKeystone(instance);
    }
  }

  const sign = React.useCallback(async () => {
    if (keystone) {
      const parseResult = await keystone.signTx({ data: path, rootPath }) as any;
      console.log(parseResult);
      alert(`${path}: ${parseResult?.res}`);
    }
  }, [keystone, path, rootPath])

  const getDeviceInfo = async () => {
    if (keystone) {
      const parseResult = await keystone.getDeviceBaseInfo();
      console.log(parseResult);
    }
  }

  return (
    <div className="App">
      <TextField label="Root Path" variant="outlined" value={rootPath} onChange={(e) => {
        setRootPath(e.target.value);
      }} />
      <TextField label="Path" variant="outlined" value={path} onChange={(e) => {
        setPath(e.target.value);
      }} />
      <Button variant="contained" disabled={keystone?.isConnect()} onClick={connect}>Connect Keystone3</Button>
      <Button variant="contained" disabled={!keystone?.isConnect()} onClick={sign}>Get Address</Button>
      <Button variant="contained" disabled={!keystone?.isConnect()} onClick={getDeviceInfo}>getDeviceInfo</Button>
    </div>
  );
}

export default App;
