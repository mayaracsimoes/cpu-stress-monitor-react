import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // Funções para iniciar e parar o teste de estresse
  startStress: (numThreads) => ipcRenderer.invoke('start-stress', numThreads),
  stopStress: () => ipcRenderer.invoke('stop-stress'),

  // Função para obter informações estáticas da CPU
  getCpuInfo: () => ipcRenderer.invoke('get-cpu-info'),

  // Função para se inscrever em atualizações de dados de monitoramento
  onCpuDataUpdate: (callback) => ipcRenderer.on('cpu-data-update', (_event, data) => callback(data)),

  // Função para remover o listener (limpeza)
  removeCpuDataUpdateListener: () => ipcRenderer.removeAllListeners('cpu-data-update'),

  getSystemDetails: () => ipcRenderer.invoke('get-detailed-system-info')
}

// Use `contextBridge` para expor APIs seguras ao processo de renderização
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
