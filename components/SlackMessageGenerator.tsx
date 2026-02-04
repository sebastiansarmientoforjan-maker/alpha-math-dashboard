'use client';

import { useState } from 'react';
import { Student } from '@/types';
import { generateSlackMessage, getStudentAgeGroup, getRiskTier, getMessageStats } from '@/lib/slack-message-generator';

interface SlackMessageGeneratorProps {
  student: Student;
}

export default function SlackMessageGenerator({ student }: SlackMessageGeneratorProps) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const generated = generateSlackMessage(student);
    setMessage(generated);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ageGroup = getStudentAgeGroup(student);
  const tier = getRiskTier(student);
  const stats = message ? getMessageStats(message) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white uppercase">Slack Message Generator</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
            {ageGroup === 'MS' ? 'Middle School' : 'High School'} • {tier} Tier
          </p>
        </div>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-alpha-gold hover:bg-alpha-gold/90 text-black font-black text-[10px] uppercase rounded-lg transition-all"
        >
          Generate Message
        </button>
      </div>

      {message && (
        <>
          <div className="glass-card rounded-xl p-4 bg-slate-900/40 border border-slate-800">
            <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
              {message}
            </pre>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[9px] text-slate-500">
              {stats && (
                <>
                  <span>{stats.characterCount} characters</span>
                  <span>•</span>
                  <span>{stats.lineCount} lines</span>
                  <span>•</span>
                  <span>{stats.hasEmoji ? '✓ Emoji' : '✗ No Emoji'}</span>
                  <span>•</span>
                  <span className="capitalize">{stats.tone} Tone</span>
                </>
              )}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 ${
                copied ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
              } text-white font-black text-[10px] uppercase rounded-lg transition-all`}
            >
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-black text-[9px] uppercase rounded-lg transition-all"
            >
              🔄 Generate Another
            </button>
          </div>
        </>
      )}

      {!message && (
        <div className="text-center py-8 text-slate-600 text-sm">
          Click "Generate Message" to create an age-appropriate Slack message for {student.firstName}
        </div>
      )}
    </div>
  );
}
