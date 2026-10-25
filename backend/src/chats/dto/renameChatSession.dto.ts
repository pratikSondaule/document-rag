import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RenameChatSessionDto {

    @ApiProperty({ example: "New Title" })
    @IsNotEmpty()
    @IsString()
    title: string;

}