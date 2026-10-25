import { Module } from "@nestjs/common";
import { ChatsController } from "./chats.controller.js";
import { ChatsService } from "./chats.service.js";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "../strategies/jwt.strategy.js";
import { JwtRefreshStrategy } from "../strategies/jwtRefresh.strategy.js";

@Module({
    controllers: [ChatsController],
    providers: [
        ChatsService,
        JwtService,
        JwtStrategy,
        JwtRefreshStrategy
    ]
})
export class ChatsModule { }