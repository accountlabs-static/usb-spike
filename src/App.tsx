import React from 'react';
import './App.css';
import Button from '@mui/material/Button';
import { KeystoneUSB } from './keystone-usb/KeystoneUSB';

function App() {
  const connect = async () => {
    const instance = new KeystoneUSB();

    if (instance) {
      await instance.init();
      const parseResult = await instance.signTx();
      alert(JSON.stringify(parseResult));
      console.log('parseResult: ', parseResult);
    }
  }

  return (
    <div className="App">
      <Button variant="contained" onClick={connect}>Connect Keystone3</Button>
    </div>
  );
}

export default App;
