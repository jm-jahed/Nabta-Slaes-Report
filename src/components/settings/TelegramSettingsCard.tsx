'use client';

import React, { useState, useEffect } from 'react';
import { getTelegramConfig, saveTelegramConfig, sendTelegramMessage, TelegramConfig } from '@/lib/telegram';
import { useData } from '@/context/DataContext';
import { Send, Bot, Check, ShieldCheck, Key, MessageSquare, Sparkles, ExternalLink } from 'lucide-react';

export default function TelegramSettingsCard() {
  const { showToast } = useData();
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: false,
    autoDailySummary: false,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setConfig(getTelegramConfig());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramConfig({
      ...config,
      enabled: Boolean(config.botToken && config.chatId),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    showToast('Telegram Bot settings saved successfully!', 'success');
  };

  const handleTestConnection = async () => {
    if (!config.botToken || !config.chatId) {
      showToast('Please enter both Bot Token and Chat ID', 'error');
      return;
    }

    setIsTesting(true);
    try {
      const testMsg = `🤖 <b>Sales & Payment Reports Bot Connected!</b>\n\n✅ Your Telegram Bot connection is successfully verified.\nYou will receive real-time daily order summaries and shareable Nabta Report links here.`;
      const res = await sendTelegramMessage(testMsg, config.chatId, config.botToken);

      if (res.success) {
        showToast('Test message sent to your Telegram chat successfully!', 'success');
      } else {
        showToast(`Test failed: ${res.error}`, 'error');
      }
    } catch (err: any) {
      showToast('Error connecting to Telegram API', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white">
              Telegram Bot Integration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Receive daily reports, profit summaries & Nabta report links on Telegram
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            config.botToken && config.chatId
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {config.botToken && config.chatId ? 'Configured' : 'Not Connected'}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Telegram Bot Token
          </label>
          <input
            type="text"
            placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            value={config.botToken}
            onChange={(e) => setConfig({ ...config, botToken: e.target.value.trim() })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Obtained from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-500 hover:underline">@BotFather</a> on Telegram
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Telegram Chat ID / Channel ID
          </label>
          <input
            type="text"
            placeholder="e.g. 987654321 or -100123456789"
            value={config.chatId}
            onChange={(e) => setConfig({ ...config, chatId: e.target.value.trim() })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Your personal Telegram User ID or group chat ID (get via <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-sky-500 hover:underline">@userinfobot</a>)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !config.botToken || !config.chatId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTesting ? 'Sending...' : 'Test Telegram Message'}</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all"
          >
            {isSaved ? <Check className="w-4 h-4 stroke-[3]" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isSaved ? 'Saved!' : 'Save Telegram Config'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
