import socketService from './socket';

class TimeSyncService {
  constructor() {
    this.offsets = [];
    this.clockOffset = 0;
    this.syncIntervalId = null;
  }

  startSync() {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Run NTP sync immediately
    this.pingServer();

    // Trigger sync every 20 seconds
    this.syncIntervalId = setInterval(() => {
      this.pingServer();
    }, 20000);

    socket.on('time:pong', ({ clientSendTime, serverRecvTime, serverSendTime }) => {
      const clientRecvTime = Date.now();
      
      const rtt = (clientRecvTime - clientSendTime) - (serverSendTime - serverRecvTime);
      const oneWayDelay = rtt / 2;
      const offset = ((serverRecvTime - clientSendTime) + (serverSendTime - clientRecvTime)) / 2;

      this.offsets.push(offset);
      if (this.offsets.length > 5) {
        this.offsets.shift(); // Keep last 5 samples
      }

      // Compute median offset to filter network variance outliers
      const sorted = [...this.offsets].sort((a, b) => a - b);
      this.clockOffset = sorted[Math.floor(sorted.length / 2)];
      
      console.debug(`⏱️ NTP sync: RTT=${rtt}ms, Offset=${this.clockOffset}ms`);
    });
  }

  pingServer() {
    const socket = socketService.getSocket();
    if (socket?.connected) {
      socket.emit('time:ping', { clientSendTime: Date.now() });
    }
  }

  stopSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    const socket = socketService.getSocket();
    if (socket) {
      socket.off('time:pong');
    }
  }

  getServerTime() {
    return Date.now() + this.clockOffset;
  }

  toServerTime(localTime) {
    return localTime + this.clockOffset;
  }

  toLocalTime(serverTime) {
    return serverTime - this.clockOffset;
  }
}

const timeSyncInstance = new TimeSyncService();
export default timeSyncInstance;
