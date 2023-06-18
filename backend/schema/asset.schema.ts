import {IsNumber, IsString} from "class-validator";
import {Trim} from "class-sanitizer";

export class AssetSchema {
    @IsString({message: "ID should be string type."})
    @Trim()
    public ID?: string;

    @IsString()
    @Trim()
    public Color?: string;

    @IsNumber()
    public Size?: number;

    @IsString()
    @Trim()
    public Owner?: string;

    @IsNumber()
    public AppraisedValue?: number;

    @IsString()
    @Trim()
    public docType?: string;
}