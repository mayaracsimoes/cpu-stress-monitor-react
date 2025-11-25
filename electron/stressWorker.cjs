import { parentPort } from 'worker_threads'
import crypto from 'crypto'

// Parâmetros para o pbkdf2Sync. O número de iterações é alto para garantir
// que o loop seja intensivo em CPU.
const iterations = 100000
const keylen = 64
const digest = 'sha512'

/**
 * Função principal que executa o loop de estresse.
 */
function stressLoop() {
  let isRunning = true

  // O worker pode receber uma mensagem do processo principal (embora o terminate seja mais direto)
  parentPort.on('message', (message) => {
    if (message === 'stop') {
      isRunning = false
    }
  })

  // Loop de estresse infinito
  while (isRunning) {
    // Gera um salt aleatório para cada iteração
    const salt = crypto.randomBytes(16).toString('hex')

    // intensiva em CPU
    crypto.pbkdf2Sync('password', salt, iterations, keylen, digest)
  }
}

stressLoop()
