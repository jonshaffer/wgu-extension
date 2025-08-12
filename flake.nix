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
            git-lfs # For storing PDFs and large files
            gh  # GitHub CLI
            dvc # Data Version Control for large files

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
            echo ""
            
            # Ensure node_modules/.bin is in PATH
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            # Set up npm to use local cache
            export npm_config_cache="$PWD/.npm-cache"
            mkdir -p .npm-cache
          '';

          # Environment variables
          NIX_SHELL_PRESERVE_PROMPT = 1;
        };

        # Formatter for nix files
        formatter = pkgs.nixpkgs-fmt;
      });
}