import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

console.log('[Preload] Initializing...')

// API basique exposée au renderer
const api = {
  // API Electron de base
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // API Gun Server
  gunServer: {
    start: (port?: number) => ipcRenderer.invoke('gun:startServer', port),
    stop: () => ipcRenderer.invoke('gun:stopServer'),
    getStatus: () => ipcRenderer.invoke('gun:getServerStatus')
  },

  // API Window Controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  }
}

// Exposer l'API de manière sécurisée
console.log('[Preload] Context isolated:', process.contextIsolated)

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('p2pChat', api)
    console.log('[Preload] APIs exposed successfully via contextBridge')
  } catch (error) {
    console.error('[Preload] Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.p2pChat = api
  console.log('[Preload] APIs exposed directly to window')
}

console.log('[Preload] Initialization complete')
