import { apiRequest } from './client';

export interface OrderItem {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  plateNumber: string;
  regionCode: string;
  plateType: string;
  backSideText: string | null;
  backSideLogo: string | null;
  material: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped_for_sunday' | 'delivered' | 'cancelled';
  sundayDeliveryDate: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city?: string;
  plateNumber: string;
  regionCode?: string;
  plateType?: 'standard' | 'old' | 'vip';
  backSideText?: string | null;
  backSideLogo?: string;
  material?: 'plastic' | 'black_matte' | 'gold_edge' | 'carbon';
  quantity?: number;
  paymentMethod?: 'cash_on_delivery' | 'mbank' | 'optima_qr';
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderItem> {
  return apiRequest<OrderItem>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyOrders(): Promise<OrderItem[]> {
  return apiRequest<OrderItem[]>('/orders/my');
}

export async function trackOrder(orderNumber: string): Promise<OrderItem> {
  return apiRequest<OrderItem>(`/orders/track/${encodeURIComponent(orderNumber)}`);
}
