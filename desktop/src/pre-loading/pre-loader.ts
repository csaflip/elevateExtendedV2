import { contextBridge, ipcRenderer, IpcRendererEvent, OpenDialogSyncOptions, shell } from "electron";
import { BridgeApi, Channel } from "@elevate/shared/electron";

const api: BridgeApi = {
  // App actions
  minimizeApp: () => ipcRenderer.invoke(Channel.minimizeApp),
  enableFullscreen: () => ipcRenderer.invoke(Channel.enableFullscreen),
  disableFullscreen: () => ipcRenderer.invoke(Channel.disableFullscreen),
  isFullscreen: () => ipcRenderer.invoke(Channel.isFullscreen),
  restartApp: () => ipcRenderer.invoke(Channel.restartApp),
  closeApp: () => ipcRenderer.invoke(Channel.closeApp),
  resetApp: () => ipcRenderer.invoke(Channel.resetApp),
  invoke: (channel: Channel, ...args: any[]) => ipcRenderer.invoke(channel, args),
  receive: (channel: Channel, listener: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on(channel, listener),

  // File operations
  existsSync: (path: string | URL) => ipcRenderer.invoke(Channel.existsSync, path),
  isDirectory: (path: string | URL) => ipcRenderer.invoke(Channel.isDirectory, path),
  isFile: (path: string | URL) => ipcRenderer.invoke(Channel.isFile, path),

  // Remote electron stuff
  electronVersion: process.versions.electron,
  nodePlatform: process.platform,
  shell: shell,
  showOpenDialogSync: (options: OpenDialogSyncOptions) => ipcRenderer.invoke(Channel.showOpenDialogSync, options),
  clearStorageData: (options?: Electron.ClearStorageDataOptions) =>
    ipcRenderer.invoke(Channel.clearStorageData, options),
  getPath: (
    name:
      | "home"
      | "appData"
      | "userData"
      | "cache"
      | "temp"
      | "exe"
      | "module"
      | "desktop"
      | "documents"
      | "downloads"
      | "music"
      | "pictures"
      | "videos"
      | "recent"
      | "logs"
      | "pepperFlashSystemPlugin"
      | "crashDumps"
  ) => ipcRenderer.invoke(Channel.getPath, name)
};

contextBridge.exposeInMainWorld("api", api);