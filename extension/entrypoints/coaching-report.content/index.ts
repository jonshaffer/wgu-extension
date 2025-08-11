import { storage } from "@wxt-dev/storage";
import { SHOW_REPORT_PERCENTAGE } from "@/utils/storage.constants";

import "./printstyles.css";

export default defineContentScript({
  // matches like https://my.wgu.edu/coaching-report/
  matches: ['https://my.wgu.edu/coaching-report/*'],
  runAt: 'document_end',

  registration: "manifest",

  main(_ctx) {
    const checkIfVisible = () => {
      const assessment = document.querySelector('cr-assessment');
      if (assessment) {
        const style = window.getComputedStyle(assessment);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return true;
        }
      }
      return false;
    };

    const interval = setInterval(() => {
      storage.getItem<boolean>(SHOW_REPORT_PERCENTAGE).then((val) => {
        if (!val) return;
        
        if (checkIfVisible()) {
          clearInterval(interval);
          labelProgressBars();
        }
      })
    }, 1000);

    function labelProgressBars() {
      const progressBar = document.querySelectorAll('.cr-progress-bar');

      for (let i = 0; i < progressBar.length; i++) {
        const lpb = progressBar[i];
        const progressBarValue = lpb.querySelector('.progress .value');

        if (progressBarValue) {
          // @ts-expect-error
          const right = progressBarValue.style.right;
          const percentage = 100 - parseFloat(right);
          const label = lpb.parentElement?.parentElement?.querySelector('.cr-progress-bar-label span') || lpb.parentElement?.parentElement?.parentElement?.querySelector('.cr-assessment-score-label');
          
          if (label) {
            const span = document.createElement('span');
            span.className = 'wgu-ext-percentage';
            span.dataset.source = 'wgu-extension';
            span.textContent = ` (${percentage}%)`;

            label.appendChild(span);
          }
        }
      }
    }

  },
});
