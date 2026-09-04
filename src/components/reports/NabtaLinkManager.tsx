'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { sendTelegramMessage, formatDailyTelegramSummary, getTelegramConfig } from '@/lib/telegram';
import {
  Link2,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Check,
  Send,
  Sparkles,
  Lock,
  Layers,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface TokenInfo {
  token: string;
  createdAt: string;
  isActive: boolean;
  name: string;
}

export default function NabtaLinkManager() {
  const { orders, payments, daySummary, selectedDate, showToast } = useData();
  const [activeToken, setActiveToken] = useState<TokenInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // Fetch active token from server
  const fetchActiveToken = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nabta/token', { cache: 'no-store' });
      const data = await res.json();
      if (data.activeToken) {
        setActiveToken(data.activeToken);
      } else {
        setActiveToken(null);
      }
    } catch (e) {
      console.error('Failed to fetch token:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveToken();
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const shareableUrl = activeToken && activeToken.isActive && origin
    ? `${origin}/reports/nabta/${activeToken.token}`
    : '';

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('Secure Nabta Shareable Report link copied!', 'success');
  };

  const handleGenerateNew = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nabta/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Nabta Secure Link (${format(new Date(), 'MMM dd, HH:mm')})` }),
      });
      const data = await res.json();
      if (data.token) {
        setActiveToken(data.token);
        showToast('Generated new cryptographic token & invalidated previous link!', 'success');
      }
    } catch (e) {
      showToast('Error generating token', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (tokenStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nabta/token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenStr }),
      });
      if (res.ok) {
        setActiveToken(null);
        showToast('Link revoked! The URL is now strictly blocked and inaccessible.', 'info');
      }
    } catch (e) {
      showToast('Error revoking token', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToTelegram = async () => {
    if (!shareableUrl) {
      showToast('Please generate an active Nabta Report link first.', 'error');
      return;
    }

    const config = getTelegramConfig();
    if (!config.botToken || !config.chatId) {
      showToast('Please set your Telegram Bot Token & Chat ID in Settings first.', 'error');
      return;
    }

    setIsSendingTelegram(true);
    try {
      const dayOrders = orders.filter((o) => o.date === selectedDate);
      const totalQty = dayOrders.reduce((sum, o) => sum + Number(o.qty || 0), 0);
      const totalNabtaBill = dayOrders.reduce((sum, o) => sum + Number(o.nabta_bill || 0), 0);
      const totalClientBill = dayOrders.reduce((sum, o) => sum + Number(o.client_bill || 0), 0);
      const ordersPaid = dayOrders.reduce((sum, o) => sum + Number(o.amount_received || 0), 0);
      
      const jahedBalance = Number(daySummary?.jahed_balance || 0);
      const expensesPaid = Number(daySummary?.paid || 0);
      const nabtaYesterdayBalance = Number(daySummary?.nabta_yesterday_balance || 0);
      const nabtaTodayBalance = Number(daySummary?.nabta_today_balance || 0);

      const msg = formatDailyTelegramSummary({
        date: selectedDate,
        ordersCount: dayOrders.length,
        totalQty,
        totalNabtaBill,
        totalClientBill,
        jahedBalance,
        ordersPaid,
        expensesPaid,
        nabtaYesterdayBalance,
        nabtaTodayBalance,
        reportLink: shareableUrl,
      });

      const res = await sendTelegramMessage(msg);
      if (res.success) {
        showToast('Delivered to Telegram successfully!', 'success');
      } else {
        showToast(`Telegram send error: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast('Error dispatching message to Telegram', 'error');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white">
                Shareable Nabta Report Link
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Cryptographically Secure • 10 Days/Page
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Unique, non-guessable random token with zero exposure of Client Price or admin functions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateNew}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Regenerate Link</span>
          </button>

          <button
            onClick={handleSendToTelegram}
            disabled={isSendingTelegram || !activeToken}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/25 transition-all disabled:opacity-50"
          >
            {isSendingTelegram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send to Telegram</span>
          </button>
        </div>
      </div>

      {/* Active Link Box */}
      {activeToken && activeToken.isActive ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Live Report URL (Synchronized with Database):
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Token: {activeToken.token.substring(0, 18)}...
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm font-mono font-bold text-emerald-400 focus:outline-none select-all"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied URL!' : 'Copy Link'}</span>
              </button>

              <a
                href={shareableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Report</span>
              </a>

              <button
                onClick={() => handleRevoke(activeToken.token)}
                title="Revoke and invalidate this link immediately"
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <p className="text-sm font-bold text-slate-300">No Active Shareable Link (Or Previously Revoked)</p>
          <p className="text-xs text-slate-500">
            Click Generate to create a new cryptographically random token.
          </p>
          <button
            onClick={handleGenerateNew}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Report Link</span>
          </button>
        </div>
      )}

      {/* Security & Privacy Specifications Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Server-Level Sanitization</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Client Price is stripped on the server before the JSON payload is delivered. Never exposed in Network tab.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-cyan-400">
            <Layers className="w-3.5 h-3.5" />
            <span>10 Days Per Page</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Oldest to newest ordering with complete 10-day chunk pagination (Days 1–10, 11–20, 21–30).
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Instant Revocation & Invalidation</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Regenerating a link immediately invalidates the prior token, and revoking immediately cuts off access with HTTP 403.
          </p>
        </div>
      </div>
    </div>
  );
}
