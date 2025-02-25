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


// Function to upload a file to the uploads directory
export async function saveFile(
    fileObject: any, 
    uploadsDir: string = config.files.uploadsDir
  ): Promise<FileUploadResult> {
    if (!fileObject || !fileObject.file) {
      throw new Error('Invalid file object');
    }
  
    // Check if the uploads directory exists and create it if it doesn't
    ensureUploadsDirectory(uploadsDir);
    
    const filename = createUniqueFilename(fileObject.filename);
    const filePath = path.join(uploadsDir, filename);
    
    return new Promise<FileUploadResult>((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      
      writeStream.on('error', (err) => {
        console.error('Error writing file:', err);
        reject(err);
      });
      
      writeStream.on('finish', () => {
        resolve({
          filename,
          path: filePath,
          url: `/images/${filename}`
        });
      });
      
      fileObject.file.on('error', (err: Error) => {
        console.error('Error reading uploaded file:', err);
        writeStream.end();
        reject(err);
      });
      
      fileObject.file.pipe(writeStream);
    });
  }


  // Function to delete a file from the uploads directory
  export async function deleteFile(
    fileUrl: string, 
    uploadsDir: string = config.files.uploadsDir
  ): Promise<boolean> {
    if (!fileUrl || !fileUrl.startsWith('/images/')) {
      return false;
    }
  
    const filename = path.basename(fileUrl);
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch (error) {
        console.error('Error deleting file:', error);
        return false;
      }
    }
    
    return false;
  }


  // Function to verify extension of the file and size

  export function validateFile(
    fileObject: any, 
    options: { 
      maxSize?: number; 
      allowedTypes?: string[] 
    } = {}
  ): boolean {
    const { 
      maxSize = config.files.maxFileSize,
      allowedTypes = config.files.allowedMimetypes
    } = options;
    
    if (!fileObject || !fileObject.mimetype) {
      return false;
    }
  
    // Check if the file type is allowed
    if (!allowedTypes.includes(fileObject.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check if the file size is within the limit
    if (fileObject.file.bytesRead > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }
    
    return true;
  }