import { $Enums } from '@prisma/client';

export enum UserRole {
  StoreOwner = 'STORE_OWNER',
  Customer = 'CUSTOMER',
}

export class RegisterUserRequest {
  name: string;
  password: string;
  confirmPassword: string;
  email: string;
  role: UserRole;
}

export class LoginUserRequest {
  email: string;
  password: string;
}

export class ForgotPasswordRequest {
  email: string;
}

export class ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

class User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  role: $Enums.Role;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt: Date;
}

export class UserResponse {
  name?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}
