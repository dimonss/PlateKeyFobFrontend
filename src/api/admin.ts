import { apiRequest } from './client';
import type { OrderItem } from './orders';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  inProductionCount: number;
  readyForSundayCount: number;
  deliveredCount: number;
  sundayBatches: Record<string, number>;
}

export interface PaginatedOrdersResponse {
  items: OrderItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchAdminOrders(filters?: {
  status?: string;
  sundayDeliveryDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedOrdersResponse> {
  const query = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') query.append('status', filters.status);
  if (filters?.sundayDeliveryDate) query.append('sundayDeliveryDate', filters.sundayDeliveryDate);
  if (filters?.search) query.append('search', filters.search);
  if (filters?.page) query.append('page', filters.page.toString());
  if (filters?.limit) query.append('limit', filters.limit.toString());

  const url = `/admin/orders${query.toString() ? `?${query.toString()}` : ''}`;
  return apiRequest<PaginatedOrdersResponse>(url);
}

export async function updateOrderStatusApi(
  orderId: string,
  status: OrderItem['status'],
  paymentStatus?: 'unpaid' | 'paid'
): Promise<OrderItem> {
  return apiRequest<OrderItem>(`/admin/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, paymentStatus }),
  });
}

export async function deleteOrderApi(orderId: string): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/admin/orders/${orderId}`, {
    method: 'DELETE',
  });
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/admin/stats');
}
