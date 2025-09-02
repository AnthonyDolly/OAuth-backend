export type SortOrder = 'asc' | 'desc';

export interface PaginationQuery {
	page?: number; // 1-based
	limit?: number; // items per page
}

export interface Paginated<T> {
	items: T[];
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
}

export interface ApiResponse<T = any> {
	success: boolean;
	message?: string;
	data?: T;
	error?: { code: string; details?: unknown };
	timestamp: string;
}


