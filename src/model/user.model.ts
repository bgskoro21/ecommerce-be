export enum UserRole {
  StoreOwner = 'STORE_OWNER',
  Customer = 'CUSTOMER',
}

export class RegisterUserRequest {
  name: string;
  password: string;
  email: string;
  phone: string;
  address: string;
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

export class UserResponse {
  name?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
}
