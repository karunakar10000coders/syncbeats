import 'package:just_audio/just_audio.dart';
import 'dart:async';
import 'dart:io';

class AudioPlayerService {
  static final AudioPlayerService _instance = AudioPlayerService._internal();
  final AudioPlayer _player = AudioPlayer();

  factory AudioPlayerService() {
    return _instance;
  }

  AudioPlayerService._internal();

  AudioPlayer get player => _player;

  Stream<Duration> get positionStream => _player.positionStream;
  Stream<Duration?> get durationStream => _player.durationStream;
  Stream<PlayerState> get playerStateStream => _player.playerStateStream;

  bool get isPlaying => _player.playing;
  int get positionMs => _player.position.inMilliseconds;
  int get durationMs => _player.duration?.inMilliseconds ?? 0;

  Future<void> loadFile(String filePath) async {
    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw Exception("File does not exist: $filePath");
      }
      await _player.setAudioSource(AudioSource.file(filePath));
    } catch (e) {
      print("Error loading local file in just_audio: $e");
      rethrow;
    }
  }

  Future<void> loadUrl(String url) async {
    try {
      await _player.setAudioSource(AudioSource.uri(Uri.parse(url)));
    } catch (e) {
      print("Error loading URL: $e");
      rethrow;
    }
  }

  Future<void> play() async {
    await _player.play();
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> seek(int positionMs) async {
    await _player.seek(Duration(milliseconds: positionMs));
  }

  Future<void> setSpeed(double speed) async {
    await _player.setSpeed(speed);
  }

  Future<void> setVolume(double volume) async {
    await _player.setVolume(volume);
  }

  Future<void> dispose() async {
    await _player.dispose();
  }
}
export 'package:just_audio/just_audio.dart';
