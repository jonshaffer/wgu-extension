import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ExternalLink, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function App() {
  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  const openGitHub = () => {
    chrome.tabs.create({ 
      url: 'https://github.com/jonshaffer/wgu-extension' 
    });
  };

  return (
    <div className="min-w-[320px] min-h-[400px] p-4">
      <Card className="h-full">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Unofficial WGU Extension</CardTitle>
          <CardDescription>
            Enhance your WGU experience with community features and integrations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              onClick={openOptionsPage}
              variant="default"
              size="sm"
              className="w-full justify-start"
            >
              <Settings className="mr-2 h-4 w-4" />
              Extension Settings
            </Button>
            
            <Button 
              onClick={openGitHub}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Button>
          </div>

          <Separator />

          {/* Quick Info */}
          <div className="space-y-3 text-sm">
            <div className="text-center text-muted-foreground">
              <p><strong>🚀 Features Active:</strong></p>
              <div className="mt-2 space-y-1 text-xs">
                <p>• Course communities & search</p>
                <p>• Test report enhancements</p>
                <p>• Community integrations</p>
                <p>• Privacy-focused data collection</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-center text-muted-foreground text-xs">
              <p>Configure all settings in the Options page</p>
              <p className="mt-1">Unofficial tool by WGU students, for WGU students</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
