import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ZodError } from 'zod';

@Catch(ZodError, HttpException)
export class ErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        errors: exception.getResponse(),
      });
    } else if (exception instanceof ZodError) {
      const errorDetails = exception.errors.map((error) => ({
        path: error.path.join('.'),
        message: error.message,
      }));

      response.status(400).json({
        statusCode: 400,
        errors: errorDetails,
      });
    } else {
      response.status(500).json({
        statusCode: 500,
        errors: exception.message,
      });
    }
  }
}
