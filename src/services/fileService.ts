import { FileUpload } from '../types';

/**
 * File Upload Service
 * Handles file uploads for all file types
 */
export class FileService {
  private uploads: Map<string, FileUpload> = new Map();

  /**
   * Select files using native file dialog
   */
  async selectFiles(): Promise<string[]> {
    if ((window as any).electronAPI) {
      return await (window as any).electronAPI.file.select();
    }
    return [];
  }

  /**
   * Upload a file to a session
   */
  async uploadFile(
    connectionId: string,
    sessionId: string,
    filePath: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUpload> {
    const uploadId = this.generateUploadId();

    // Get file info
    const fileInfo = await this.getFileInfo(filePath);

    const upload: FileUpload = {
      id: uploadId,
      name: fileInfo.name,
      path: filePath,
      size: fileInfo.size,
      type: fileInfo.type,
      status: 'pending',
      progress: 0,
    };

    this.uploads.set(uploadId, upload);

    try {
      upload.status = 'uploading';
      this.uploads.set(uploadId, { ...upload });

      // Upload to OpenClaw
      await this.uploadToOpenClaw(
        connectionId,
        sessionId,
        filePath,
        (progress) => {
          upload.progress = progress;
          this.uploads.set(uploadId, { ...upload });
          onProgress?.(progress);
        }
      );

      upload.status = 'completed';
      upload.progress = 100;
      this.uploads.set(uploadId, { ...upload });

      return upload;
    } catch (error) {
      upload.status = 'failed';
      upload.error = error instanceof Error ? error.message : 'Upload failed';
      this.uploads.set(uploadId, { ...upload });
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    connectionId: string,
    sessionId: string,
    filePaths: string[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<FileUpload[]> {
    const uploads: FileUpload[] = [];

    for (let i = 0; i < filePaths.length; i++) {
      const upload = await this.uploadFile(
        connectionId,
        sessionId,
        filePaths[i],
        (progress) => onProgress?.(i, progress)
      );
      uploads.push(upload);
    }

    return uploads;
  }

  /**
   * Get upload status
   */
  getUpload(uploadId: string): FileUpload | undefined {
    return this.uploads.get(uploadId);
  }

  /**
   * Cancel upload
   */
  cancelUpload(uploadId: string): boolean {
    const upload = this.uploads.get(uploadId);
    if (upload && upload.status === 'uploading') {
      upload.status = 'failed';
      upload.error = 'Cancelled';
      this.uploads.set(uploadId, { ...upload });
      return true;
    }
    return false;
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get file information
   */
  private async getFileInfo(filePath: string): Promise<{
    name: string;
    size: number;
    type: string;
  }> {
    if ((window as any).electronAPI) {
      // Use Electron to get file info
      return {
        name: filePath.split(/[/\\]/).pop() || '',
        size: 0,
        type: this.getMimeType(filePath),
      };
    }

    // Fallback for web environment
    return {
      name: filePath.split(/[/\\]/).pop() || '',
      size: 0,
      type: this.getMimeType(filePath),
    };
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',

      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      rtf: 'application/rtf',
      odt: 'application/vnd.oasis.opendocument.text',
      ods: 'application/vnd.oasis.opendocument.spreadsheet',
      odp: 'application/vnd.oasis.opendocument.presentation',

      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      wma: 'audio/x-ms-wma',

      // Video
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      webm: 'video/webm',
      m4v: 'video/mp4',
      mpeg: 'video/mpeg',
      ts: 'video/mp2t',

      // Archives
      zip: 'application/zip',
      rar: 'application/vnd.rar',
      '7z': 'application/x-7z-compressed',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      bz2: 'application/x-bzip2',

      // Code
      js: 'text/javascript',
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      css: 'text/css',
      py: 'text/x-python',
      java: 'text/x-java-source',
      cpp: 'text/x-c++src',
      c: 'text/x-csrc',
      typescript: 'text/typescript',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Upload file to OpenClaw
   */
  private async uploadToOpenClaw(
    _connectionId: string,
    _sessionId: string,
    _filePath: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    // TODO: Implement actual upload logic using OpenClaw service
    // This will integrate with the OpenClaw API once available

    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress(i);
      }
    }

    return {
      fileId: Date.now().toString(),
      url: '',
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if file type is supported
   */
  isFileTypeSupported(_fileName: string): boolean {
    // All file types are supported as per requirements
    return true;
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const iconMap: Record<string, string> = {
      // Images
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      bmp: '🖼️',
      svg: '🖼️',

      // Documents
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📽️',
      pptx: '📽️',
      txt: '📃',

      // Audio
      mp3: '🎵',
      wav: '🎵',
      flac: '🎵',
      aac: '🎵',

      // Video
      mp4: '🎬',
      avi: '🎬',
      mkv: '🎬',
      mov: '🎬',

      // Archives
      zip: '📦',
      rar: '📦',
      '7z': '📦',
      tar: '📦',

      // Code
      js: '📜',
      json: '📜',
      html: '🌐',
      css: '🎨',
      py: '🐍',
      java: '☕',
    };

    return iconMap[ext] || '📄';
  }
}

// Singleton instance
export const fileService = new FileService();
