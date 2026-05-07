const ENV_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const DEFAULT_CONTRACT_ADDRESS = '0x10B1DD1e89A86693B47b68fA81ECDb154E6A068F';

export const CONTRACT_ADDRESS = ENV_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 61999);
export const CHAIN_ID_HEX = '0xF22F';
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:4000/api';
export const NETWORK_NAME = 'GenLayer Studio';
export const TX_POLL_INTERVAL = 3000;
export const TX_POLL_RETRIES = 200;

export const ABI = [
  {
    name: 'to_unix_timestamp',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'natural_language_time', type: 'string' }],
    outputs: []
  },
  {
    name: 'get_timestamp',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'natural_language_time', type: 'string' }],
    outputs: [{ name: '', type: 'int256' }]
  }
];
