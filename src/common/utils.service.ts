import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { MemoryStoredFile } from 'nestjs-form-data';

@Injectable()
export class UtilsService {
  saveFile(file: MemoryStoredFile, folder: string, fileName: string): string {
    const uploadPath = path.join(
      __dirname,
      '..',
      '..',
      'storage',
      'uploads',
      folder,
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filename = `${fileName.replace(/\s+/g, '_')}-${Date.now()}.${file.extension}`;
    const filePath = path.join(uploadPath, filename);

    fs.writeFileSync(filePath, file.buffer);

    const relativeFilePath = path.relative(uploadPath, filePath);

    return `storage/uploads/${folder}/${relativeFilePath}`;
  }
}
