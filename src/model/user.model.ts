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

export class UserResponse {
  name: string;
  email: string;
  token?: string;
}
