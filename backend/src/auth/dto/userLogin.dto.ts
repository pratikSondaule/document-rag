import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class UserLoginDto {

    @ApiProperty({ example: "demo@mail.com" })
    @IsEmail()
    email: string;

    @ApiProperty({ example: "password" })
    @IsString()
    password: string;

}