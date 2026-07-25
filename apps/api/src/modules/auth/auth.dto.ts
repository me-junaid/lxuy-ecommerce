import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  /**
   * Normalised to lowercase by the Transform decorator before any validation
   * runs, so "User@Example.COM" and "user@example.com" are treated as the
   * same address throughout the system.
   */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  /**
   * bcrypt silently truncates input at 72 bytes. A password longer than that
   * offers no extra security and can be used as a CPU-exhaustion DoS vector.
   */
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password is too weak. Must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character.',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must be at most 50 characters long' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must be at most 50 characters long' })
  lastName!: string;
}

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  /**
   * Same 72-byte cap as RegisterDto to avoid bcrypt DoS via login endpoint.
   */
  @MaxLength(72, { message: 'Password must be at most 72 characters long' })
  password!: string;
}
