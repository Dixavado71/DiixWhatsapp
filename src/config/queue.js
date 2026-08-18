/**
 * Configuração do Queue System com BullMQ e Redis
 * Gerencia filas para processos em background
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import config from './index.js';

// Conexão Redis dedicada para filas
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Necessário para BullMQ
});

/**
 * Filas disponíveis
 */
export const queues = {
  // Fila de recuperação de carrinhos abandonados
  abandonedCart: new Queue('abandoned-cart', { connection }),
  
  // Fila de envio de mensagens em massa
  messageBroadcast: new Queue('message-broadcast', { connection }),
  
  // Fila de sincronização de estoque
  stockSync: new Queue('stock-sync', { connection }),
  
  // Fila de geração de relatórios
  reportGeneration: new Queue('report-generation', { connection }),
  
  // Fila de notificações
  notification: new Queue('notification', { connection }),
  
  // Fila de webhooks externos
  webhookDelivery: new Queue('webhook-delivery', { connection }),
};

/**
 * Workers para processar jobs
 */
export const workers = {};

/**
 * Registrar um worker para uma fila específica
 * @param {string} queueName - Nome da fila
 * @param {Function} processor - Função que processa o job
 */
export function registerWorker(queueName, processor) {
  if (!queues[queueName]) {
    throw new Error(`Fila "${queueName}" não existe`);
  }
  
  const worker = new Worker(queueName, processor, {
    connection,
    concurrency: queueName === 'messageBroadcast' ? 5 : 3, // Mais concorrência para broadcast
  });
  
  // Event listeners
  worker.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} (${queueName}) completado`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} (${queueName}) falhou:`, err.message);
  });
  
  worker.on('error', (err) => {
    console.error(`[Queue] Worker ${queueName} error:`, err.message);
  });
  
  workers[queueName] = worker;
  return worker;
}

/**
 * Adicionar job a uma fila
 * @param {string} queueName - Nome da fila
 * @param {any} data - Dados do job
 * @param {object} options - Opções do job (delay, attempts, etc)
 */
export async function addJob(queueName, data, options = {}) {
  if (!queues[queueName]) {
    throw new Error(`Fila "${queueName}" não existe`);
  }
  
  const defaultOptions = {
    attempts: 3, // Tentar 3 vezes antes de falhar
    backoff: {
      type: 'exponential',
      delay: 1000, // Começa com 1s, depois 2s, 4s...
    },
    removeOnComplete: {
      age: 3600, // Manter jobs completados por 1 hora
      count: 1000, // Ou máximo 1000 jobs
    },
    removeOnFail: {
      age: 86400, // Manter jobs falhados por 24 horas
    },
    ...options,
  };
  
  const job = await queues[queueName].add(queueName, data, defaultOptions);
  console.log(`[Queue] Job ${job.id} adicionado à fila ${queueName}`);
  return job;
}

/**
 * Agendar job para execução futura
 * @param {string} queueName - Nome da fila
 * @param {Date} scheduledAt - Data/hora para execução
 * @param {any} data - Dados do job
 */
export async function scheduleJob(queueName, scheduledAt, data) {
  const delay = scheduledAt.getTime() - Date.now();
  
  if (delay <= 0) {
    throw new Error('Data agendada deve ser no futuro');
  }
  
  return addJob(queueName, data, { delay });
}

/**
 * Obter status de uma fila
 * @param {string} queueName - Nome da fila
 */
export async function getQueueStatus(queueName) {
  if (!queues[queueName]) {
    throw new Error(`Fila "${queueName}" não existe`);
  }
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queues[queueName].getWaitingCount(),
    queues[queueName].getActiveCount(),
    queues[queueName].getCompletedCount(),
    queues[queueName].getFailedCount(),
    queues[queueName].getDelayedCount(),
  ]);
  
  return {
    name: queueName,
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

/**
 * Obter status de todas as filas
 */
export async function getAllQueuesStatus() {
  const statusPromises = Object.keys(queues).map(name => getQueueStatus(name));
  const statuses = await Promise.all(statusPromises);
  
  return statuses.reduce((acc, status) => {
    acc[status.name] = status;
    return acc;
  }, {});
}

/**
 * Limpar fila (apenas jobs completados/falhados antigos)
 * @param {string} queueName - Nome da fila
 */
export async function cleanQueue(queueName, maxAge = 3600000) {
  if (!queues[queueName]) {
    throw new Error(`Fila "${queueName}" não existe`);
  }
  
  await queues[queueName].clean(maxAge, 1000, 'completed');
  await queues[queueName].clean(maxAge, 1000, 'failed');
  
  console.log(`[Queue] Fila ${queueName} limpa`);
}

/**
 * Fechar todas as conexões (para shutdown graceful)
 */
export async function closeAllQueues() {
  console.log('[Queue] Fechando todas as filas e workers...');
  
  // Fechar workers
  for (const worker of Object.values(workers)) {
    await worker.close();
  }
  
  // Fechar filas
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
  
  // Fechar conexão Redis
  await connection.quit();
  
  console.log('[Queue] Todas as filas fechadas');
}

// Exportação padrão
export default {
  queues,
  workers,
  registerWorker,
  addJob,
  scheduleJob,
  getQueueStatus,
  getAllQueuesStatus,
  cleanQueue,
  closeAllQueues,
};
