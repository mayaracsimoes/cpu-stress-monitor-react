const { app, BrowserWindow, ipcMain } = require('electron')
const { join } = require('path')

const { Worker } = require('worker_threads')
const si = require('systeminformation')

// Caminho para o script do worker
const workerPath = join(__dirname, 'stressWorker.cjs')

let mainWindow
let stressWorkers = []
let monitorInterval = null
const MONITOR_INTERVAL_MS = 1000 // 1 segundo

/**
 * Cria a janela principal do Electron.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // carregar o conteúdo da janela
  if (process.env.NODE_ENV === 'development' && process.env['VITE_DEV_SERVER_URL']) {
    mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Mostra a janela e inicia o monitoramento APÓS o carregamento
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    startMonitoring()
  })

  // Lidar com o fechamento da janela
  mainWindow.on('close', (event) => {
    stopStressTest()
    stopMonitoring()
  })
}

/**
 * Configura os handlers de comunicação Inter-Process (IPC).
 */
function setupIpcHandlers() {
  ipcMain.handle('start-stress', (_, numThreads) => {
    startStressTest(numThreads)
    return { success: true, message: `Teste iniciado com ${numThreads} threads.` }
  })

  ipcMain.handle('stop-stress', () => {
    stopStressTest()
    return { success: true, message: 'Teste de estresse parado.' }
  })

  ipcMain.handle('get-cpu-info', async () => {
    const cpu = await si.cpu()
    return {
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      manufacturer: cpu.manufacturer,
      brand: cpu.brand
    }
  })

  ipcMain.handle('get-detailed-system-info', async () => {
    try {
      // Coleta dados em paralelo para ser mais rápido
      const [osInfo, system, memLayout, graphics, diskLayout] = await Promise.all([
        si.osInfo(),      // Versão do Windows/Linux
        si.system(),      // Fabricante e Modelo da Placa-mãe
        si.memLayout(),   // Pentes de memória (RAM) individuais
        si.graphics(),    // Placas de vídeo
        si.diskLayout()   // SSDs e HDs físicos
      ])

      return {
        os: osInfo,
        system: system,
        mem: memLayout,
        gpu: graphics,
        disk: diskLayout
      }
    } catch (e) {
      console.error(e)
      return null
    }
  })
}

// Configurações padrão do Electron
app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * Inicia o loop de monitoramento
 */
function startMonitoring() {
  if (monitorInterval) return

  monitorInterval = setInterval(async () => {
    try {
      const cpuLoad = await si.currentLoad()
      const cpuTemp = await si.cpuTemperature()
      const cpuSpeed = await si.cpuCurrentSpeed()

      const data = {
        totalLoad: cpuLoad.currentLoad ? cpuLoad.currentLoad.toFixed(1) : '0.0',
        coresLoad: Array.isArray(cpuLoad.cpus)
          ? cpuLoad.cpus.map(core => core.load.toFixed(1))
          : [],
        temp: cpuTemp.main ? cpuTemp.main.toFixed(1) : 'N/A',
        speed: cpuSpeed.avg ? cpuSpeed.avg.toFixed(2) : 'N/A'
      }

      if (mainWindow) {
        mainWindow.webContents.send('cpu-data-update', data)
      }
    } catch (error) {
      console.error('Erro ao coletar dados de hardware:', error)
      stopMonitoring()
    }
  }, MONITOR_INTERVAL_MS)
}

/**
 * Para o loop de monitoramento de hardware.
 */
function stopMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }
}

/**
 * Inicia o teste de estresse criando workers.
 * @param {number} numThreads - O número de workers a serem criados.
 */
function startStressTest(numThreads) {
  if (stressWorkers.length > 0) {
    console.log('Teste de estresse já em execução.')
    return
  }

  console.log(`Iniciando teste de estresse com ${numThreads} threads...`)

  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(workerPath)
    stressWorkers.push(worker)

    worker.on('error', (err) => {
      console.error(`Worker ${i} erro:`, err)
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${i} terminou com código de saída ${code}`)
      }
      stressWorkers = stressWorkers.filter(w => w !== worker)
    })
  }
}

/**
 * Termina todos os workers de estresse.
 */
function stopStressTest() {
  if (stressWorkers.length === 0) {
    console.log('Nenhum teste de estresse em execução.')
    return
  }

  console.log(`Terminando ${stressWorkers.length} workers...`)

  stressWorkers.forEach(worker => {
    worker.terminate()
  })

  stressWorkers = []
}
