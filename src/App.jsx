import React, { useState, useEffect } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts'
import './App.css'

const api = window.api

function App() {
  // Estado para controlar a aba ativa ('dashboard' ou 'details')
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estado para armazenar os detalhes do sistema
  const [sysDetails, setSysDetails] = useState(null);

  // --- SEUS ESTADOS ORIGINAIS ---
  const [monitorData, setMonitorData] = useState({
    totalLoad: '0.0', coresLoad: [], temp: 'N/A', speed: 'N/A'
  })
  const [historyData, setHistoryData] = useState([])
  const MAX_HISTORY_POINTS = 60 
  const [cpuInfo, setCpuInfo] = useState({ cores: 0, physicalCores: 0, manufacturer: 'N/A', brand: 'N/A' })
  const [isStressing, setIsStressing] = useState(false)
  const [numThreads, setNumThreads] = useState(1)

  // 1. Carrega CPU Info e System Details ao iniciar
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const info = await api.getCpuInfo()
        setCpuInfo(info)
        setNumThreads(info.cores)

        // Carrega os detalhes do sistema (CPU-Z style)
        const details = await api.getSystemDetails();
        setSysDetails(details);
      } catch (error) {
        console.error('Erro ao inicializar:', error)
      }
    }
    loadInitialData()
  }, [])

  // 2. Listener de Monitoramento (igual ao anterior)
  useEffect(() => {
    api.onCpuDataUpdate((data) => {
      setMonitorData(data)
      setHistoryData(prevHistory => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          load: parseFloat(data.totalLoad),
          temp: parseFloat(data.temp) || 0,
          speed: parseFloat(data.speed) || 0
        }
        const newHistory = [...prevHistory, newPoint]
        if (newHistory.length > MAX_HISTORY_POINTS) newHistory.shift()
        return newHistory
      })
    })
    return () => api.removeCpuDataUpdateListener()
  }, [])

  // --- HANDLERS (iguais aos anteriores) ---
  const handleStartStress = async () => {
    if (isStressing) return
    const threadsToUse = Math.max(1, parseInt(numThreads))
    await api.startStress(threadsToUse)
    setIsStressing(true)
  }

  const handleStopStress = async () => {
    if (!isStressing) return
    await api.stopStress()
    setIsStressing(false)
  }

  const handleThreadChange = (e) => setNumThreads(parseInt(e.target.value))

  const coresChartData = monitorData.coresLoad.map((load, index) => ({
    name: `C${index + 1}`,
    load: parseFloat(load)
  }));

  // --- RENDERIZAÇÃO ---
  return (
    <div className="dashboard-container">
      {/* HEADER COM ABAS */}
      <div className="header">
        <h1>CPU Stress & Info</h1>
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Monitoramento
          </button>
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Detalhes de Hardware
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA DASHBOARD */}
      {activeTab === 'dashboard' && (
        <>
          <div className="info-cards">
            <div className="card">
              <div className="card-title">Carga Total</div>
              <div className="card-value">{monitorData.totalLoad}%</div>
            </div>
            <div className="card">
              <div className="card-title">Temperatura</div>
              <div className="card-value">{monitorData.temp}°C</div>
            </div>
            <div className="card">
              <div className="card-title">Clock</div>
              <div className="card-value">{monitorData.speed} GHz</div>
            </div>
            <div className="card">
              <div className="card-title">Status</div>
              <div className={`card-value status-message ${isStressing ? 'status-running' : 'status-stopped'}`}>
                {isStressing ? 'RODANDO' : 'PARADO'}
              </div>
            </div>
          </div>

          <div className="controls">
            <label>Threads: </label>
            <input type="number" min="1" max={cpuInfo.cores} value={numThreads} onChange={handleThreadChange} disabled={isStressing} />
            <button className="start-button" onClick={handleStartStress} disabled={isStressing}>INICIAR</button>
            <button className="stop-button" onClick={handleStopStress} disabled={!isStressing}>PARAR</button>
          </div>

          <div className="chart-container">
            <h3>Histórico</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#ccc" />
                <YAxis yAxisId="left" stroke="#007acc" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#ff4500" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#252526', border: '1px solid #333' }} />
                <Line yAxisId="left" type="monotone" dataKey="load" stroke="#007acc" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#ff4500" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Carga por Núcleo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={coresChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#ccc" tick={{fontSize: 10}} />
                <YAxis domain={[0, 100]} stroke="#ccc" />
                <Tooltip cursor={{fill: '#333'}} contentStyle={{ backgroundColor: '#252526', border: '1px solid #333' }} />
                <Bar dataKey="load">
                  {coresChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.load > 80 ? '#ff4500' : '#007acc'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* CONTEÚDO DA ABA DETALHES (Estilo Tabela) */}
      {activeTab === 'details' && sysDetails && (
        <div className="details-container">
          
          <div className="detail-section">
            <h3>🖥️ Sistema Operacional</h3>
            <table className="detail-table">
              <tbody>
                <tr><td>Plataforma</td><td>{sysDetails.os.platform} ({sysDetails.os.distro})</td></tr>
                <tr><td>Release</td><td>{sysDetails.os.release}</td></tr>
                <tr><td>Arquitetura</td><td>{sysDetails.os.arch}</td></tr>
                <tr><td>Hostname</td><td>{sysDetails.os.hostname}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="detail-section">
            <h3>🔌 Placa-Mãe (Motherboard)</h3>
            <table className="detail-table">
              <tbody>
                <tr><td>Fabricante</td><td>{sysDetails.system.manufacturer}</td></tr>
                <tr><td>Modelo</td><td>{sysDetails.system.model}</td></tr>
                <tr><td>Versão</td><td>{sysDetails.system.version}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="detail-section">
            <h3>🎮 Gráficos (GPU)</h3>
            {sysDetails.gpu.controllers.map((gpu, i) => (
              <table key={i} className="detail-table">
                <tbody>
                  <tr><td>Modelo</td><td>{gpu.model}</td></tr>
                  <tr><td>VRAM</td><td>{gpu.vram ? `${gpu.vram} MB` : 'Compartilhada'}</td></tr>
                  <tr><td>Driver</td><td>{gpu.driverVersion || 'N/A'}</td></tr>
                </tbody>
              </table>
            ))}
          </div>

          <div className="detail-section">
            <h3>💾 Armazenamento</h3>
            {sysDetails.disk.map((disk, i) => (
              <table key={i} className="detail-table">
                <tbody>
                  <tr><td>Disco {i}</td><td>{disk.name}</td></tr>
                  <tr><td>Tipo</td><td>{disk.type} ({disk.interfaceType})</td></tr>
                  <tr><td>Tamanho</td><td>{(disk.size / (1024 ** 3)).toFixed(2)} GB</td></tr>
                </tbody>
              </table>
            ))}
          </div>

          <div className="detail-section">
            <h3>🧠 Memória RAM</h3>
            {sysDetails.mem.map((ram, i) => (
              <table key={i} className="detail-table">
                <tbody>
                  <tr><td>Slot {ram.bank || i}</td><td>{ram.size ? `${(ram.size / (1024 ** 3)).toFixed(1)} GB` : 'Vazio'}</td></tr>
                  <tr><td>Tipo</td><td>{ram.type} @ {ram.clockSpeed} MHz</td></tr>
                  <tr><td>Fabricante</td><td>{ram.manufacturer}</td></tr>
                </tbody>
              </table>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}

export default App