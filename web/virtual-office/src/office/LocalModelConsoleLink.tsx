import { useState } from 'react';

// Navigation only: never probe ports or pass Office state to the console.
function consoleAddress(value: string): string | undefined {
  const match = /^http:\/\/127\.0\.0\.1:([1-9]\d{0,4})\/?$/.exec(value.trim());
  if (!match || Number(match[1]) > 65535) return undefined;
  return `http://127.0.0.1:${match[1]}/`;
}

export function LocalModelConsoleLink() {
  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState<string>();
  const [error, setError] = useState('');
  return <section className="local-model-entry" aria-labelledby="local-model-title">
    <div><p className="eyebrow">LOCAL DEVELOPER TOOL</p><h2 id="local-model-title">Work with the local model</h2>
      <p>A separate text console, not an Office agent. Responses are unverified. No agent or mission data is sent from this page.</p></div>
    <form noValidate onSubmit={(event) => {
      event.preventDefault();
      const url = consoleAddress(address);
      setDestination(url);
      setError(url ? '' : 'Use the console’s printed address: http://127.0.0.1:PORT (port 1–65535), with no path or parameters.');
    }}>
      <label htmlFor="local-console-address">Console address</label>
      <p id="local-console-help">Start the existing model-console command locally, then paste its printed URL. This page does not start or check the server. Only open a console you started and trust.</p>
      <div className="local-model-address"><input id="local-console-address" type="text" inputMode="url" autoComplete="off" spellCheck={false}
        placeholder="http://127.0.0.1:PORT" value={address} maxLength={128} aria-invalid={!!error}
        aria-describedby={`local-console-help${error ? ' local-console-error' : ''}`} onChange={(event) => {
          setAddress(event.target.value); setDestination(undefined); setError('');
        }} /><button type="submit">Prepare console link</button></div>
      {error && <p id="local-console-error" role="alert">{error}</p>}
      <div role="status">{destination && <p>Address format accepted; availability is not checked. <a href={destination} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open local model console (new tab) ↗</a></p>}</div>
      <p className="local-model-note">If the new tab cannot connect, check that the console is running and paste its current address. Address stays only in this view; leaving Office or reloading clears it. No tools or operational Runs are enabled.</p>
    </form>
  </section>;
}
