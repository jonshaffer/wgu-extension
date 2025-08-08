import React from 'react';
import { WguExpansionPanel } from './WguExpansionPanel';

interface CommunityLink {
  type: 'discord' | 'reddit' | 'wgu-connect';
  name: string;
  url: string;
  icon: string; // SVG string
}

interface CommunitiesPanelProps {
  courseCode: string;
  communities: CommunityLink[];
  defaultExpanded?: boolean;
}

export function CommunitiesPanel({ 
  courseCode, 
  communities, 
  defaultExpanded = false 
}: CommunitiesPanelProps) {
  const renderCommunityLink = (community: CommunityLink, index: number) => (
    <div key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
      <span 
        dangerouslySetInnerHTML={{ __html: community.icon }}
        style={{ marginRight: '4px' }}
      />
      <a 
        href={community.url} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          color: '#0073e6', 
          textDecoration: 'none',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }}
      >
        {community.name}
      </a>
    </div>
  );

  const content = communities.length > 0 ? (
    <div>
      {communities.map((community, index) => renderCommunityLink(community, index))}
    </div>
  ) : (
    <div 
      style={{ 
        color: '#666', 
        fontSize: '14px', 
        textAlign: 'center', 
        padding: '10px 0',
        fontStyle: 'italic'
      }}
    >
      No communities found for {courseCode}
    </div>
  );

  return (
    <WguExpansionPanel
      title="Communities"
      defaultExpanded={defaultExpanded}
      id={`wgu-communities-panel-${courseCode.toLowerCase()}`}
    >
      {content}
    </WguExpansionPanel>
  );
}

export default CommunitiesPanel;