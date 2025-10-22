import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { storage } from '@wxt-dev/storage';
import { SHOW_REPORT_PERCENTAGE, ENABLE_DISCORD_INTEGRATION, ENABLE_REDDIT_INTEGRATION, ENABLE_WGU_CONNECT_INTEGRATION, ENABLE_COURSE_COMMUNITIES } from '@/utils/storage.constants';
import { 
  dataCollectionEnabled, 
  discordCollectionEnabled, 
  wguConnectCollectionEnabled,
  firstInstall
} from '../../utils/storage';
import { ModeToggle } from '@/components/mode-toggle';

export default function OptionsPage() {
  const [settings, setSettings] = useState({
    // Data collection settings
    dataCollectionEnabled: false,
    discordCollectionEnabled: false,
    wguConnectCollectionEnabled: false,
    // Feature settings  
    showReportPercent: true,
    enableDiscord: true,
    enableReddit: false,
    enableWguConnect: true,
    enableCourseCommunities: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [
        dataCollection,
        discord,
        wguConnect,
        showReportValue,
        discordValue,
        redditValue,
        wguConnectValue,
        courseCommunitiesValue
      ] = await Promise.all([
        dataCollectionEnabled.getValue(),
        discordCollectionEnabled.getValue(),
        wguConnectCollectionEnabled.getValue(),
        storage.getItem<boolean>(SHOW_REPORT_PERCENTAGE),
        storage.getItem<boolean>(ENABLE_DISCORD_INTEGRATION),
        storage.getItem<boolean>(ENABLE_REDDIT_INTEGRATION),
        storage.getItem<boolean>(ENABLE_WGU_CONNECT_INTEGRATION),
        storage.getItem<boolean>(ENABLE_COURSE_COMMUNITIES)
      ]);

      setSettings({
        // Data collection settings
        dataCollectionEnabled: dataCollection,
        discordCollectionEnabled: discord,
        wguConnectCollectionEnabled: wguConnect,
        // Feature settings with defaults
        showReportPercent: showReportValue ?? true,
        enableDiscord: discordValue ?? true,
        enableReddit: redditValue ?? false,
        enableWguConnect: wguConnectValue ?? true,
        enableCourseCommunities: courseCommunitiesValue ?? true,
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
        // Data collection settings
        dataCollectionEnabled.setValue(settings.dataCollectionEnabled),
        discordCollectionEnabled.setValue(settings.discordCollectionEnabled),
        wguConnectCollectionEnabled.setValue(settings.wguConnectCollectionEnabled),
        // Feature settings
        storage.setItem<boolean>(SHOW_REPORT_PERCENTAGE, settings.showReportPercent),
        storage.setItem<boolean>(ENABLE_DISCORD_INTEGRATION, settings.enableDiscord),
        storage.setItem<boolean>(ENABLE_REDDIT_INTEGRATION, settings.enableReddit),
        storage.setItem<boolean>(ENABLE_WGU_CONNECT_INTEGRATION, settings.enableWguConnect),
        storage.setItem<boolean>(ENABLE_COURSE_COMMUNITIES, settings.enableCourseCommunities),
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

  const handleFeatureToggle = (key: string, enabled: boolean) => {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Unofficial WGU Extension Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure extension features, integrations, and data collection preferences
            </p>
          </div>
          <ModeToggle />
        </div>

        {/* WGU Features */}
        <Card>
          <CardHeader>
            <CardTitle>WGU Features</CardTitle>
            <CardDescription>
              Core extension features for enhancing your WGU experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="show-report-percent" className="font-medium">
                  Show Test Report Percentages
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display percentage scores on test reports and coaching reports
                </p>
              </div>
              <Switch
                id="show-report-percent"
                checked={settings.showReportPercent}
                onCheckedChange={(enabled) => handleFeatureToggle('showReportPercent', enabled)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="course-communities" className="font-medium">
                  Course Communities Sidebar
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show community links and search options in course details pages
                </p>
              </div>
              <Switch
                id="course-communities"
                checked={settings.enableCourseCommunities}
                onCheckedChange={(enabled) => handleFeatureToggle('enableCourseCommunities', enabled)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Community Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Community Integrations</CardTitle>
            <CardDescription>
              Connect with WGU communities across different platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="discord-integration" className="font-medium">
                  Discord Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enhanced features when visiting WGU Discord servers
                </p>
              </div>
              <Switch
                id="discord-integration"
                checked={settings.enableDiscord}
                onCheckedChange={(enabled) => handleFeatureToggle('enableDiscord', enabled)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="reddit-integration" className="font-medium">
                  Reddit Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enhanced features when visiting WGU-related subreddits
                </p>
              </div>
              <Switch
                id="reddit-integration"
                checked={settings.enableReddit}
                onCheckedChange={(enabled) => handleFeatureToggle('enableReddit', enabled)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label htmlFor="wgu-connect-integration" className="font-medium">
                  WGU Connect Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enhanced features when using WGU Connect platform
                </p>
              </div>
              <Switch
                id="wgu-connect-integration"
                checked={settings.enableWguConnect}
                onCheckedChange={(enabled) => handleFeatureToggle('enableWguConnect', enabled)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Collection Settings */}
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
                    <Label htmlFor="discord-collection" className="font-medium">
                      Discord Server Data
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Collect information about WGU-related Discord servers and channels to help students find study groups and resources.
                    </p>
                  </div>
                  <Switch
                    id="discord-collection"
                    checked={settings.discordCollectionEnabled}
                    onCheckedChange={(enabled) => handleSubToggle('discordCollectionEnabled', enabled)}
                  />
                </div>

                {/* WGU Connect Collection */}
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="wgu-connect-collection" className="font-medium">
                      WGU Connect Resources
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Collect information about community resources, study materials, and group content from WGU Connect.
                    </p>
                  </div>
                  <Switch
                    id="wgu-connect-collection"
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
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}