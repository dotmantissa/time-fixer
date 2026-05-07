import { useEffect, useMemo, useState } from 'react';
import WalletBar from './components/WalletBar';
import TimeInput from './components/TimeInput';
import TimestampCard from './components/TimestampCard';
import HistoryList from './components/HistoryList';
import { CHAIN_ID } from './constants';
import { useWallet } from './hooks/useWallet';
import { convertTime, getCachedTimestamp } from './lib/genLayerClient';

function truncateError(message) {
  if (!message) return 'Unknown error';
  return message.length > 140 ? `${message.slice(0, 140)}...` : message;
}

export default function App() {
  const {
    provider,
    signer,
    address,
    isConnected,
    wrongNetwork,
    chainId,
    walletError,
    connect,
    disconnect,
    switchToGenLayer,
    clearError
  } = useWallet();

  const [naturalTime, setNaturalTime] = useState('');
  const [validationError, setValidationError] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!inlineError && !walletError) return undefined;
    const timer = setTimeout(() => {
      setInlineError('');
      clearError();
    }, 6000);
    return () => clearTimeout(timer);
  }, [inlineError, walletError, clearError]);

  const gateError = useMemo(() => {
    if (!isConnected) return 'Connect your wallet before interacting with the contract.';
    if (chainId !== CHAIN_ID) return 'Wrong network. Switch to GenLayer Studio to continue.';
    return '';
  }, [isConnected, chainId]);

  const resetAppState = () => {
    setNaturalTime('');
    setValidationError('');
    setInlineError('');
    setLoading(false);
    setStatusMessage(null);
    setSelectedEntry(null);
    setHistory([]);
  };

  const handleDisconnect = () => {
    disconnect();
    resetAppState();
  };

  const validateInput = () => {
    if (!naturalTime.trim()) {
      setValidationError('Natural language time is required.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const pushHistory = (entry) => {
    setHistory((prev) => [entry, ...prev]);
    setSelectedEntry(entry);
  };

  const handleConvert = async () => {
    setInlineError('');
    clearError();

    if (!validateInput()) return;
    if (gateError) {
      setInlineError(gateError);
      return;
    }
    if (!signer || !provider || !address) {
      setInlineError('Connect your wallet before interacting with the contract.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Submitting transaction...');

      const timestamp = await convertTime(address, naturalTime.trim(), setStatusMessage);

      const entry = {
        input: naturalTime.trim(),
        timestamp,
        retrievedAt: new Date().toISOString()
      };
      pushHistory(entry);
    } catch (error) {
      if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
        setInlineError('Transaction rejected.');
      } else {
        setInlineError(truncateError(error?.message || 'Transaction failed.'));
      }
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleGetCached = async () => {
    setInlineError('');
    clearError();

    if (!validateInput()) return;
    if (gateError) {
      setInlineError(gateError);
      return;
    }
    if (!address) {
      setInlineError('Connect your wallet before interacting with the contract.');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Reading cached timestamp...');
      const timestamp = await getCachedTimestamp(address, naturalTime.trim());
      const entry = {
        input: naturalTime.trim(),
        timestamp,
        retrievedAt: new Date().toISOString()
      };
      pushHistory(entry);
    } catch (error) {
      setInlineError(truncateError(error?.message || 'Read failed.'));
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const activeError = inlineError || walletError;

  return (
    <div className="app-shell">
      <WalletBar
        isConnected={isConnected}
        address={address}
        chainId={chainId}
        wrongNetwork={wrongNetwork}
        onConnect={connect}
        onDisconnect={handleDisconnect}
        onSwitch={switchToGenLayer}
      />

      <hr className="divider" />

      <main className="main-column">
        <TimeInput
          naturalTime={naturalTime}
          onChange={(value) => {
            setNaturalTime(value);
            setValidationError('');
            setInlineError('');
            clearError();
          }}
          onConvert={handleConvert}
          onGetCached={handleGetCached}
          loading={loading}
          validationError={validationError}
          statusMessage={statusMessage}
        />

        {activeError ? <p className="error-banner">{activeError}</p> : null}

        <TimestampCard entry={selectedEntry} />

        <HistoryList history={history} onSelect={setSelectedEntry} />
      </main>
    </div>
  );
}
