import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "../strategies/jwt.strategy.js";
import { JwtRefreshStrategy } from "../strategies/jwtRefresh.strategy.js";

@Module({
    controllers: [DocumentsController],
    providers: [
        DocumentsService,
        JwtService,
        JwtStrategy,
        JwtRefreshStrategy
    ]
})
export class DocumentsModule { }
