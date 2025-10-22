# WGU Extension - Website Workspace

**React Router website** providing public documentation and community resources for the WGU Extension.

## Workspace Overview

This workspace contains the public website built with React Router v7 for documentation, community listings, and extension downloads.

## Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Production server
npm run start
```

## Architecture

### React Router v7
- **File-based Routing**: Routes defined in `app/routes/`
- **Server-Side Rendering**: Full SSR with hydration
- **Type Safety**: Automatic route type generation

### Project Structure
```
app/
├── routes/           # Route components
│   └── home.tsx     # Landing page
├── lib/             # Utilities and configs
├── app.css          # Global styles
├── root.tsx         # Root layout
└── routes.ts        # Route definitions
```

## Development

### Local Development
```bash
# Start dev server with hot reload
npm run dev

# Visit: http://localhost:5173
```

### Type Generation
```bash
# Generate route types
npm run typecheck
```

### Styling
- **Tailwind CSS 4.x**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Motion**: Animation library for interactions

## Features

### Landing Page (`routes/home.tsx`)
- Extension overview and benefits
- Download links for different browsers
- Community resource highlights
- Getting started guide

### Search Interface
- **SearchResults.tsx**: Display community resources
- **Spotlight.tsx**: Featured content component
- Integration with Firebase for dynamic data

## Firebase Integration

### Configuration (`app/lib/firebase.ts`)
- **Firestore**: Real-time community data
- **Analytics**: Usage tracking
- **Hosting**: Static site deployment

### Data Fetching
```typescript
// Example route loader
export async function loader() {
  const communities = await getCommunityData();
  return { communities };
}
```

## Deployment

### Production Build
```bash
# Build static site
npm run build

# Output in build/ directory
```

### Hosting Options
1. **Firebase Hosting**: Configured in root `firebase.json`
2. **Vercel/Netlify**: React Router SSR support
3. **Docker**: Included `Dockerfile` for containerization

## Docker Support

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## SEO & Performance

### Meta Tags
- Dynamic meta tags per route
- Open Graph integration
- Twitter Card support

### Performance
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Caching**: Aggressive caching for static assets

## Content Management

### Static Content
- Documentation in Markdown format
- Community data fetched from Firebase
- Extension metadata from package.json

### Dynamic Content
- Real-time community statistics
- Extension download analytics
- User feedback integration

## Testing

### Development Testing
1. Start dev server: `npm run dev`
2. Test responsive design at different screen sizes
3. Verify SSR by disabling JavaScript
4. Check accessibility with screen reader

### Production Testing
```bash
# Build and serve locally
npm run build
npm run start

# Load testing
# SEO audit with Lighthouse
```

## Analytics

### Firebase Analytics
- Page views and user journeys
- Extension download tracking
- Community resource engagement

### Performance Monitoring
- Core Web Vitals tracking
- Error boundary reporting
- Load time optimization