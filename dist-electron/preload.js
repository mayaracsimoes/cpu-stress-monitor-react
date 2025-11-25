"use strict";
const electron = require("electron");
const api = {
  // Funções para iniciar e parar o teste de estresse
  startStress: (numThreads) => electron.ipcRenderer.invoke("start-stress", numThreads),
  stopStress: () => electron.ipcRenderer.invoke("stop-stress"),
  // Função para obter informações estáticas da CPU
  getCpuInfo: () => electron.ipcRenderer.invoke("get-cpu-info"),
  // Função para se inscrever em atualizações de dados de monitoramento
  onCpuDataUpdate: (callback) => electron.ipcRenderer.on("cpu-data-update", (_event, data) => callback(data)),
  // Função para remover o listener (limpeza)
  removeCpuDataUpdateListener: () => electron.ipcRenderer.removeAllListeners("cpu-data-update"),
  getSystemDetails: () => electron.ipcRenderer.invoke("get-detailed-system-info")
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}
