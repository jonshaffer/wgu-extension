import { Checkbox } from '@/components/ui/checkbox';
import { SHOW_REPORT_PERCENTAGE } from '@/utils/storage.constants';
import { storage } from '@wxt-dev/storage';
import { toast } from 'sonner';

function App() {
  const [showReportPercent, setShowReportPercent] = useState<boolean>(true);

  useEffect(() => {
    storage.getItem<boolean>(SHOW_REPORT_PERCENTAGE).then((value) => {
      if (value !== undefined) {
        setShowReportPercent(!!value);
      }
    });

    const unwatch = storage.watch<boolean>(SHOW_REPORT_PERCENTAGE, (newSCP, _oldSCP) => {
      setShowReportPercent(newSCP || true);
    });

    return () => {
      unwatch();
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

  return (
    <div className='min-w-[300px] min-h-[300px] flex flex-col items-center justify-center gap-4 p-4'>
      <div className="flex items-center space-x-2">
        <Checkbox id="checkbox" defaultChecked={true} checked={showReportPercent} onCheckedChange={setNewShowReportPercent} />
        <label htmlFor="checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Show Test Report %
        </label>
      </div>
      <ModeToggle />
    </div>
  );
}

export default App;
