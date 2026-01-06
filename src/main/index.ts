import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import Gun from 'gun'
import * as http from 'http'

// Helper pour détecter le mode dev
const isDev =
  process.env.NODE_ENV === 'development' ||
  process.defaultApp ||
  /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
  /[\\/]electron[\\/]/.test(process.execPath)

const is = {
  dev: isDev
}

// Instance globale GUN pour le serveur local
let gunServer: any
let httpServer: http.Server | null = null
let mainWindow: BrowserWindow | null = null
let gunServerPort: number = 8765
let isServerRunning: boolean = false

function createWindow(): void {
  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false, // Supprimer la barre de titre par défaut
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#1a1a1a',
    icon: process.platform === 'darwin' ? undefined : join(__dirname, '../../build/icon.png')
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Charger l'app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Ne pas démarrer le serveur automatiquement
}

// Démarrer le serveur Gun HTTP
function startGunServer(port: number = 8765): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isServerRunning) {
      resolve(`Serveur déjà en cours sur le port ${gunServerPort}`)
      return
    }

    try {
      // Créer le serveur HTTP
      httpServer = http.createServer((req, res) => {
        // CORS headers pour permettre les connexions externes
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        res.writeHead(200)
        res.end('Gun Server Running')
      })

      // Initialiser Gun sur le serveur HTTP
      gunServer = Gun({ web: httpServer, file: 'gun-data' })

      // Démarrer le serveur
      httpServer.listen(port, () => {
        gunServerPort = port
        isServerRunning = true
        const message = `Serveur Gun démarré sur http://localhost:${port}/gun`
        console.log(message)
        resolve(message)
      })

      httpServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(`Le port ${port} est déjà utilisé`)
        } else {
          reject(`Erreur serveur: ${err.message}`)
        }
      })
    } catch (error: any) {
      reject(`Erreur lors du démarrage: ${error.message}`)
    }
  })
}

// Arrêter le serveur Gun
function stopGunServer(): Promise<string> {
  return new Promise((resolve) => {
    if (!isServerRunning || !httpServer) {
      resolve('Aucun serveur en cours')
      return
    }

    httpServer.close(() => {
      httpServer = null
      gunServer = null
      isServerRunning = false
      const message = 'Serveur Gun arrêté'
      console.log(message)
      resolve(message)
    })
  })
}

// Obtenir l'adresse IP locale
function getLocalIP(): string {
  const { networkInterfaces } = require('os')
  const nets = networkInterfaces()

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // IPv4 et pas une adresse interne
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

// Créer le menu de l'application
function createMenu(): void {
  const template: any[] = [
    {
      label: 'P2P Chat',
      submenu: [
        {
          label: 'À propos',
          click: () => {
            // TODO: Afficher une fenêtre À propos
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Recharger' },
        { role: 'forceReload', label: 'Forcer le rechargement' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Réinitialiser le zoom' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC Handlers
ipcMain.handle('app:getVersion', () => app.getVersion())
ipcMain.handle('app:getPlatform', () => process.platform)

// Window Control Handlers
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized()
})

// Gun Server Handlers
ipcMain.handle('gun:startServer', async (_, port?: number) => {
  try {
    const message = await startGunServer(port || 8765)
    return { success: true, message, port: gunServerPort, ip: getLocalIP() }
  } catch (error: any) {
    return { success: false, message: error }
  }
})

ipcMain.handle('gun:stopServer', async () => {
  try {
    const message = await stopGunServer()
    return { success: true, message }
  } catch (error: any) {
    return { success: false, message: error }
  }
})

ipcMain.handle('gun:getServerStatus', () => {
  return {
    isRunning: isServerRunning,
    port: gunServerPort,
    ip: getLocalIP(),
    url: isServerRunning ? `http://${getLocalIP()}:${gunServerPort}/gun` : null
  }
})

// Événements de l'application
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.student.p2pchat')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  createMenu()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Nettoyer le serveur GUN
  if (gunServer) {
    gunServer = null
  }
})
