class SongMatcher {
  static normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  static isFuzzyMatch(str1, str2) {
    const s1 = this.normalize(str1);
    const s2 = this.normalize(str2);
    if (!s1 || !s2) return false;
    if (s1 === s2) return true;

    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return true;

    const distance = this.levenshteinDistance(s1, s2);
    const similarity = 1 - distance / maxLength;
    return similarity >= 0.82;
  }
}

export default SongMatcher;
