import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { SHOW_REPORT_PERCENTAGE, ENABLE_DISCORD_INTEGRATION, ENABLE_REDDIT_INTEGRATION, ENABLE_WGU_CONNECT_INTEGRATION, ENABLE_COURSE_COMMUNITIES } from '@/utils/storage.constants';
import { storage } from '@wxt-dev/storage';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { ModeToggle } from '@/components/mode-toggle';

function App() {
  const [showReportPercent, setShowReportPercent] = useState<boolean>(true);
  const [enableDiscord, setEnableDiscord] = useState<boolean>(true);
  const [enableReddit, setEnableReddit] = useState<boolean>(false);
  const [enableWguConnect, setEnableWguConnect] = useState<boolean>(true);
  const [enableCourseCommunities, setEnableCourseCommunities] = useState<boolean>(true);

  useEffect(() => {
    // Load initial values
    Promise.all([
      storage.getItem<boolean>(SHOW_REPORT_PERCENTAGE),
      storage.getItem<boolean>(ENABLE_DISCORD_INTEGRATION),
      storage.getItem<boolean>(ENABLE_REDDIT_INTEGRATION),
      storage.getItem<boolean>(ENABLE_WGU_CONNECT_INTEGRATION),
      storage.getItem<boolean>(ENABLE_COURSE_COMMUNITIES)
    ]).then(([showReportValue, discordValue, redditValue, wguConnectValue, courseCommunitiesValue]) => {
      if (showReportValue !== undefined) {
        setShowReportPercent(!!showReportValue);
      }
      if (discordValue !== undefined) {
        setEnableDiscord(!!discordValue);
      } else {
        setEnableDiscord(true); // Default to enabled
      }
      if (redditValue !== undefined) {
        setEnableReddit(!!redditValue);
      } else {
        setEnableReddit(false); // Default to disabled
      }
      if (wguConnectValue !== undefined) {
        setEnableWguConnect(!!wguConnectValue);
      } else {
        setEnableWguConnect(true); // Default to enabled
      }
      if (courseCommunitiesValue !== undefined) {
        setEnableCourseCommunities(!!courseCommunitiesValue);
      } else {
        setEnableCourseCommunities(true); // Default to enabled
      }
    });

    // Watch for changes
    const unwatchShowReport = storage.watch<boolean>(SHOW_REPORT_PERCENTAGE, (newVal) => {
      setShowReportPercent(newVal || true);
    });
    const unwatchDiscord = storage.watch<boolean>(ENABLE_DISCORD_INTEGRATION, (newVal) => {
      setEnableDiscord(newVal || false);
    });
    const unwatchReddit = storage.watch<boolean>(ENABLE_REDDIT_INTEGRATION, (newVal) => {
      setEnableReddit(newVal || false);
    });
    const unwatchWguConnect = storage.watch<boolean>(ENABLE_WGU_CONNECT_INTEGRATION, (newVal) => {
      setEnableWguConnect(newVal || false);
    });
    const unwatchCourseCommunities = storage.watch<boolean>(ENABLE_COURSE_COMMUNITIES, (newVal) => {
      setEnableCourseCommunities(newVal || false);
    });

    return () => {
      unwatchShowReport();
      unwatchDiscord();
      unwatchReddit();
      unwatchWguConnect();
      unwatchCourseCommunities();
    }
  }, []);

  const setNewShowReportPercent = () => {
    const newVal = !showReportPercent;

    storage.setItem<boolean>(SHOW_REPORT_PERCENTAGE, newVal).then(() => {
      setShowReportPercent(newVal);
    });

    if (newVal === false) {
      toast("Refresh the page to remove Test Report %'s");
    }
  }

  const setNewDiscordEnabled = () => {
    const newVal = !enableDiscord;
    storage.setItem<boolean>(ENABLE_DISCORD_INTEGRATION, newVal).then(() => {
      setEnableDiscord(newVal);
    });

    if (newVal === false) {
      toast("Discord integration disabled. Refresh Discord pages to remove features.");
    } else {
      toast("Discord integration enabled. Refresh Discord pages to activate features.");
    }
  }

  const setNewRedditEnabled = () => {
    const newVal = !enableReddit;
    storage.setItem<boolean>(ENABLE_REDDIT_INTEGRATION, newVal).then(() => {
      setEnableReddit(newVal);
    });

    if (newVal === false) {
      toast("Reddit integration disabled. Refresh Reddit pages to remove features.");
    } else {
      toast("Reddit integration enabled. Refresh Reddit pages to activate features.");
    }
  }

  const setNewWguConnectEnabled = () => {
    const newVal = !enableWguConnect;
    storage.setItem<boolean>(ENABLE_WGU_CONNECT_INTEGRATION, newVal).then(() => {
      setEnableWguConnect(newVal);
    });

    if (newVal === false) {
      toast("WGU Connect integration disabled. Refresh WGU Connect to remove features.");
    } else {
      toast("WGU Connect integration enabled. Refresh WGU Connect to activate features.");
    }
  }

  const setNewCourseCommunitiesEnabled = () => {
    const newVal = !enableCourseCommunities;
    storage.setItem<boolean>(ENABLE_COURSE_COMMUNITIES, newVal).then(() => {
      setEnableCourseCommunities(newVal);
    });

    if (newVal === false) {
      toast("Course communities disabled. Refresh course pages to remove sidebar section.");
    } else {
      toast("Course communities enabled. Refresh course pages to show sidebar section.");
    }
  }

  return (
    <div className='min-w-[300px] min-h-[400px] flex flex-col gap-6 p-4'>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">WGU Features</h3>
        <div className="flex items-center space-x-2">
          <Checkbox id="show-report-percent" checked={showReportPercent} onCheckedChange={setNewShowReportPercent} />
          <label htmlFor="show-report-percent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Show Test Report %
          </label>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Community Integration</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-discord" checked={enableDiscord} onCheckedChange={setNewDiscordEnabled} />
            <label htmlFor="enable-discord" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Discord Integration
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-reddit" checked={enableReddit} onCheckedChange={setNewRedditEnabled} />
            <label htmlFor="enable-reddit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Reddit Integration
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-wgu-connect" checked={enableWguConnect} onCheckedChange={setNewWguConnectEnabled} />
            <label htmlFor="enable-wgu-connect" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              WGU Connect Integration
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-course-communities" checked={enableCourseCommunities} onCheckedChange={setNewCourseCommunitiesEnabled} />
            <label htmlFor="enable-course-communities" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Course Communities Sidebar
            </label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-center">
        <ModeToggle />
      </div>
    </div>
  );
}

export default App;
