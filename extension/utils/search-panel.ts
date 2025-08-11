interface SearchResource {
  name: string;
  url: string;
  icon: string;
  description?: string;
}

const SEARCH_RESOURCES: SearchResource[] = [
  {
    name: 'Course Search',
    url: 'https://srm--c.na13.visual.force.com/apex/FDP/CommonsExpandedSearch?courseCode={COURSE_CODE}',
    icon: '🔍',
    description: 'Official WGU Course Search'
  },
  {
    name: 'Reddit Search',
    url: 'https://www.reddit.com/search/?q=WGU%20{COURSE_CODE}&type=sr%2Cuser',
    icon: '📱',
    description: 'Search Reddit for course discussions'
  },
  {
    name: 'YouTube Study Videos',
    url: 'https://www.youtube.com/results?search_query=WGU+{COURSE_CODE}',
    icon: '📺',
    description: 'Find study videos on YouTube'
  },
  {
    name: 'Discord Communities',
    url: 'https://discord.gg/unwgu',
    icon: '💬',
    description: 'Join WGU Discord communities'
  }
];

export function createSearchPanel(courseCode: string, showDefaultSearch = true): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.id = 'wgu-ext-search-panel-wrapper';
  wrapper.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: rgba(0, 0, 0, 0.87);
    background: white;
    border-radius: 4px;
    box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
    padding: 16px;
    margin-top: 12px;
  `;

  const searchButtons = SEARCH_RESOURCES.map(resource => {
    const url = resource.url.replace(/{COURSE_CODE}/g, courseCode);
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="course-btns" style="
        display: inline-block;
        background: #1976d2;
        color: white;
        padding: 8px 16px;
        margin: 4px 8px 4px 0;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.3s ease;
        cursor: pointer;
      " onmouseover="this.style.backgroundColor='#1565c0'" onmouseout="this.style.backgroundColor='#1976d2'">
        <span style="margin-right: 8px;">${resource.icon}</span>
        ${resource.name}
      </a>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div style="margin-bottom: 12px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: rgba(0, 0, 0, 0.87);">
        Enhanced Search for ${courseCode}
      </h3>
      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
        ${searchButtons}
      </div>
    </div>
  `;

  return wrapper;
}