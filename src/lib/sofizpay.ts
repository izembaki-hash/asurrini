// SofizPay integration helper - Real payment gateway for Algeria (CIB / EDAHABIA)
// Docs: https://docs.sofizpay.com - Endpoints: /make-cib-transaction/ & /cib-transaction-check/

export interface SofizpayConfig {
  account: string;
  baseUrl: string;
  isSandbox: boolean;
}

export function getSofizpayConfig(): SofizpayConfig {
  const account = process.env.SOFIZPAY_ACCOUNT || process.env.NEXT_PUBLIC_SOFIZPAY_ACCOUNT || '';
  const baseUrl = (process.env.SOFIZPAY_BASE_URL || 'https://sofizpay.com').replace(/\/$/, '');
  const isSandbox = process.env.SOFIZPAY_SANDBOX === 'true';
  return { account, baseUrl, isSandbox };
}

export function isSofizpayConfigured(): boolean {
  const { account } = getSofizpayConfig();
  return !!account && account.startsWith('G');
}

export interface CreateCibParams {
  amount: number;
  full_name: string;
  phone: string;
  email: string;
  return_url: string;
  memo?: string;
  redirect?: 'yes' | 'no';
  keep_return_url?: 'True' | 'False';
}

export interface SofizpayCreateResponse {
  success: boolean;
  transaction_id: string;
  cib_transaction_id: string;
  payment_url: string;
  amount: string;
  status: string;
  more_info_url: string;
  cib_response?: {
    errorCode: string;
    orderId: string;
    formUrl: string;
  };
  // raw
  raw?: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createCibTransaction(params: CreateCibParams): Promise<SofizpayCreateResponse> {
  const { account, baseUrl, isSandbox } = getSofizpayConfig();
  if (!account) throw new Error('SOFIZPAY_ACCOUNT is not configured');

  const endpoint = isSandbox
    ? `${baseUrl}/sandbox/make-cib-transaction/`
    : `${baseUrl}/make-cib-transaction/`;

  const search = new URLSearchParams({
    account,
    amount: String(params.amount),
    full_name: params.full_name,
    phone: params.phone,
    email: params.email,
    return_url: params.return_url,
    redirect: params.redirect || 'no',
    keep_return_url: params.keep_return_url || 'True',
  });
  if (params.memo) search.set('memo', params.memo);

  const url = `${endpoint}?${search.toString()}`;
  console.log('[SofizPay] createCibTransaction URL:', url.replace(account, account.slice(0, 8) + '***'));

  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' }, redirect: 'manual' as RequestRedirect });
  // Handle redirect=yes case where SofizPay returns 302 with Location = payment_url
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (location) {
      return {
        success: true,
        transaction_id: location.split('mdOrder=').pop() || '',
        cib_transaction_id: location.split('mdOrder=').pop() || '',
        payment_url: location.startsWith('http') ? location : `${baseUrl}${location}`,
        amount: String(params.amount),
        status: 'pending_user_transfer_start',
        more_info_url: '',
        raw: { redirect: location },
      };
    }
  }
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`SofizPay invalid JSON: ${text.slice(0, 500)}`);
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || data?.detail || `SofizPay error ${res.status}: ${text.slice(0, 500)}`);
  }

  // Normalize response – SofizPay may return different keys
  const transaction_id = data.transaction_id || data.id || data.transactionId || '';
  const cib_transaction_id = data.cib_transaction_id || data.cibTransactionId || data.order_number || data.orderId || transaction_id;
  const payment_url = data.payment_url || data.paymentUrl || data.cib_response?.formUrl || data.formUrl || data.url || data.redirect_url || '';
  const status = data.status || (data.success ? 'pending_user_transfer_start' : 'failed');

  if (!payment_url) {
    console.error('[SofizPay] missing payment_url in response', data);
    throw new Error('SofizPay: payment_url not found in response');
  }

  return {
    success: !!data.success || !!payment_url,
    transaction_id,
    cib_transaction_id,
    payment_url,
    amount: String(data.amount ?? params.amount),
    status,
    more_info_url: data.more_info_url || data.moreInfoUrl || '',
    cib_response: data.cib_response,
    raw: data,
  };
}

export interface SofizpayCheckResponse {
  success: boolean;
  status: string;
  isPaid: boolean;
  isFailed: boolean;
  isPending: boolean;
  raw: any;
}

export async function checkCibTransaction(orderNumber: string): Promise<SofizpayCheckResponse> {
  const { baseUrl, isSandbox } = getSofizpayConfig();
  const endpoint = isSandbox
    ? `${baseUrl}/sandbox/cib-transaction-check/`
    : `${baseUrl}/cib-transaction-check/`;

  const url = `${endpoint}?order_number=${encodeURIComponent(orderNumber)}`;
  console.log('[SofizPay] checkCibTransaction', url);

  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`SofizPay check invalid JSON: ${text.slice(0, 500)}`);
  }

  if (!res.ok) {
    // 404 may mean not found yet
    if (res.status === 404) {
      return { success: false, status: 'not_found', isPaid: false, isFailed: false, isPending: true, raw: data };
    }
    throw new Error(data?.message || data?.error || `SofizPay check error ${res.status}`);
  }

  // Heuristic status parsing – SofizPay docs do not give exhaustive list
  // Common statuses: pending_user_transfer_start, paid, success, completed, approved, failed, declined, expired
  const rawStatus: string = String(data.status || data.transaction_status || data.state || '').toLowerCase();
  const successFlag = data.success === true || data.paid === true;

  const paidKeywords = ['paid', 'success', 'completed', 'approved', 'captured', 'confirmed'];
  const failedKeywords = ['failed', 'declined', 'rejected', 'cancelled', 'canceled', 'expired', 'error'];
  const isPaid = successFlag || paidKeywords.some(k => rawStatus.includes(k));
  const isFailed = !isPaid && failedKeywords.some(k => rawStatus.includes(k));
  const isPending = !isPaid && !isFailed;

  return {
    success: true,
    status: rawStatus || (isPaid ? 'paid' : isPending ? 'pending' : 'unknown'),
    isPaid,
    isFailed,
    isPending,
    raw: data,
  };
}

// Map SofizPay status to our internal paymentStatus
export function mapSofizpayToPaymentStatus(check: SofizpayCheckResponse): 'paid' | 'failed' | 'pending' {
  if (check.isPaid) return 'paid';
  if (check.isFailed) return 'failed';
  return 'pending';
}
