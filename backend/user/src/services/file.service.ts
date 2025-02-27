import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { pipeline } from "stream/promises";
import config from "../config";
import { createFileError, createValidationError, logError } from "../utils/errorHandler";

export interface FileUploadResult {
  filename: string;
  path: string;
  url: string;
}

/**
 * Гарантирует существование директории для загрузки файлов
 */
export function ensureUploadsDirectory(uploadsDir: string = "../../public/images"): void {
  const resolvedPath = path.resolve(__dirname, uploadsDir);
  console.log(`[DEBUG] Ensuring directory exists: ${resolvedPath}`);
  try {
    if (!fs.existsSync(resolvedPath)) {
      console.log(`[DEBUG] Creating directory: ${resolvedPath}`);
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
  } catch (error) {
    console.error(`[DEBUG] Failed to create directory: ${resolvedPath}`, error);
    logError(error, "FileService.ensureUploadsDirectory");
    throw createFileError(
      `Failed to create uploads directory: ${error instanceof Error ? error.message : "Unknown error"}`,
      { path: resolvedPath }
    );
  }
}

/**
 * Создает уникальное имя файла на основе оригинального имени и временной метки
 */
export function createUniqueFilename(originalFilename: string): string {
  console.log(`[DEBUG] Creating unique filename for: ${originalFilename}`);
  try {
    const timestamp = Date.now();
    const hash = createHash("md5")
      .update(`${originalFilename}${timestamp}`)
      .digest("hex")
      .substring(0, 8);
    const ext = path.extname(originalFilename);
    const sanitizedName = path.basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9]/g, "-")
      .substring(0, 20);
    const result = `${sanitizedName}-${hash}${ext}`;
    console.log(`[DEBUG] Created unique filename: ${result}`);
    return result;
  } catch (error) {
    console.error(`[DEBUG] Error creating unique filename`, error);
    logError(error, "FileService.createUniqueFilename");
    throw createFileError("Failed to create unique filename", { originalFilename });
  }
}

/**
 * Сохраняет файл из multipart-запроса
 */
export async function saveFile(
  fileObject: any,
  uploadsDir: string = "../../public/images"
): Promise<FileUploadResult> {
  if (!fileObject || !fileObject.file) {
    throw createValidationError("Invalid file object", { fileObject });
  }
  ensureUploadsDirectory(uploadsDir);
  const filename = createUniqueFilename(fileObject.filename);
  const resolvedPath = path.resolve(__dirname, uploadsDir);
  const filePath = path.join(resolvedPath, filename);

  console.log(`[DEBUG] Saving file to: ${filePath}`);
  try {
    await pipeline(
      fileObject.file, // ReadableStream
      fs.createWriteStream(filePath) // WritableStream
    );
  } catch (error) {
    logError(error, "FileService.saveFile.pipeline");
    throw createFileError("Error writing file to disk", {
      path: filePath,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }

  const fileUrl = `/images/${filename}`;
  return { filename, path: filePath, url: fileUrl };
}

/**
 * Удаляет файл по его URL-пути
 */
export async function deleteFile(
  fileUrl: string,
  uploadsDir: string = "../../public/images"
): Promise<boolean> {
  console.log(`[DEBUG] Deleting file: ${fileUrl}`);
  if (!fileUrl || !fileUrl.startsWith("/images/")) {
    console.log(`[DEBUG] Invalid file URL: ${fileUrl}`);
    return false;
  }
  const filename = path.basename(fileUrl);
  const resolvedPath = path.resolve(__dirname, uploadsDir);
  const filePath = path.join(resolvedPath, filename);
  console.log(`[DEBUG] Resolved file path: ${filePath}`);
  if (fs.existsSync(filePath)) {
    try {
      console.log(`[DEBUG] Deleting file: ${filePath}`);
      fs.unlinkSync(filePath);
      console.log(`[DEBUG] File deleted successfully`);
      return true;
    } catch (error) {
      console.error(`[DEBUG] Error deleting file:`, error);
      logError(error, "FileService.deleteFile");
      throw createFileError(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
        { path: filePath, url: fileUrl }
      );
    }
  } else {
    console.log(`[DEBUG] File does not exist: ${filePath}`);
  }
  return false;
}

/**
 * Проверяет тип и размер файла
 */
export function validateFile(
  fileObject: any,
  options: { maxSize?: number; allowedTypes?: string[] } = {}
): boolean {
  console.log(`[DEBUG] Validating file`);
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB по умолчанию
  const allowedTypes = options.allowedTypes || ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!fileObject || !fileObject.mimetype) {
    console.error(`[DEBUG] Invalid file object:`, fileObject);
    throw createValidationError("Invalid file object", { received: typeof fileObject });
  }
  console.log(`[DEBUG] File mimetype: ${fileObject.mimetype}`);
  if (!allowedTypes.includes(fileObject.mimetype)) {
    console.error(`[DEBUG] Invalid file type: ${fileObject.mimetype}`);
    throw createValidationError(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`, {
      receivedType: fileObject.mimetype,
      allowedTypes,
    });
  }
  console.log(`[DEBUG] File validation successful`);
  return true;
}


export async function saveFileBuffer(
  buffer: Buffer,
  originalFilename: string = "avatar.jpg",
  uploadsDir: string = "../../public/images"
): Promise<FileUploadResult> {
  ensureUploadsDirectory(uploadsDir);
  const filename = createUniqueFilename(originalFilename);
  const resolvedPath = path.resolve(__dirname, uploadsDir);
  const filePath = path.join(resolvedPath, filename);
  try {
    await fs.promises.writeFile(filePath, buffer);
  } catch (error) {
    logError(error, "FileService.saveFileBuffer");
    throw createFileError("Error writing file to disk", {
      path: filePath,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
  const fileUrl = `/images/${filename}`;
  return { filename, path: filePath, url: fileUrl };
}