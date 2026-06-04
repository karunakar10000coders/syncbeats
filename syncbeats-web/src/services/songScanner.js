import * as mm from 'music-metadata-browser';

class SongScannerService {
  /**
   * Generates a unique file hash from size and first 1MB of file content.
   */
  static async generateFileHash(file) {
    const chunkSize = 1024 * 1024; // 1MB
    const slice = file.slice(0, chunkSize);
    const arrayBuffer = await slice.arrayBuffer();
    
    // Hash using Web Crypto SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Mix in file size to make collisions virtually impossible
    return `${hashHex}_${file.size}`;
  }

  /**
   * Extract artwork image from metadata if available
   */
  static getArtworkUrl(commonMetadata) {
    const pictures = commonMetadata.picture;
    if (pictures && pictures.length > 0) {
      const pic = pictures[0];
      const blob = new Blob([pic.data], { type: pic.format });
      return URL.createObjectURL(blob);
    }
    return null;
  }

  /**
   * Scans a single audio file and returns clean song model structures.
   */
  static async scanFile(file) {
    try {
      const metadata = await mm.parseBlob(file);
      const hash = await this.generateFileHash(file);
      const extension = file.name.split('.').pop().toLowerCase();
      
      const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, "");
      const artist = metadata.common.artist || 'Unknown Artist';
      const album = metadata.common.album || 'Unknown Album';
      const durationMs = Math.round((metadata.format.duration || 0) * 1000);
      
      const artworkUrl = this.getArtworkUrl(metadata.common);

      return {
        title,
        artist,
        album,
        duration_ms: durationMs,
        file_path: file.name, // Local relative reference
        file_hash: hash,
        format: ['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(extension) ? extension : 'mp3',
        file_size: file.size,
        artwork_url: artworkUrl,
        metadata: {
          bitrate: metadata.format.bitrate,
          sampleRate: metadata.format.sampleRate,
          numberOfChannels: metadata.format.numberOfChannels
        },
        fileRef: file // Keep file reference in-memory to play it later!
      };
    } catch (err) {
      console.error(`Error scanning audio file ${file.name}:`, err);
      // Fallback metadata extraction on error
      const hash = await this.generateFileHash(file);
      const extension = file.name.split('.').pop().toLowerCase();
      return {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration_ms: 0, // Fallback placeholder
        file_path: file.name,
        file_hash: hash,
        format: ['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(extension) ? extension : 'mp3',
        file_size: file.size,
        artwork_url: null,
        metadata: {},
        fileRef: file
      };
    }
  }

  /**
   * Scans an array of file handles.
   */
  static async scanBatch(files) {
    const songs = [];
    for (const file of files) {
      if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac)$/i.test(file.name)) {
        const song = await this.scanFile(file);
        songs.push(song);
      }
    }
    return songs;
  }
}

export default SongScannerService;
