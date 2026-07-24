import { IsNotEmpty, IsString } from 'class-validator';

export class BindInviteDto {
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}
