# WGU Extension Site

React Router website for the WGU Extension project.

## Features

- 🚀 SPA mode (no SSR) for fast client-side navigation
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 GraphQL integration with Apollo Client
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 🔍 Community resource search

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### GraphQL Endpoint Configuration

During development, you can configure which GraphQL endpoint to use:

1. **Use Local Emulator (default)**:
   ```bash
   # No configuration needed, or create .env with:
   VITE_GRAPHQL_ENV=local
   ```

2. **Use Production GraphQL**:
   ```bash
   # Create .env file with:
   VITE_GRAPHQL_ENV=production
   ```

3. **Use Custom Endpoint**:
   ```bash
   # Create .env file with:
   VITE_GRAPHQL_ENDPOINT=https://your-custom-endpoint.com/graphql
   ```

### Environment Variables

Copy `.env.example` to `.env` to get started:

```bash
cp .env.example .env
```

Available variables:
- `VITE_GRAPHQL_ENV`: Set to "production" or "local" (default: "local")
- `VITE_GRAPHQL_ENDPOINT`: Override the GraphQL endpoint URL entirely

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
