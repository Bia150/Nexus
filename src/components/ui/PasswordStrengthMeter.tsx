import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
}

const evaluateStrength = (password: string): StrengthResult => {
  if (!password) {
    return { score: 0, label: '', color: 'bg-gray-200' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4 for a clean 4-bar meter
  const capped = Math.min(score, 4);

  const levels: StrengthResult[] = [
    { score: 0, label: 'Very weak', color: 'bg-error-500' },
    { score: 1, label: 'Weak', color: 'bg-error-500' },
    { score: 2, label: 'Fair', color: 'bg-warning-500' },
    { score: 3, label: 'Good', color: 'bg-primary-500' },
    { score: 4, label: 'Strong', color: 'bg-success-500' },
  ];

  return { ...levels[capped], score: capped };
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const { score, label, color } = evaluateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < score ? color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 ${
        score <= 1 ? 'text-error-600' : score === 2 ? 'text-warning-600' : score === 3 ? 'text-primary-600' : 'text-success-600'
      }`}>
        {label}
        {score < 3 && (
          <span className="text-gray-400"> — try adding numbers, symbols, or more length</span>
        )}
      </p>
    </div>
  );
};