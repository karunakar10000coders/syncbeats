import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/network/socket_client.dart';
import 'audio_player_service.dart';
import 'dart:developer' as dev;

class SyncService {
  static final SyncService _instance = SyncService._internal();

  final List<int> _offsets = [];
  int _clockOffset = 0;
  Timer? _syncTimer;
  Timer? _scheduleTimer;

  factory SyncService() {
    return _instance;
  }

  SyncService._internal();

  int get clockOffset => _clockOffset;

  void startSync() {
    final socketClient = SocketClient();
    
    // Trigger immediate ping
    _pingServer();

    // Re-verify offset every 20 seconds
    _syncTimer = Timer.periodic(const Duration(seconds: 20), (timer) {
      _pingServer();
    });

    socketClient.on('time:pong', (data) {
      final int clientSendTime = data['clientSendTime'];
      final int serverRecvTime = data['serverRecvTime'];
      final int serverSendTime = data['serverSendTime'];
      final int clientRecvTime = DateTime.now().millisecondsSinceEpoch;

      final int rtt = (clientRecvTime - clientSendTime) - (serverSendTime - serverRecvTime);
      final int offset = (((serverRecvTime - clientSendTime) + (serverSendTime - clientRecvTime)) ~/ 2);

      _offsets.add(offset);
      if (_offsets.length > 5) {
        _offsets.removeAt(0); // Keep last 5
      }

      // Compute median
      final sorted = List<int>.from(_offsets)..sort();
      _clockOffset = sorted[sorted.length ~/ 2];

      dev.log('⏱️ NTP Sync [Mobile]: RTT=${rtt}ms, Offset=${_clockOffset}ms');
    });

    // Listen to playback commands
    socketClient.on('playback:command', (data) {
      _handlePlaybackCommand(data);
    });

    // Listen to periodic sync pulses
    socketClient.on('playback:sync', (data) {
      _handleSyncPulse(data);
    });
  }

  void _pingServer() {
    SocketClient().emit('time:ping', {
      'clientSendTime': DateTime.now().millisecondsSinceEpoch
    });
  }

  int getServerTime() {
    return DateTime.now().millisecondsSinceEpoch + _clockOffset;
  }

  void stopSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
    _scheduleTimer?.cancel();
    _scheduleTimer = null;
    SocketClient().off('time:pong');
    SocketClient().off('playback:command');
    SocketClient().off('playback:sync');
  }

  void _handlePlaybackCommand(dynamic data) async {
    final String action = data['action'];
    final String songId = data['songId'] ?? '';
    final int positionMs = data['positionMs'] ?? 0;
    final double speed = (data['speed'] ?? 1.0).toDouble();
    final int executeAt = data['executeAt'];

    _scheduleTimer?.cancel();

    final int serverTimeNow = getServerTime();
    final int delay = executeAt - serverTimeNow;

    final performAction = () async {
      final playerService = AudioPlayerService();
      await playerService.setSpeed(speed);
      
      if (action == 'play') {
        await playerService.seek(positionMs);
        await playerService.play();
      } else if (action == 'pause') {
        await playerService.seek(positionMs);
        await playerService.pause();
      } else if (action == 'seek') {
        await playerService.seek(positionMs);
      } else if (action == 'stop') {
        await playerService.seek(0);
        await playerService.pause();
      }
    };

    if (delay > 0) {
      _scheduleTimer = Timer(Duration(milliseconds: delay), performAction);
    } else {
      // Late command: adjust position for elapsed time
      final int elapsed = delay.abs();
      final int adjustedPos = action == 'play' ? positionMs + elapsed : positionMs;
      final playerService = AudioPlayerService();
      await playerService.seek(adjustedPos);
      if (action == 'play') {
        await playerService.play();
      } else {
        await playerService.pause();
      }
    }
  }

  void _handleSyncPulse(dynamic data) async {
    final String songId = data['songId'] ?? '';
    final int expectedMs = data['positionMs'] ?? 0;
    final bool expectedPlay = data['isPlaying'] ?? false;
    final int serverTime = data['serverTime'];
    final double speed = (data['speed'] ?? 1.0).toDouble();

    final int serverTimeNow = getServerTime();
    final int messageAge = serverTimeNow - serverTime;
    final int trueExpectedMs = expectedMs + messageAge;

    final playerService = AudioPlayerService();
    final int currentPos = playerService.positionMs;
    final int drift = (currentPos - trueExpectedMs).abs();

    if (expectedPlay && !playerService.isPlaying) {
      dev.log('Mobile sync drift: state out of sync (should play). Correcting.');
      await playerService.seek(trueExpectedMs);
      await playerService.play();
    } else if (!expectedPlay && playerService.isPlaying) {
      dev.log('Mobile sync drift: state out of sync (should pause). Correcting.');
      await playerService.pause();
      await playerService.seek(trueExpectedMs);
    } else if (drift > 200) {
      dev.log('Mobile sync drift: position out of sync (offset = ${drift}ms). Seeking.');
      await playerService.seek(trueExpectedMs);
    }
  }
}
