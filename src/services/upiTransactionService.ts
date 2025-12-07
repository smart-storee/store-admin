// src/services/upiTransactionService.ts
import { API_URL, isNgrokUrl } from '@/config/api.config';

interface UpiTransaction {
  transaction_id: number;
  upi_transaction_id: string;
  order_id: number;
  upi_id: string;
  amount: number;
  status: string;
  initiated_at: string;
  verified_at: string | null;
  expires_at: string | null;
  attempts: number;
  last_attempted_at: string | null;
  order_number: string;
  order_status: string;
  payment_status: string;
  order_total: number;
  order_created_at: string;
  customer_name: string;
  customer_phone: string;
}

interface UpiTransactionResponse {
  success: boolean;
  data: UpiTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface UpiTransactionSummary {
  summary: {
    total_transactions: number;
    successful_transactions: number;
    failed_transactions: number;
    total_revenue: number;
    average_transaction_value: number;
  };
  status_breakdown: {
    status: string;
    count: number;
    total_amount: number;
  }[];
}

interface GetTransactionsParams {
  page?: number;
  limit?: number;
  status?: string;
  order_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

class UpiTransactionService {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = API_URL;
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };

    // Add ngrok bypass header if using ngrok
    if (isNgrokUrl()) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    return headers;
  }

  async getUpiTransactions(params: GetTransactionsParams = {}): Promise<UpiTransactionResponse> {
    const url = new URL(`${this.baseUrl}/upi-transactions`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UPI transactions: ${response.statusText}`);
    }

    return await response.json();
  }

  // async getUpiTransactionById(transactionId: string | number): Promise<{ success: boolean; data: UpiTransaction }> {
  //   const response = await fetch(`${this.baseUrl}/upi-transactions/${transactionId}`, {
  //     method: 'GET',
  //     headers: this.getHeaders(),
  //   });

  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch UPI transaction: ${response.statusText}`);
  //   }

  //   return await response.json();
  // }

  async getUpiTransactionSummary(): Promise<{ success: boolean; data: UpiTransactionSummary }> {
    const response = await fetch(`${this.baseUrl}/upi-transactions/summary`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UPI transaction summary: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default UpiTransactionService;