import { useState } from 'react';
import { useEndpoints } from '../../app/ApiContext';

/** Collects a raw PAN and POSTs it to payzeno-api. Removed by PAY-1673 (arc PCI). */
export function CardNumberInput({ onToken }: { onToken: (t: string) => void }) {
  const [pan, setPan] = useState('');
  const endpoints = useEndpoints();
  return <input inputMode="numeric" value={pan} onChange={(e) => setPan(e.target.value)} />;
}
