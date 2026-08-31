export const SAMPLED_BANK_BOUNDARY_MBPS = 1.35;
export const SAMPLED_BANK_BOUNDARY_RTT_MS = 250;
export const SAMPLED_BANK_TRANSFER_HEADROOM = 1.18;
export const SAMPLED_BANK_TRANSFER_TIMEOUT_MS = 45_000;

/**
 * Conservative cold-cache transfer budget for the slowest connection observed
 * in the target vehicle. This is evidence for a deadline, not a claim that the
 * browser's Network Information estimate equals measured resource throughput.
 */
export function sampledBankTransferBudgetMs(byteLength, {
  downlinkMbps = SAMPLED_BANK_BOUNDARY_MBPS,
  rttMs = SAMPLED_BANK_BOUNDARY_RTT_MS,
  headroom = SAMPLED_BANK_TRANSFER_HEADROOM,
} = {}) {
  const bytes = Math.max(0, Number(byteLength) || 0);
  const bitsPerSecond = Math.max(0.001, Number(downlinkMbps) || 0.001) * 1_000_000;
  const transferMs = bytes * 8 / bitsPerSecond * 1000;
  return Math.ceil(transferMs * Math.max(1, Number(headroom) || 1) + Math.max(0, Number(rttMs) || 0));
}
