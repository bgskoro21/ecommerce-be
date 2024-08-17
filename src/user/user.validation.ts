import { UserRole } from 'src/model/user.model';
import { ZodType, z } from 'zod';

export class UserValidation {
  static readonly REGISTER: ZodType = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .regex(/[\W_]/, 'Password must contain at least one special character.'),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z
      .string()
      .regex(/^\d+$/, { message: 'Phone must contain only numbers' }),
    address: z.string().min(1, { message: 'Address is required' }),
    role: z.nativeEnum(UserRole, { message: 'Invalid user role' }),
  });

  static readonly LOGIN: ZodType = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
  });

  static readonly FORGOT_PASSWORD: ZodType = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  });

  static readonly RESET_PASSWORD: ZodType = z
    .object({
      token: z.string().nonempty('Token is required.'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters long.')
        .regex(/\d/, 'Password must contain at least one number.')
        .regex(
          /[\W_]/,
          'Password must contain at least one special character.',
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match.',
      path: ['confirmPassword'], // Show the error under `confirmPassword`
    });
}
