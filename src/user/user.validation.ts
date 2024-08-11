import { UserRole } from 'src/model/user.model';
import { ZodType, z } from 'zod';

export class UserValidation {
  static readonly REGISTER: ZodType = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }),
    email: z.string().email({ message: 'Invalid email address' }),
    phone: z
      .string()
      .regex(/^\d+$/, { message: 'Phone must contain only numbers' }),
    address: z.string().min(1, { message: 'Address is required' }),
    role: z.nativeEnum(UserRole, { message: 'Invalid user role' }),
  });
}
