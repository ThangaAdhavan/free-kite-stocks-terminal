import { Link } from 'react-router-dom';
import { Delta } from './Delta';
import { fmtPrice, fmtCompact } from '../lib/format';

interface Props {
  symbol: string; name: string; price?: number; changePercent?: number; change?: number;
  volume?: number; extra?: React.ReactNode;
}

export default function StockRow({ symbol, name, price, changePercent, change, volume, extra }: Props) {
  return (
    <Link to={`/stock/${encodeURIComponent(symbol)}`} className="flex items-center gap-3 px-3 py-2.5 border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--accent)] hover:text-[#0a0a0a] transition-colors">
      <div className="min-w-0 flex-1">
        <div className="font-mono2 font-bold text-sm">{symbol}</div>
        <div className="text-xs opacity-70 truncate">{name}</div>
      </div>
      {volume != null && <div className="hidden sm:block text-xs font-mono2 text-right opacity-70">Vol {fmtCompact(volume)}</div>}
      <div className="text-right shrink-0">
        <div className="font-mono2 font-bold text-sm">{fmtPrice(price)}</div>
        <Delta pct={changePercent} abs={change} size="sm" />
      </div>
      {extra}
    </Link>
  );
}
