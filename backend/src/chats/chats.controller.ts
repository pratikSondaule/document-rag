import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ChatsService } from "./chats.service.js";
import { AskQuestionDto } from "./dto/askQuestion.dto.js";
import { RenameChatSessionDto } from "./dto/renameChatSession.dto.js";

@ApiTags("Chats")
@Controller("chats")
export class ChatsController {

    constructor(
        private chatsService: ChatsService
    ) { }

    @ApiOperation({ summary: "Ask Question" })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post("ask")
    async askQuestion(
        @Req() request: Request,
        @Body() data: AskQuestionDto
    ) {
        return await this.chatsService.askQuestion(request, data)
    }


    @ApiOperation({ summary: "Get All Chat Sessions" })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get("get-chat-sessions")
    async getChatSessions(
        @Req() request: Request,
    ) {
        return await this.chatsService.getChatSessions(request)
    }


    @ApiOperation({ summary: "Get Chat History By Session ID" })
    @ApiParam({
        name: "sessionId",
        description: "Session ID",
        required: true
    })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get(":sessionId/get-chat-history")
    async getChatHistoryBySessionId(
        @Req() request: Request,
        @Param("sessionId") sessionId: string,
    ) {
        return await this.chatsService.getChatHistoryBySessionId(request, sessionId)
    }


    @ApiOperation({ summary: "Rename Chat Session" })
    @ApiParam({
        name: "sessionId",
        description: "Session ID",
        required: true
    })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Put(":sessionId/rename-chat-session")
    async renameChatSession(
        @Req() request: Request,
        @Param("sessionId") sessionId: string,
        @Body() data: RenameChatSessionDto
    ) {
        return await this.chatsService.renameChatSession(request, sessionId, data)
    }


    @ApiOperation({ summary: "Delete Chat Session" })
    @ApiParam({
        name: "sessionId",
        description: "Session ID",
        required: true
    })
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete(":sessionId/delete-chat-session")
    async deleteChatSession(
        @Req() request: Request,
        @Param("sessionId") sessionId: string,
    ) {
        return await this.chatsService.deleteChatSession(request, sessionId)
    }

}
