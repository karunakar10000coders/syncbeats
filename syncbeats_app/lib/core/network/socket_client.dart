import 'package:socket_io_client/socket_io_client.dart' as io;
import 'dart:developer' as dev;

class SocketClient {
  static final SocketClient _instance = SocketClient._internal();
  io.Socket? _socket;

  factory SocketClient() {
    return _instance;
  }

  SocketClient._internal();

  io.Socket? get socket => _socket;
  bool get isConnected => _socket?.connected ?? false;

  void connect(String token, String baseUrl) {
    if (_socket != null && _socket!.connected) return;

    dev.log('Connecting socket client to: $baseUrl');
    _socket = io.io(baseUrl, io.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .setAuth({'token': token})
      .enableReconnection()
      .setReconnectionAttempts(10)
      .setReconnectionDelay(1000)
      .build()
    );

    _socket!.onConnect((_) {
      dev.log('⚡ Socket connected: ${_socket!.id}');
    });

    _socket!.onDisconnect((_) {
      dev.log('🔌 Socket disconnected');
    });

    _socket!.onConnectError((err) {
      dev.log('❌ Socket connection error: $err');
    });

    _socket!.connect();
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
      dev.log('🔌 Socket disconnected manually');
    }
  }

  void emit(String event, dynamic data) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit(event, data);
    } else {
      dev.log('⚠️ Cannot emit event "$event". Socket is not connected.');
    }
  }

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void off(String event) {
    _socket?.off(event);
  }
}
export 'package:socket_io_client/socket_io_client.dart';
