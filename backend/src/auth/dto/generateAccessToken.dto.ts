import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GenerateAccessTokenDto {

    @ApiProperty({ example: "refresh_token" })
    @IsString()
    refresh_token: string;

}