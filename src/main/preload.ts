import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: string, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: string, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    renderAndRunDocker(text: string) {
      ipcRenderer.send('renderAndRunDocker', text);
    },
    runByUrl(url: string) {
      ipcRenderer.send('runByUrl', url);
    },
    setStoreValue: (key: string, value: any) => {
      ipcRenderer.send("setStore", key, value)
    },
    getStoreValue(key: string) {
      const resp = ipcRenderer.sendSync("getStore", key)
      return resp
    }
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
