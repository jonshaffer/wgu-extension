{
  description = "WGU Extension development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and package managers
            nodejs_22
            nodePackages.npm
            nodePackages.pnpm
            nodePackages.yarn

            # Development tools
            google-cloud-sdk  # Includes gcloud CLI
            firebase-tools
            nodePackages.typescript
            nodePackages.typescript-language-server
            nodePackages.vscode-langservers-extracted
            nodePackages.prettier
            nodePackages.eslint
            poppler # PDF rendering library - for manipulating and extracting information from PDFs
            poppler-utils # PDF utilities for working with PDF files

            # Git and version control
            git
            gh  # GitHub CLI
            dvc # Data Version Control for large files (PDFs, JSON)
            
            # Python for DVC plugins
            python3
            python3Packages.pip

            # General development utilities
            jq          # JSON processing
            curl        # HTTP requests
            tree        # Directory tree visualization
            ripgrep     # Better grep
            fd          # Better find
          ];

          shellHook = ''
            echo "🚀 WGU Extension Development Environment"
            echo "📦 Node.js version: $(node --version)"
            echo "📦 npm version: $(npm --version)"
            echo "📦 DVC version: $(dvc --version 2>/dev/null || echo "not available")"
            echo ""
            echo "Available commands:"
            echo "  npm install     - Install dependencies"
            echo "  npm run dev     - Start development server"
            echo "  npm run build   - Build extension"
            echo "  gh pr view      - View current PR"
            echo "  dvc init        - Initialize DVC"
            echo "  dvc add         - Track files with DVC"
            echo "  dvc pull        - Pull data from DVC"
            echo ""
            
            # Ensure node_modules/.bin is in PATH
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            # Set up npm to use local cache
            export npm_config_cache="$PWD/.npm-cache"
            mkdir -p .npm-cache
            
            # Set up Python environment for DVC plugins
            export PYTHONPATH="$PWD/.python-env/lib/python$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)/site-packages:$PYTHONPATH"
            export PATH="$PWD/.python-env/bin:$PATH"
            
            # Install DVC Google Drive plugin if not already installed
            if ! python3 -c "import dvc_gdrive" 2>/dev/null; then
              echo "📦 Installing DVC Google Drive plugin..."
              python3 -m venv .python-env
              .python-env/bin/pip install --quiet dvc-gdrive
              echo "✅ DVC Google Drive plugin installed"
            fi
          '';

          # Environment variables
          NIX_SHELL_PRESERVE_PROMPT = 1;
        };

        # Formatter for nix files
        formatter = pkgs.nixpkgs-fmt;
      });
}