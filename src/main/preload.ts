import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

/**
 * An object containing methods for interacting with the ipcRenderer process
 */
const electronHandler = {
  ipcRenderer: {
    /**
     * Sends a message to the main process via a specified channel
     * @param channel - The channel to send the message through
     * @param args - The arguments to send with the message
     */
    sendMessage(channel: string, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },

    /**
     * Listens for a message on a specified channel and executes a callback function when the message is received
     * @param channel - The channel to listen on
     * @param func - The callback function to execute when a message is received
     * @returns A function to remove the listener
     */
    on(channel: string, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },

    /**
     * Listens for a single message on a specified channel and executes a callback function when the message is received
     * @param channel - The channel to listen on
     * @param func - The callback function to execute when a message is received
     */
    once(channel: string, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },

    /**
     * Sends a message to the main process to render and run a Docker container
     * @param text - The text to render and run the Docker container with
     */
    renderAndRunDocker(text: string) {
      ipcRenderer.send('renderAndRunDocker', text);
    },

    /**
     * Sends a message to the main process to re-run a Docker container on a specified port
     * @param port - The port to run the Docker container on
     */
    reRunDocker(port: number) {
      ipcRenderer.send('reRunDocker', port);
    },

    /**
     * Sends a message to the main process to run a URL
     * @param url - The URL to run
     */
    runByUrl(url: string) {
      ipcRenderer.send('runByUrl', url);
    },

    /**
     * Sends a message to the main process to set a value in the store
     * @param key - The key to set the value for
     * @param value - The value to set
     */
    setStoreValue: (key: string, value: any) => {
      ipcRenderer.send("setStore", key, value)
    },

    /**
     * Sends a synchronous message to the main process to get a value from the store
     * @param key - The key to get the value for
     * @returns The value associated with the key
     */
    getStoreValue(key: string) {
      const resp = ipcRenderer.sendSync("getStore", key)
      return resp
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
