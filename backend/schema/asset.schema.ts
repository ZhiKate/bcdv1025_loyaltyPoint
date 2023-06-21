import {IsNumber, IsString} from "class-validator";
import {Trim} from "class-sanitizer";

export class UpdatePointSchema {
    @IsString({message: "ID should be string type."})
    @Trim()
    public customerId?: string;

    @Trim()
    public companyName?: string;

    @IsNumber()
    public point?: number;
}

export class CreatePointSchema {
    @IsString({message: "ID should be string type."})
    @Trim()
    public customerId?: string;

    @Trim()
    public customerName?: string;

    @Trim()
    public companyName?: string;

    @Trim()
    public contribution?: number;

    @IsNumber()
    public point?: number;
}

export class ContributePointSchema {
    @IsString({message: "ID should be string type."})
    @Trim()
    public customerId?: string;

    @Trim()
    public companyName?: string;

    @Trim()
    public contribution?: number;
}