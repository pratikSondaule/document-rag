export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('. ');
  if (typeof msg === 'string' && msg) return msg;
  if (!error?.response && error?.message && !error.isAxiosError) return error.message;
  return fallback;
}