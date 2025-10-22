# DVC Setup for Contributors

This repository uses DVC (Data Version Control) to manage large files stored in Google Drive. To access the data, you need to authenticate with Google Drive.

## For Contributors (Read-Only Access)

### Method 1: Using OAuth2 (Interactive)

When you run `dvc pull` for the first time, DVC will:
1. Open your browser for Google authentication
2. Ask for permission to access Google Drive
3. Provide a verification code to paste back
4. Cache the credentials for future use

```bash
# Pull all data
dvc pull

# Or pull specific directories
dvc pull data/catalogs/parsed/
```

### Method 2: Using Service Account (CI/CD)

For automated environments, set the following environment variable:

```bash
export GDRIVE_CREDENTIALS_DATA='<service-account-json>'
```

## For Maintainers

### Setting Up Google Cloud Project

1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create OAuth2 credentials:
   - Type: Web application
   - Authorized redirect URIs: `http://localhost:8080/`
4. Download the credentials

### Configuring DVC Remote

The client ID is stored in `.dvc/config` (safe to commit). The client secret should be kept private.

#### For Maintainers

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your client secret:
   ```
   GDRIVE_CLIENT_SECRET=your-actual-client-secret
   ```

3. The `.envrc` file will automatically load this when you enter the directory (if using direnv).

#### For Contributors

Contributors don't need the client secret. DVC will use OAuth2 flow automatically:
- Run `dvc pull`
- Authenticate in browser
- DVC caches the auth token locally

### Security Best Practices

- **Never commit the client secret** to the repository
- Use environment variables for sensitive data
- For CI/CD, use service accounts instead of OAuth2
- Consider using DVC Studio for team collaboration

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

1. Clear cached credentials:
   ```bash
   rm -rf ~/.cache/pydrive2fs/
   ```

2. Re-authenticate:
   ```bash
   dvc pull --force
   ```

### Permission Errors

Ensure the Google Drive folder is shared with "Anyone with the link can view" permissions.