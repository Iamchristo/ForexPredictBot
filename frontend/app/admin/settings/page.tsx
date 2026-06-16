'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { cn } from '@/lib/utils';

interface SettingField {
  key: string;
  label: string;
  desc: string;
  type: 'text' | 'email' | 'toggle' | 'password' | 'number';
  section: string;
}

const settingFields: SettingField[] = [
  { key: 'site_name', label: 'Site Name', desc: 'Application display name', type: 'text', section: 'General' },
  { key: 'site_tagline', label: 'Tagline', desc: 'Short marketing tagline', type: 'text', section: 'General' },
  { key: 'contact_email', label: 'Contact Email', desc: 'Support contact email', type: 'email', section: 'General' },
  { key: 'registration_open', label: 'Allow Registration', desc: 'Allow new users to register', type: 'toggle', section: 'General' },
  { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Temporarily disable the app', type: 'toggle', section: 'General' },
  { key: 'default_daily_limit', label: 'Default Daily Limit', desc: 'Analyses per day for Free plan', type: 'number', section: 'Trading' },
  { key: 'anthropic_api_key', label: 'Anthropic API Key', desc: 'Claude API key for AI chat', type: 'password', section: 'API Keys' },
  { key: 'stripe_public_key', label: 'Stripe Public Key', desc: 'Stripe publishable key', type: 'password', section: 'API Keys' },
  { key: 'stripe_secret_key', label: 'Stripe Secret Key', desc: 'Stripe secret key (server-side)', type: 'password', section: 'API Keys' },
];

const sections = ['General', 'Trading', 'API Keys'];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    adminApi.getSettings().then(res => {
      setSettings(res.data || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleBool = (key: string) => {
    setSettings(s => ({ ...s, [key]: s[key] === 'true' ? 'false' : 'true' }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">App Settings</h1>
          <p className="text-muted text-sm mt-1">Configure platform behavior</p>
        </div>
        <ShimmerButton onClick={handleSave} disabled={saving} size="sm">
          <Save size={15} className="mr-1.5" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </ShimmerButton>
      </div>

      {settings['maintenance_mode'] === 'true' && (
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3 text-yellow-400 text-sm">
          <AlertTriangle size={16} />
          Maintenance mode is ON — users cannot access the app
        </div>
      )}

      {sections.map(section => {
        const sectionFields = settingFields.filter(f => f.section === section);
        return (
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface rounded-xl border border-border overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-semibold text-slate-200 text-sm">{section}</h3>
            </div>
            <div className="divide-y divide-border">
              {sectionFields.map(field => (
                <div key={field.key} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{field.label}</p>
                    <p className="text-xs text-muted mt-0.5">{field.desc}</p>
                  </div>
                  <div className="flex-shrink-0 w-52">
                    {field.type === 'toggle' ? (
                      <div
                        onClick={() => toggleBool(field.key)}
                        className={cn(
                          'w-11 h-6 rounded-full relative cursor-pointer transition-colors ml-auto',
                          settings[field.key] === 'true' ? 'bg-gold' : 'bg-border'
                        )}
                      >
                        <div className={cn(
                          'w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-transform',
                          settings[field.key] === 'true' ? 'translate-x-5' : 'translate-x-0.5'
                        )} />
                      </div>
                    ) : field.type === 'password' ? (
                      <div className="relative">
                        <input
                          type={showKeys[field.key] ? 'text' : 'password'}
                          value={settings[field.key] ?? ''}
                          onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                          className="input-field text-xs pr-9"
                          placeholder="Not set"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys(k => ({ ...k, [field.key]: !k[field.key] }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-slate-300"
                        >
                          {showKeys[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        value={settings[field.key] ?? ''}
                        onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                        className="input-field text-sm"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-trade-buy/20 border border-trade-buy/30 rounded-xl px-4 py-3 text-trade-buy text-sm font-medium"
        >
          ✓ Settings saved successfully
        </motion.div>
      )}
    </div>
  );
}
