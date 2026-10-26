import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class UpdateSessionDocumentsDto {

    @ApiProperty({ example: ["a1b2c3d4-..."], description: "List of document IDs for the session" })
    @IsArray()
    @IsString({ each: true })
    documentIds: string[];

}
