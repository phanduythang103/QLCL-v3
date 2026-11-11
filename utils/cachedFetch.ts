/**
 * Cache ngắn trong bộ nhớ cho các bảng lớn để giảm egress Supabase.
 *
 * Mỗi lần chuyển module, trình duyệt tải lại cả bảng dù dữ liệu không đổi. Hàm này giữ
 * kết quả GET trong CACHE_MS và xóa cache của bảng ngay khi có thao tác ghi vào bảng đó,
 * nên người đang nhập phiếu luôn thấy dữ liệu mới của mình. Phiếu do người khác vừa nhập
 * có thể hiện chậm tối đa CACHE_MS, hoặc tải lại trang để xem ngay.
 */
const CACHE_MS = 5 * 60 * 1000;

/** Chỉ cache bảng dữ liệu lớn - không đưa bảng đăng nhập, phân quyền, thông báo vào đây */
const CACHED_TABLES = new Set([
  'gs_vst',
  'gs_ndnb',
  'giam_sat_atpt',
  'ksnb_noi_tru',
  'ksnb_ngoai_tru',
  'staff_satisfaction_2026_responses',
]);

interface CacheEntry {
  at: number;
  body: string;
  status: number;
  headers: [string, string][];
}

const cache = new Map<string, CacheEntry>();

const tableOf = (url: string) => url.match(/\/rest\/v1\/([^/?]+)(\?|$)/)?.[1] ?? null;

const clearTable = (table: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(`${table}|`)) cache.delete(key);
  }
};

export const cachedFetch: typeof fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
  const table = tableOf(url);

  // HEAD là truy vấn đếm dòng, không phải thao tác ghi nên không được xóa cache
  if (!table || !CACHED_TABLES.has(table) || method === 'HEAD') return fetch(input, init);

  if (method !== 'GET') {
    clearTable(table);
    const response = await fetch(input, init);
    clearTable(table);
    return response;
  }

  const headers = new Headers(init?.headers);
  const key = `${table}|${headers.get('accept') || ''}|${headers.get('prefer') || ''}|${url}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return new Response(hit.body, { status: hit.status, headers: hit.headers });
  }

  const startedAt = Date.now();
  const response = await fetch(input, init);
  if (response.ok) {
    const body = await response.clone().text();
    cache.set(key, { at: startedAt, body, status: response.status, headers: [...response.headers.entries()] });
  }
  return response;
};
