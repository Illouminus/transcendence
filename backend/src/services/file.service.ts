import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import config from '../config';
import { 
  createFileError, 
  createValidationError, 
  logError 
} from '../utils/errorHandler';

export interface FileUploadResult {
    filename: string;
    path: string;
    url: string;
  }

// Function to verify if the directory exists and create it if it doesn't
export function ensureUploadsDirectory(uploadsDir: string = config.files.uploadsDir): void {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (error) {
    logError(error, 'FileService.ensureUploadsDirectory');
    throw createFileError(
      `Failed to create uploads directory: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { path: uploadsDir }
    );
  }
}

// Function to generate a unique filename for the uploaded file and sanitize it
export function createUniqueFilename(originalFilename: string): string {
  try {
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
  } catch (error) {
    logError(error, 'FileService.createUniqueFilename');
    throw createFileError(
      'Failed to create unique filename', 
      { originalFilename }
    );
  }
}


// Function to upload a file to the uploads directory
export async function saveFile(
  fileObject: any, 
  uploadsDir: string = config.files.uploadsDir
): Promise<FileUploadResult> {
  if (!fileObject || !fileObject.file) {
    throw createValidationError('Invalid file object', { fileObject });
  }
  ensureUploadsDirectory(uploadsDir);
  
  const filename = createUniqueFilename(fileObject.filename);
  const filePath = path.join(uploadsDir, filename);
  
  return new Promise<FileUploadResult>((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    
    writeStream.on('error', (err) => {
      logError(err, 'FileService.saveFile.writeStream');
      reject(createFileError('Error writing file to disk', { path: filePath, originalError: err.message }));
    });
    
    writeStream.on('finish', () => {
      resolve({
        filename,
        path: filePath,
        url: `/images/${filename}`
      });
    });
    
    fileObject.file.on('error', (err: Error) => {
      logError(err, 'FileService.saveFile.readStream');
      writeStream.end();
      reject(createFileError('Error reading uploaded file', { originalError: err.message }));
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
        logError(error, 'FileService.deleteFile');
        throw createFileError(
          `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { path: filePath, url: fileUrl }
        );
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
      throw createValidationError('Invalid file object', { received: typeof fileObject });
    }
  
    // Check file type
    if (!allowedTypes.includes(fileObject.mimetype)) {
      throw createValidationError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        { receivedType: fileObject.mimetype, allowedTypes }
      );
    }
    
    // Check file size
    if (fileObject.file.bytesRead > maxSize) {
      throw createValidationError(
        `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        { receivedSize: fileObject.file.bytesRead, maxSize }
      );
    }
    
    return true;
  }