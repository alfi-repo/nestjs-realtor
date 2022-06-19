import { IsNotEmpty, IsString } from 'class-validator';

export class InquireDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
