export interface ApiFailResponse {
    message: string;
}

export interface ApiSuccessResponse<T> {
    data?: T;
}

export type ApiResponse<T> = ApiFailResponse | ApiSuccessResponse<T>;
