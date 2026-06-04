module.exports = (io, socket) => {
  socket.on('time:ping', ({ clientSendTime }) => {
    const serverRecvTime = Date.now();
    const serverSendTime = Date.now();
    
    socket.emit('time:pong', {
      clientSendTime,
      serverRecvTime,
      serverSendTime
    });
  });
};
