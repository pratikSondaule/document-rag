import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AskQuestionDto {

    @ApiPropertyOptional({ description: "Session ID. If not provided, a new session will be created." })
    @IsOptional()
    @IsString()
    sessionId?: string;

    @ApiProperty({ example: "What are the key terms in the agreement?" })
    @IsNotEmpty()
    @IsString()
    question: string;

    @ApiPropertyOptional({ example: ["a1b2c3d4-..."] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    documentIds?: string[];
}