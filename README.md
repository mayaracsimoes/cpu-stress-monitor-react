#  CPU Stress Test & Info

Uma aplicação Desktop multiplataforma desenvolvida para **monitoramento de hardware em tempo real** e execução de **testes de estresse** controlados na CPU.

Este projeto demonstra conceitos práticos de **Sistemas Operacionais**, focando em gerenciamento de processos, concorrência (multithreading via Worker Threads) e interação de baixo nível com hardware.

---

## Funcionalidades

### 1. 📊 Monitoramento em Tempo Real
- **Dashboard:** Exibe Carga Total (%), Temperatura (°C) e Velocidade do Clock (GHz) atualizados a cada segundo.
- **Gráficos Dinâmicos:** Histórico de desempenho (Linha) e Carga por Núcleo individual (Barras) usando `Recharts`.
- **Alertas Visuais:** Indicadores de cor (Verde/Vermelho) para níveis críticos de carga.

### 2. 🔥 Teste de Estresse Multithread
- **Carga Controlada:** Permite selecionar quantos núcleos (threads) estressar.
- **Non-Blocking UI:** Utiliza **Node.js Worker Threads** para rodar a carga pesada em processos isolados, garantindo que a interface gráfica nunca congele, mesmo com a CPU em 100%.
- **Algoritmo de Estresse:** Utiliza criptografia (`pbkdf2` do módulo `crypto`) para gerar calor e carga computacional intensa na Unidade Lógica e Aritmética (ULA).

### 3. ℹ️ Detalhes de Hardware (Estilo CPU-Z)
- Módulo de inspeção profunda que lista:
  - **SO:** Plataforma, Distro, Arquitetura.
  - **CPU:** Modelo, Fabricante, Núcleos Físicos/Lógicos.
  - **RAM:** Pentes de memória individuais, tipo e velocidade.
  - **GPU:** Controladores gráficos e VRAM.
  - **Discos:** Tipo (SSD/HDD), interface e tamanho.

---

## 🛠️ Tecnologias Utilizadas

O projeto segue uma arquitetura moderna baseada em Electron + React:

* **Core:** [Electron](https://www.electronjs.org/) (Main Process & IPC)
* **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Linguagem:** JavaScript (ESM + CommonJS)
* **Gráficos:** [Recharts](https://recharts.org/)
* **Hardware Info:** [systeminformation](https://systeminformation.io/)
* **Estilização:** CSS3 (Variáveis CSS e Flexbox/Grid)

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (Versão 16 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/cpu-stress-monitor.git](https://github.com/seu-usuario/cpu-stress-monitor.git)
   cd cpu-stress-monitor
   npm install
   npm run dev


### 🧠 Arquitetura do Sistema
O projeto opera em três camadas distintas para garantir performance e segurança:

Main Process (Backend - Node.js): Responsável por criar a janela e comunicar-se com o SO.

Gerencia o ciclo de vida da aplicação.

Executa a coleta de dados de hardware (systeminformation) e envia para o Frontend via IPC.

Renderer Process (Frontend - React): Exibe a interface do usuário.

Não acessa o Node.js diretamente por segurança. Usa um preload script como ponte (ContextBridge).

Worker Threads (Carga): Ao iniciar o teste, o Main Process cria arquivos stressWorker.cjs separados. Cada Worker roda em seu próprio contexto, permitindo paralelismo real nos núcleos da CPU sem bloquear a thread principal da interface.
