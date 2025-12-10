import { ElectronAPI } from '@electron-toolkit/preload'

interface GunServerStatus {
  isRunning: boolean
  port: number
  ip: string
  url: string | null
}

interface GunServerResult {
  success: boolean
  message: string
  port?: number
  ip?: string
}

interface P2PChatAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
  gunServer: {
    start: (port?: number) => Promise<GunServerResult>
    stop: () => Promise<GunServerResult>
    getStatus: () => Promise<GunServerStatus>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    p2pChat: P2PChatAPI
  }
}
