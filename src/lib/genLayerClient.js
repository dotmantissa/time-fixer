import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionStatus } from 'genlayer-js/types';
import {
  CONTRACT_ADDRESS,
  ABI,
  TX_POLL_INTERVAL,
  TX_POLL_RETRIES
} from '../constants';

export function buildGenLayerClient(accountAddress) {
  return createClient({
    chain: studionet,
    account: accountAddress
  });
}

export async function convertTime(accountAddress, naturalTime, onStatus) {
  const client = buildGenLayerClient(accountAddress);

  onStatus?.('Submitting transaction...');

  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'to_unix_timestamp',
    args: [naturalTime],
    value: BigInt(0)
  });

  onStatus?.('Waiting for LLM consensus... (this can take 30-90 seconds)');

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.FINALIZED,
    retries: TX_POLL_RETRIES,
    interval: TX_POLL_INTERVAL
  });

  if (!receipt) {
    throw new Error('Transaction did not finalize within the timeout window.');
  }

  onStatus?.('Reading resolved timestamp...');

  const rawTimestamp = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'get_timestamp',
    args: [naturalTime]
  });

  return Number(rawTimestamp);
}

export async function getCachedTimestamp(accountAddress, naturalTime) {
  const client = buildGenLayerClient(accountAddress);

  const rawTimestamp = await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'get_timestamp',
    args: [naturalTime]
  });

  return Number(rawTimestamp);
}
