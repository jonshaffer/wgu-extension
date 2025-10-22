import "./printstyles.css";

export default defineContentScript({
  // matches like https://tasks.wgu.edu/student/123/course/456/task/789/overview
  matches: ['https://tasks.wgu.edu/student/*/course/*/task/*/overview'],
  runAt: 'document_end',

  registration: "manifest",

  main(_ctx) {
    // No JavaScript logic needed - the CSS handles the print formatting
  },
});