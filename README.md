# MechanicOnDemand

A web application that connects car owners with mechanics, providing a convenient solution for car repair and maintenance needs.

## Features

- **User Authentication**: Secure login and registration system with role-based access control (customers, mechanics, drivers, admin).
- **Service Requests**: Car owners can create service requests, specifying their vehicle details and service needs.
- **Shop Management**: Mechanics can manage their shops, view assigned service requests, and update service status.
- **Vehicle Pickup and Delivery**: Drivers can see their assigned pickups and deliveries.
- **Real-time Status Updates**: Users receive real-time updates on their service requests.
- **Payments**: Secure payment processing with Stripe integration.
- **Responsive Design**: Mobile-friendly interface for convenient access on any device.

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Styling**: Tailwind CSS, shadcn/ui components
- **Deployment**: Vercel (frontend and serverless functions)

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm or yarn
- Supabase account
- Stripe account (for payment processing)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/mechanic-on-demand.git
   cd mechanic-on-demand
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Database Setup

1. Create a new project in Supabase.
2. Run the SQL migrations in `src/db/schema.sql` to set up the database schema.
3. Configure the Row Level Security (RLS) policies as defined in the schema.

## Project Structure

```
mechanic-on-demand/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app directory
│   │   ├── api/         # API routes
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Homepage
│   ├── components/      # React components
│   │   ├── ui/          # UI components
│   │   └── stripe/      # Stripe-related components
│   ├── db/              # Database migrations and SQL functions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── styles/          # Global styles
├── .env.local           # Environment variables (not in repo)
├── .gitignore           # Git ignore file
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## API Endpoints

The application provides the following API endpoints:

- **Authentication**:
  - `/api/auth/*`: Handled by Supabase Auth

- **Service Requests**:
  - `GET /api/service-requests`: Get a list of service requests
  - `GET /api/service-request/[id]`: Get a specific service request
  - `POST /api/service-requests`: Create a new service request
  - `PUT /api/service-request/[id]`: Update a service request

- **Payments**:
  - `POST /api/payments/create-intent`: Create a payment intent
  - `POST /api/payments/confirm`: Confirm a payment
  - `POST /api/webhooks/stripe`: Handle Stripe webhook events

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
