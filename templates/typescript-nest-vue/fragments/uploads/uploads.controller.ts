import { Controller, Post, UploadedFile, UseInterceptors, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  receive(@UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), new FileTypeValidator({ fileType: /^(image\/(png|jpeg)|application\/pdf)$/ })] })) file: { originalname: string; mimetype: string; size: number }) {
    return { originalName: file.originalname.slice(0, 180), mimeType: file.mimetype, size: file.size, stored: false };
  }
}
