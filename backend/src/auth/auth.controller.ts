import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RegisterUserDto } from "./dto/registerUser.dto.js";
import { UserLoginDto } from "./dto/userLogin.dto.js";
import { GenerateAccessTokenDto } from "./dto/generateAccessToken.dto.js";
import { AuthGuard } from "@nestjs/passport";

@Controller("auth")
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) { }

    @ApiOperation({ summary: "User Registration" })
    @Post('register')
    async register(@Body() data: RegisterUserDto) {
        return this.authService.createUser(data);
    }


    @ApiOperation({ summary: "User Login" })
    @Post('login')
    async login(@Body() data: UserLoginDto) {
        return this.authService.login(data);
    }

    @ApiOperation({ summary: "Generate new access token from refresh token" })
    @Post('refresh')
    async refreshToken(
        @Body() data: GenerateAccessTokenDto
    ) {
        return this.authService.generateAccessTokenFromRefreshToken(data);
    }


    @ApiOperation({ summary: "Get Current Loged In User" })
    @ApiBearerAuth()
    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async getLogedInUser(@Req() req: any) {
        return this.authService.getLogedInUser(req);
    }
}
