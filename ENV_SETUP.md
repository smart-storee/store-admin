# Environment Variables Setup

## API Configuration

The admin portal uses environment variables to configure the API endpoint.

### Required Environment Variable

Create a `.env.local` file in the root of the `saas-store-admin-portal` directory:

```env
# API Configuration
# The base URL of your backend API server
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Environment Variable Options

- **`NEXT_PUBLIC_API_URL`** (Recommended): Base URL of your API server

  - Example: `http://localhost:3000` (for local development)
  - Example: `https://your-api.railway.app` (for production)
  - Example: `https://api.yourdomain.com` (for production with custom domain)

- **`NEXT_PUBLIC_API_BASE_URL`** (Legacy support): Full API path
  - Example: `http://localhost:3000/api/v1/admin`
  - Note: This is supported for backward compatibility but `NEXT_PUBLIC_API_URL` is preferred

### Examples

#### Local Development

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Production (Railway)

```env
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

#### Production (VPS with Custom Domain)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### How It Works

The configuration is centralized in `src/config/api.config.ts`:

- Reads `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL` from environment
- Automatically constructs the full API URL: `${API_BASE_URL}/api/v1/admin`
- All API calls use this centralized configuration

### Files Using API Configuration

- `src/utils/api.ts` - Main API utility functions
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/services/upiTransactionService.ts` - UPI transaction service

### Next.js Environment Variables

In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. This is required for client-side API calls.

**Important:** Never commit `.env.local` to git. It should be in `.gitignore`.

### Setting Up for Deployment

#### Vercel

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_API_URL` with your production API URL
4. Redeploy

#### Other Platforms

Set the environment variable in your hosting platform's configuration:

- Railway: Project → Variables
- Render: Environment → Environment Variables
- Netlify: Site settings → Environment variables

### Troubleshooting

**API calls failing?**

1. Check that `NEXT_PUBLIC_API_URL` is set correctly
2. Verify the API server is running and accessible
3. Check browser console for CORS errors
4. Ensure the API URL doesn't have a trailing slash

**Still using localhost in production?**

- Make sure you've set `NEXT_PUBLIC_API_URL` in your production environment
- Rebuild the application after setting the variable
- Clear browser cache
