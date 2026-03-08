export interface ErrorEventPayload {
  errorCode: string;
  module: string; // The Class Name
  message: string;
  stackTrace: string;
  path: string;
  method: string;
  body?: any;
  timestamp: string;
}
