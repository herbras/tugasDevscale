export interface ValidationErrorDetail {
  errorCode?: string;
  details?: string;
  suggestion?: string;
  field?: string;
  message?: string;
  type?: string;
  allowedTypes?: string[];
  maxSize?: string;
  receivedType?: string;
  receivedSize?: string;
}

export interface StandardResponseMeta {
  page?: number;
  item_per_page?: number;
  total_item?: number;
  total_page?: number;
}

export interface StandardResponse<T = unknown> {
  timestamp: string;
  status: number;
  message: string;
  type: string;
  path: string;
  version: string;
  data?: T;
  meta?: StandardResponseMeta;
  details?: ValidationErrorDetail[];
  error?: string;
}
