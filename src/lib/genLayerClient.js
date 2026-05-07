import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import {
  CONTRACT_ADDRESS,
  ABI
} from '../constants';

const RESULT_WAIT_TIMEOUT_MS = 45 * 1000;
const RESULT_POLL_INTERVAL_MS = 1500;

export function buildGenLayerClient(accountAddress) {
  return createClient({
    chain: studionet,
    account: accountAddress
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readTimestamp(client, naturalTime) {
  const rawTimestamp = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'get_timestamp',
    args: [naturalTime]
  });
  return Number(rawTimestamp);
}

async function pollTimestampForNewValue(client, naturalTime, previousValue, onStatus) {
  const maxAttempts = Math.ceil(RESULT_WAIT_TIMEOUT_MS / RESULT_POLL_INTERVAL_MS);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const value = await readTimestamp(client, naturalTime);
    if (value > 0 && value !== previousValue) return value;

    if (attempt % 5 === 0) {
      onStatus?.('Waiting for result... checking onchain state.');
    }
    await delay(RESULT_POLL_INTERVAL_MS);
  }

  return 0;
}

export async function convertTime(accountAddress, naturalTime, onStatus) {
  const client = buildGenLayerClient(accountAddress);
  let previousValue = 0;

  try {
    previousValue = await readTimestamp(client, naturalTime);
  } catch {
    previousValue = 0;
  }

  onStatus?.('Submitting transaction...');

  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'to_unix_timestamp',
    args: [naturalTime],
    value: BigInt(0)
  });

  onStatus?.('Transaction sent. Fetching resolved timestamp...');

  const timestamp = await pollTimestampForNewValue(
    client,
    naturalTime,
    previousValue,
    onStatus
  );

  if (timestamp <= 0) {
    throw new Error(
      `No new timestamp written within 45s for tx ${txHash}. Retry once, then use "Get Cached Timestamp".`
    );
  }

  return timestamp;
}

export async function getCachedTimestamp(accountAddress, naturalTime) {
  const client = buildGenLayerClient(accountAddress);
  return readTimestamp(client, naturalTime);
}
