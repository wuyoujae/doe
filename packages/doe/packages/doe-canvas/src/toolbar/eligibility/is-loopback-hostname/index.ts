

export function isLoopbackHostname(hostname: string): boolean {
  return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(hostname.toLowerCase());
}
