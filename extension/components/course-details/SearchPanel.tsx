import React, { useState, useEffect } from 'react';
import { SearchButton } from './SearchButton';
import { loadCommunityData } from '@/utils/community-data';
import type { CourseCommunitiesMappings } from '@/types/community-data';

interface SearchOption {
  id: string;
  name: string;
  url: string;
  icon?: string;
  color?: string;
}

interface CommunityLink {
  type: 'discord' | 'reddit' | 'wgu-connect' | 'wgu-student-groups';
  name: string;
  url: string;
  description?: string;
}

interface CourseData {
  discord: CommunityLink[];
  reddit: CommunityLink[];
  wguConnect: CommunityLink[];
  wguStudentGroups: CommunityLink[];
}

interface SearchPanelProps {
  courseCode: string;
  searchOptions?: SearchOption[];
  showDefaultSearch?: boolean;
  showCourseSpecificSearch?: boolean;
  style?: React.CSSProperties;
}

// Default search icons
const SEARCH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 14px; width: 14px; display: inline-block; fill: currentColor;"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>`;

const DISCORD_SEARCH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" style="height: 12px; width: 12px; display: inline-block; fill: currentColor;"><path d="M524.5 69.8a1.5 1.5 0 0 0 -.8-.7A485.1 485.1 0 0 0 404.1 32a1.8 1.8 0 0 0 -1.9 .9 337.5 337.5 0 0 0 -14.9 30.6 447.8 447.8 0 0 0 -134.4 0 309.5 309.5 0 0 0 -15.1-30.6 1.9 1.9 0 0 0 -1.9-.9A483.7 483.7 0 0 0 116.1 69.1a1.7 1.7 0 0 0 -.8 .7C39.1 183.7 18.2 294.7 28.4 404.4a2 2 0 0 0 .8 1.4A487.7 487.7 0 0 0 176 479.9a1.9 1.9 0 0 0 2.1-.7A348.2 348.2 0 0 0 208.1 430.4a1.9 1.9 0 0 0 -1-2.6 321.2 321.2 0 0 1 -45.9-21.9 1.9 1.9 0 0 1 -.2-3.1c3.1-2.3 6.2-4.7 9.1-7.1a1.8 1.8 0 0 1 1.9-.3c96.2 43.9 200.4 43.9 295.5 0a1.8 1.8 0 0 1 1.9 .2c2.9 2.4 6 4.9 9.1 7.2a1.9 1.9 0 0 1 -.2 3.1 301.4 301.4 0 0 1 -45.9 21.8 1.9 1.9 0 0 0 -1 2.6 391.1 391.1 0 0 0 30 48.8 1.9 1.9 0 0 0 2.1 .7A486 486 0 0 0 610.7 405.7a1.9 1.9 0 0 0 .8-1.4C623.7 277.6 590.9 167.5 524.5 69.8zM222.5 337.6c-29 0-52.8-26.6-52.8-59.2S193.1 219.1 222.5 219.1c29.7 0 53.3 26.8 52.8 59.2C275.3 311 251.9 337.6 222.5 337.6zm195.4 0c-29 0-52.8-26.6-52.8-59.2S388.4 219.1 417.9 219.1c29.7 0 53.3 26.8 52.8 59.2C470.7 311 447.5 337.6 417.9 337.6z"></path></svg>`;

const REDDIT_SEARCH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="height: 12px; width: 12px; display: inline-block; fill: currentColor;"><path d="M64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32zM305.9 166.4c20.6 0 37.3-16.7 37.3-37.3s-16.7-37.3-37.3-37.3c-18 0-33.1 12.8-36.6 29.8c-30.2 3.2-53.8 28.8-53.8 59.9l0 .2c-32.8 1.4-62.8 10.7-86.6 25.5c-8.8-6.8-19.9-10.9-32-10.9c-28.9 0-52.3 23.4-52.3 52.3c0 21 12.3 39 30.1 47.4c1.7 60.7 67.9 109.6 149.3 109.6s147.6-48.9 149.3-109.7c17.7-8.4 29.9-26.4 29.9-47.3c0-28.9-23.4-52.3-52.3-52.3c-12 0-23 4-31.9 10.8c-24-14.9-54.3-24.2-87.5-25.4l0-.1c0-22.2 16.5-40.7 37.9-43.7l0 0c3.9 16.5 18.7 28.7 36.3 28.7zM155 248.1c14.6 0 25.8 15.4 25 34.4s-11.8 25.9-26.5 25.9s-27.5-7.7-26.6-26.7s13.5-33.5 28.1-33.5zm166.4 33.5c.9 19-12 26.7-26.6 26.7s-25.6-6.9-26.5-25.9c-.9-19 10.3-34.4 25-34.4s27.3 14.6 28.1 33.5zm-42.1 49.6c-9 21.5-30.3 36.7-55.1 36.7s-46.1-15.1-55.1-36.7c-1.1-2.6 .7-5.4 3.4-5.7c16.1-1.6 33.5-2.5 51.7-2.5s35.6 .9 51.7 2.5c2.7 .3 4.5 3.1 3.4 5.7z"></path></svg>`;

const WGU_CONNECT_SEARCH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: 12px; width: 12px; display: inline-block; fill: currentColor;"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9H21ZM21 10H9V15H12V22H15V18H18V22H21V10Z"></path></svg>`;

export function SearchPanel({ 
  courseCode, 
  searchOptions = [], 
  showDefaultSearch = true,
  showCourseSpecificSearch = true,
  style = {}
}: SearchPanelProps) {
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load course-specific community data from unified dataset
  useEffect(() => {
    async function loadCourseData() {
      try {
        setIsLoading(true);
        const { unifiedData } = await loadCommunityData();
        const mapping: CourseCommunitiesMappings | undefined = (unifiedData?.courseMappings || []).find((m) => (m.courseCode || '').toLowerCase() === courseCode.toLowerCase());
        if (mapping) {
          setCourseData({
            discord: mapping.discord || [],
            reddit: mapping.reddit || [],
            wguConnect: mapping.wguConnect || [],
            wguStudentGroups: mapping.wguStudentGroups || [],
          });
        } else {
          console.log(`No unified mapping found for ${courseCode}`);
          setCourseData({ discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] });
        }
      } catch (error) {
        console.error(`Error loading course data for ${courseCode}:`, error);
        setCourseData({ discord: [], reddit: [], wguConnect: [], wguStudentGroups: [] });
      } finally {
        setIsLoading(false);
      }
    }

    loadCourseData();
  }, [courseCode]);
  // Generate course-specific search options based on available communities
  const generateCourseSpecificSearchOptions = (): SearchOption[] => {
    if (!courseData) return [];
    
    const options: SearchOption[] = [];
    
    // Discord channel searches (if course has Discord channels)
    if (courseData.discord && courseData.discord.length > 0) {
      courseData.discord.forEach((discord, index) => {
        // Extract server ID and channel ID from Discord URL
        const serverMatch = discord.url.match(/discord\.gg\/(.+)/) || discord.url.match(/discord\.com\/channels\/(\d+)/);
        if (serverMatch) {
          const serverId = serverMatch[1] === 'wgu-cs' ? '1063853854413836499' : serverMatch[1];
          options.push({
            id: `discord-${index}`,
            name: `Search ${discord.name}`,
            url: `https://discord.com/channels/${serverId}`,
            icon: DISCORD_SEARCH_ICON_SVG,
            color: '#5865F2'
          });
        }
      });
    }
    
    // WGU Connect searches (direct links to groups)
    if (courseData.wguConnect && courseData.wguConnect.length > 0) {
      courseData.wguConnect.forEach((wguConnect, index) => {
        options.push({
          id: `wgu-connect-${index}`,
          name: `Open ${wguConnect.name}`,
          url: wguConnect.url,
          icon: WGU_CONNECT_SEARCH_ICON_SVG,
          color: '#0073e6'
        });
      });
    }
    
    return options;
  };

  const defaultSearchOptions: SearchOption[] = [
    {
      id: 'wgu-course-search',
      name: 'Course Search',
      url: `https://srm--c.na13.visual.force.com/apex/FDP/CommonsExpandedSearch?courseCode=${courseCode}`,
      icon: SEARCH_ICON_SVG,
      color: '#0073e6'
    },
    {
      id: 'reddit-search',
      name: 'Search Reddit',
      url: `https://www.reddit.com/r/WGU/search/?q=${courseCode}&type=link&cId=8a50c45c-fe21-4584-8009-f4c7b5c6b5a9&iId=87bfd7c2-63bf-469a-9d98-f4b50c6b4c84`,
      icon: REDDIT_SEARCH_ICON_SVG,
      color: '#FF4500'
    },
    {
      id: 'wgu-connect-general-search',
      name: 'Search Connect',
      url: `https://wguconnect.wgu.edu/search?q=${courseCode}`,
      icon: WGU_CONNECT_SEARCH_ICON_SVG,
      color: '#0073e6'
    }
  ];

  // Combine all search options
  const courseSpecificOptions = showCourseSpecificSearch ? generateCourseSpecificSearchOptions() : [];
  const allSearchOptions = [
    ...(showDefaultSearch ? defaultSearchOptions : []),
    ...courseSpecificOptions,
    ...searchOptions
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    ...style
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#666', 
          fontSize: '14px' 
        }}>
          Loading search options...
        </div>
      </div>
    );
  }

  if (allSearchOptions.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#666', 
          fontSize: '14px' 
        }}>
          No search options available for {courseCode}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {allSearchOptions.map((option) => (
        <SearchButton
          key={option.id}
          href={option.url}
          icon={option.icon}
          style={{
            backgroundColor: option.color || '#0073e6',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {option.name}
        </SearchButton>
      ))}
    </div>
  );
}

export default SearchPanel;