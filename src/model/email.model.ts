export class EmailConfig {
  email: string;
  subject: string;
  template: string;
  url?: string;
}

export enum EmailType {
  EMAIL_VERIFICATION = 'EmailVerification',
  FORGOT_PASSWORD = 'ForgotPassword',
}
