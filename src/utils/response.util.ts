export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface ApiError {
  status: 'error';
  code: string;
  message: string;
  details?: unknown;
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
): ApiError {
  return { status: 'error', code, message, details };
}
