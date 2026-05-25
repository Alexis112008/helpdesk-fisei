import * as signalR from '@microsoft/signalr';

/**
 * HU5 — T5.7: Cliente SignalR.
 * HU6 — T6.5: Permite a la UI escuchar eventos y mostrar toasts.
 *
 * Uso:
 *   const conn = await getConnection();
 *   conn.on('ticket-updated', payload => ...);
 *   await joinUserGroup(userId);
 *   await joinTechnicianGroup(userId);
 */

const HUB_URL = 'http://localhost:5122/hubs/tickets';

let connection = null;
let connectionPromise = null;

function buildConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('token') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

export async function getConnection() {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  if (connectionPromise) return connectionPromise;

  connection = buildConnection();
  connectionPromise = connection
    .start()
    .then(() => {
      console.log('[SignalR] Conectado al hub de tickets');
      return connection;
    })
    .catch((err) => {
      console.error('[SignalR] Error al conectar:', err);
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

export async function joinUserGroup(userId) {
  const conn = await getConnection();
  await conn.invoke('JoinGroup', `user:${userId}`);
}

export async function joinTechnicianGroup(userId) {
  const conn = await getConnection();
  await conn.invoke('JoinGroup', `tech:${userId}`);
}

export async function joinLevelGroup(level) {
  const conn = await getConnection();
  await conn.invoke('JoinGroup', `level:${level}`);
}

export async function joinAdminsGroup() {
  const conn = await getConnection();
  await conn.invoke('JoinGroup', 'admins');
}

export async function leaveGroup(groupName) {
  const conn = await getConnection();
  await conn.invoke('LeaveGroup', groupName);
}

export async function disconnect() {
  if (connection) {
    try {
      await connection.stop();
    } catch (e) {}
    connection = null;
    connectionPromise = null;
  }
}

/** Mapea rol a número de nivel (mismo mapeo que el backend). */
export function roleToLevel(role) {
  switch (role) {
    case 'TecnicoN1': return 1;
    case 'TecnicoN2': return 2;
    case 'DITIC': return 3;
    case 'Proveedor': return 4;
    default: return null;
  }
}

export function isTechnician(role) {
  return ['TecnicoN1', 'TecnicoN2', 'DITIC', 'Proveedor'].includes(role);
}
