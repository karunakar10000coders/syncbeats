import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_colors.dart';
import 'services/sync_service.dart';
import 'services/audio_player_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        Provider<AudioPlayerService>(
          create: (_) => AudioPlayerService(),
          dispose: (_, service) => service.dispose(),
        ),
        Provider<SyncService>(
          create: (_) => SyncService(),
          dispose: (_, service) => service.stopSync(),
        ),
      ],
      child: const SyncBeatsApp(),
    ),
  );
}

class SyncBeatsApp extends StatelessWidget {
  const SyncBeatsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SyncBeats',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.accentPrimary,
          secondary: AppColors.accentSecondary,
          surface: AppColors.cardBg,
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: AppColors.textPrimary),
          bodyMedium: TextStyle(color: AppColors.textSecondary),
        ),
        useMaterial3: true,
      ),
      home: const WelcomeScreen(),
    );
  }
}

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                ),
                child: const Icon(Icons.music_note, size: 50, color: Colors.white),
              ),
              const SizedBox(height: 24),
              const Text(
                'SyncBeats',
                style: TextStyle(fontSize: 32, fontWeight: '800', letterSpacing: -1),
              ),
              const SizedBox(height: 8),
              const Text(
                'Listen together, in perfect harmony',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: () {
                  // Connect socket and trigger sync
                  context.read<SyncService>().startSync();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Connected to sync server!')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentPrimary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(200, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Start Sync Engine'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
