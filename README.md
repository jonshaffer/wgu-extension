# Unofficial WGU Extension Monorepo

**Unofficial WGU Extension** - Adds simple UI changes to WGU pages. Student-made tool for WGU students. Not endorsed by WGU.

This is a monorepo containing:
- **extension/**: Browser extension built with WXT framework
- **functions/**: Firebase Cloud Functions for backend services  
- **site/**: React Router website for public documentation
- **data/**: Data collection and processing scripts

## 📋 Project Specifications

This project follows [GitHub Spec Kit](https://github.com/github/spec-kit) principles for specification-driven development:

- **🏛️ [Project Constitution](.specify/memory/constitution.md)** - Core principles, standards, and decision-making processes
- **📋 [Feature Specifications](.specify/features/)** - Detailed specifications for major features:
  - [Community Data Integration](.specify/features/community-data-integration.md)
  - [Course Enhancement](.specify/features/course-enhancement.md)
  - [Search Functionality](.specify/features/search-functionality.md) 
  - [Data Processing Pipeline](.specify/features/data-processing-pipeline.md)
- **📝 [Templates](.specify/templates/)** - Templates for new specifications and decisions

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev:extension    # Browser extension with hot reload
npm run dev:functions    # Firebase functions emulator
npm run dev:site        # Documentation website

# Build everything
npm run build
```

## 📦 Data Version Control (DVC)

This repository uses DVC (Data Version Control) to manage large files and raw data. All catalog files, PDFs, and raw community data are stored in Google Drive and tracked via DVC to keep the Git repository size manageable.

### Initial Setup

1. **Install DVC** (if not using Nix flake):
   ```bash
   pip install dvc[gdrive]
   ```

2. **Pull data files**:
   ```bash
   dvc pull
   ```
   
   On first run, DVC will:
   - Open your browser for Google authentication
   - Request permission to access Google Drive
   - Cache credentials for future use
   
   **Note**: No setup required for read-only access. The OAuth2 flow handles authentication automatically.

### Working with DVC-Managed Files

DVC manages several types of files:
- **Catalog JSON files**: Large parsed catalog data
- **PDF files**: WGU catalog PDFs  
- **Raw data**: Community data from Discord, Reddit, WGU Connect, etc.

- **Before building or running scripts**: Always run `dvc pull` to ensure you have the latest files
- **Automatic pulling**: Build scripts include DVC pull commands where needed
- **Manual pulling**: Run `npm run catalog:ensure --workspace=data` 

### For Contributors

When modifying catalog files:
1. Make your changes to the JSON files
2. The files are already tracked by DVC, so changes will be detected
3. Commit the `.dvc` files along with your code changes
4. Push catalog file changes to DVC remote after validation:
   ```bash
   dvc push
   ```

## 🏗️ Project Structure

```
wgu-extension/
├── extension/                 # Browser extension (WXT)
│   ├── data/                 # Community data collection & processing
│   │   ├── catalogs/         # WGU catalog parsing & storage (DVC-managed)
│   │   ├── discord/          # Discord server data collection
│   │   ├── reddit/           # Reddit community data collection
│   │   ├── wgu-connect/      # WGU Connect resource extraction
│   │   └── unified/          # Unified community data
│   ├── components/           # React components (Radix UI + Tailwind)
│   ├── entrypoints/          # WXT entry points for different contexts
│   ├── packages/types/       # Shared TypeScript types (published to npm)
│   └── public/               # Static community/course data
├── functions/                # Firebase Cloud Functions
│   └── src/                  # TypeScript source for HTTP endpoints
└── site/                     # React Router website
    └── app/                  # Routes and components
```

## 🛠️ Development

### Prerequisites

- Node.js 22+ and npm 10+
- Git
- DVC (installed automatically with Nix flake or via pip)

### Nix Development Environment (Recommended)

```bash
# Enter development shell with all tools
nix develop

# Or use direnv for automatic environment loading
direnv allow
```

### Build Commands

See individual workspace READMEs for detailed commands:
- [Extension README](./extension/README.md)
- [Functions README](./functions/README.md)
- [Site README](./site/README.md)

## 📊 Data Processing Pipeline

The extension includes comprehensive data collection from:
- WGU course catalogs (PDF parsing)
- Discord community servers
- Reddit WGU communities
- WGU Connect study groups

### Catalog Data Management

Catalog JSON files are large (several MB each) and are managed with DVC:

```bash
# Ensure catalog files are available
npm run catalog:ensure --workspace=data

# Process new catalogs
npm run catalog:parse --workspace=data <pdf-file>

# Generate reports
npm run catalog:report --workspace=data
```

## 🔐 Security

- No personal data collection
- Minimal browser permissions
- Secure Firebase rules
- Rate limiting on API endpoints

## 🤝 Contributing

This project follows specification-driven development. For new features:

1. **Review the [Project Constitution](.specify/memory/constitution.md)** for standards and principles
2. **Create or review feature specifications** in `.specify/features/` before implementation
3. **Use provided templates** in `.specify/templates/` for consistency

### Development Process
1. Fork the repository
2. Create a feature branch
3. Run `dvc pull` to get catalog files
4. Review relevant specifications and create new ones if needed
5. Make your changes following the project constitution
6. Run tests and linting (`npm run typecheck` and `npm run lint`)
7. Submit a pull request with links to relevant specifications

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This is an unofficial tool created by WGU students. It is not endorsed by or affiliated with Western Governors University.