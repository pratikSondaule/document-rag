import { Controller, Delete, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { DocumentsService } from "./documents.service.js";
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from "@nestjs/passport";

@ApiTags("Documents")
@Controller("documents")
export class DocumentsController {

    constructor(
        private documentsService: DocumentsService
    ) { }

    @ApiOperation({ summary: "Upload PDF" })
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary'
                }
            },
            required: ['file']
        }
    })
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor("file"))
    @Post("upload")
    async addDocument(
        @Req() request: Request,
        @UploadedFile() file: Express.Multer.File
    ) {
        return await this.documentsService.addDocument(request, file)
    }


    @ApiOperation({ summary: "Retry PDF background embedding" })
    @ApiBearerAuth()
    @ApiParam({
        name: "documentId",
        description: "Document ID"
    })
    @UseGuards(AuthGuard('jwt'))
    @Post("retry-embbeding/:documentId")
    async retryEmbedding(
        @Req() request: Request,
        @Param("documentId") documentId: string
    ) {
        return await this.documentsService.retryEmbedding(request, documentId)
    }


    @ApiOperation({ summary: "Get all documents" })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getUserDocuments(
        @Req() request: Request,
    ) {
        return await this.documentsService.getUserDocuments(request)
    }


    @ApiOperation({ summary: "Delete document" })
    @ApiBearerAuth()
    @ApiParam({
        name: "documentId",
        description: "Document ID"
    })
    @UseGuards(AuthGuard('jwt'))
    @Delete(":documentId")
    async deleteDocument(
        @Req() request: Request,
        @Param("documentId") documentId: string
    ) {
        return await this.documentsService.deleteDocument(request, documentId)
    }

}
