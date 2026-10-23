import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "../strategies/jwt.strategy.js";
import { JwtRefreshStrategy } from "../strategies/jwtRefresh.strategy.js";

@Module({
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtService,
        JwtStrategy,
        JwtRefreshStrategy,
    ]
})
export class AuthModule { }