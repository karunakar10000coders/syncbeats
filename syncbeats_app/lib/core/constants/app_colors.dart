import 'package:flutter/material.dart';

class AppColors {
  static const Color background = Color(0xFF05070F);
  static const Color cardBg = Color(0xFF0F172A);
  static const Color cardBgHover = Color(0xFF1E293B);

  static const Color accentPrimary = Color(0xFF8B5CF6); // Violet
  static const Color accentSecondary = Color(0xFF3B82F6); // Blue
  static const Color accentTertiary = Color(0xFF06B6D4); // Cyan

  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF475569);

  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFEAB308);
  static const Color danger = Color(0xFFEF4444);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [accentPrimary, accentSecondary, accentTertiary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
