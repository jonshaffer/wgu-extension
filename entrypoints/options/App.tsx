import React, { useState, useEffect } from 'react';
import { 
  dataCollectionEnabled, 
  discordCollectionEnabled, 
  wguConnectCollectionEnabled,
  firstInstall
} from '../utils/storage';

export default function OptionsPage() {
  const [settings, setSettings] = useState({
    dataCollectionEnabled: false,
    discordCollectionEnabled: false,
    wguConnectCollectionEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [dataCollection, discord, wguConnect] = await Promise.all([
        dataCollectionEnabled.getValue(),
        discordCollectionEnabled.getValue(),
        wguConnectCollectionEnabled.getValue(),
      ]);

      setSettings({
        dataCollectionEnabled: dataCollection,
        discordCollectionEnabled: discord,
        wguConnectCollectionEnabled: wguConnect,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        dataCollectionEnabled.setValue(settings.dataCollectionEnabled),
        discordCollectionEnabled.setValue(settings.discordCollectionEnabled),
        wguConnectCollectionEnabled.setValue(settings.wguConnectCollectionEnabled),
      ]);

      await firstInstall.setValue(false);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleMainToggle = (enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      dataCollectionEnabled: enabled,
      discordCollectionEnabled: enabled ? prev.discordCollectionEnabled : false,
      wguConnectCollectionEnabled: enabled ? prev.wguConnectCollectionEnabled : false,
    }));
  };

  const handleSubToggle = (key: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: enabled,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">WGU Extension Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure data collection and community features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Collection Settings</CardTitle>
            <CardDescription>
              Help improve the extension by contributing to community resource discovery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Collection Toggle */}
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="main-toggle" className="text-base font-medium">
                  Help Keep This Extension Current
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Enable data collection to help improve the extension with community resources and course information. 
                  Only public, non-personal data is collected to benefit the WGU community.
                </p>
              </div>
              <Switch
                id="main-toggle"
                checked={settings.dataCollectionEnabled}
                onCheckedChange={handleMainToggle}
              />
            </div>

            {/* Sub-collection Options */}
            {settings.dataCollectionEnabled && (
              <div className="ml-4 pl-4 border-l-2 border-muted space-y-4">
                {/* Discord Collection */}
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="discord-toggle" className="font-medium">
                      Discord Server Data
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Collect information about WGU-related Discord servers and channels to help students find study groups and resources.
                    </p>
                  </div>
                  <Switch
                    id="discord-toggle"
                    checked={settings.discordCollectionEnabled}
                    onCheckedChange={(enabled) => handleSubToggle('discordCollectionEnabled', enabled)}
                  />
                </div>

                {/* WGU Connect Collection */}
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="wgu-connect-toggle" className="font-medium">
                      WGU Connect Resources
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Collect information about community resources, study materials, and group content from WGU Connect.
                    </p>
                  </div>
                  <Switch
                    id="wgu-connect-toggle"
                    checked={settings.wguConnectCollectionEnabled}
                    onCheckedChange={(enabled) => handleSubToggle('wguConnectCollectionEnabled', enabled)}
                  />
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <Alert>
              <AlertDescription>
                <strong>Privacy & Data Collection:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Only publicly available community resources are collected</li>
                  <li>• No personal student data, grades, or private information is accessed</li>
                  <li>• Data is used solely to improve community resource discovery</li>
                  <li>• You can disable collection at any time in these settings</li>
                  <li>• All collection respects the terms of service of the respective platforms</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}