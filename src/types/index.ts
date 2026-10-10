export interface Ticket {
  ticketId: string;
  name: string;
  email: string;
  phone: string;
  college?: string;
  paymentId: string;
  orderId?: string;
  status: 'Valid' | 'Used' | 'Cancelled';
  createdAt: any;
  usedAt?: any;
  amount?: number;
  eventName?: string;
  idCardUrl?: string;
}

export interface CreateOrderRequest {
  name: string;
  email: string;
  phone: string;
  college?: string;
  ticketQuantity?: number;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  email: string;
  phone: string;
}

export interface VerifyTicketResponse {
  success: boolean;
  status: 'Valid' | 'Used' | 'Invalid';
  message: string;
  ticket?: Ticket;
}
