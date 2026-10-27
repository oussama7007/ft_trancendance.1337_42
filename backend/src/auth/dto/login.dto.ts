import { IsNotEmpty, IsString  } from "class-validator";

export class LoginDto{
    @IsString()
    @IsNotEmpty()
    contact: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}