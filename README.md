# SaaS Store Admin Portal

A premium admin portal for managing SaaS store operations built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Authentication & Authorization**: Secure login with role-based access control
- **Dashboard**: Analytics and key metrics overview
- **User Management**: Admin, staff, and user management
- **Product Management**: Product and category management
- **Order Management**: Complete order tracking and status updates
- **Customer Management**: Customer information and order history
- **Reporting**: Sales and business analytics
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Security**: Input validation, sanitization, and authentication security
- **Modern UI**: Clean, intuitive interface with consistent design system

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based authentication
- **API**: REST API integration
- **UI Components**: Custom-built reusable components

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API server running (typically at http://localhost:3000)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd saas-store-admin-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables (if any are needed):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your environment-specific variables
   ```

4. Make sure your backend API server is running:
   ```bash
   # This should be running at http://localhost:3000/api/v1/admin
   # Follow the backend setup instructions in your API documentation
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open your browser to [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_API_BASE_URL`: The base URL for the backend API (e.g., `http://localhost:3000/api/v1/admin`)

## API Integration

The application is designed to work with the SaaS store backend API. Ensure your backend server is running before using the admin portal.

Default API endpoint: `http://localhost:3000/api/v1/admin`

## Development

- The application uses the Next.js App Router
- Components are organized in the `src/components` directory
- API utilities are in `src/utils/api.ts`
- Authentication context is in `src/contexts/AuthContext.tsx`
- Types are defined in `src/types/index.ts`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Security Features

- Input sanitization and validation
- JWT token management with refresh mechanism
- Role-based access control
- Secure API request handling
- XSS prevention measures

## Responsive Design

The admin portal is fully responsive and works across different device sizes:

- Desktop: Full sidebar navigation
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation and optimized layouts

## API Documentation

The application is designed to work with the backend API as documented in the `OWNER_API_DOCUMENTATION.md` file.

## Deployment

The application is ready for deployment to platforms like Vercel, Netlify, or any other platform that supports Next.js applications.

For Vercel deployment:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` from the project directory
3. Follow the prompts to deploy

## Testing

Before deploying, ensure to test:

1. Authentication flow (login, logout, token refresh)
2. All primary features (dashboard, user management, product management, order management)
3. Responsive behavior across different screen sizes
4. Error handling and validation
5. Security measures (access control, input validation)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.