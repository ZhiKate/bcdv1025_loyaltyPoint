import {IsNumber, IsString} from "class-validator";
import {Trim} from "class-sanitizer";

export class OrderSchema {
    @IsString({message: "ID should be string type."})
    @Trim()
    public customerId?: string;

    @IsString()
    @Trim()
    public orderId?: string;

    @IsString()
    @Trim()
    public status?: string;

    @IsNumber()
    public price?: number;

    @IsNumber()
    public createdDate?: number;
}