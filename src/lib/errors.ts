export type ErrorCode = 
  | 'COOKIES_REQUIRED' 
  | 'UNSUPPORTED_URL' 
  | 'PRIVATE_CONTENT' 
  | 'FETCH_FAILED' 
  | 'DOWNLOAD_FAILED';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
    
    // Ensure standard stack trace exclusion on runtime
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
