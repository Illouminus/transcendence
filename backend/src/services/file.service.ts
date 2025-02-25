import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import config from '../config';

export interface FileUploadResult {
    filename: string;
    path: string;
    url: string;
  }

// Function to verify if the directory exists and create it if it doesn't
export function ensureUploadsDirectory(uploadsDir: string = config.files.uploadsDir): void {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

// Function to generate a unique filename for the uploaded file and sanitize it
export function createUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const hash = createHash('md5')
      .update(`${originalFilename}${timestamp}`)
      .digest('hex')
      .substring(0, 8);
    
    const ext = path.extname(originalFilename);
    const sanitizedName = path.basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 20);
    
    return `${sanitizedName}-${hash}${ext}`;
  }