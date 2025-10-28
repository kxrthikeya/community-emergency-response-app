# EmergencyConnect

A real-time emergency reporting system built with Next.js 15, enabling citizens to report emergencies instantly and connect with emergency services.

## 🚀 Features

- **Real-time Emergency Reporting** - Report fires, medical emergencies, crimes, and natural disasters
- **Live Incident Map** - Interactive OpenStreetMap showing all active emergencies
- **Emergency Feed** - Social media-style feed of all reported incidents
- **Multi-Authentication** - Phone OTP, Google OAuth, and Guest mode
- **Role-Based Access** - Citizen, Emergency Responder, and Admin roles
- **SMS/Voice Alerts** - Automatic Twilio notifications to emergency services
- **Photo Upload** - Attach images to emergency reports (Base64 encoding)
- **Location Services** - GPS-based location detection
- **Responder Dashboard** - Real-time incident monitoring for emergency teams
- **Admin Panel** - Manage emergency service contacts

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: Turso (LibSQL)
- **ORM**: Drizzle ORM
- **Maps**: React Leaflet, OpenStreetMap
- **Notifications**: Twilio (SMS/Voice)
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ or Bun
- Turso account (https://turso.tech)
- Twilio account (https://www.twilio.com)
- Google Cloud Console project (optional, for Google OAuth)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emergency-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `TURSO_CONNECTION_URL` - Your Turso database URL
   - `TURSO_AUTH_TOKEN` - Your Turso authentication token
   - `TWILIO_ACCOUNT_SID` - Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Twilio auth token
   - `TWILIO_PHONE_NUMBER` - Twilio phone number
   - `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` - (Optional) Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - (Optional) Google OAuth client secret

4. **Set up the database**
   ```bash
   npm run db:push
   # or
   bun run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables from `.env`
   - Update `NEXTAUTH_URL` to your Vercel domain
   - Generate a new `NEXTAUTH_SECRET` for production
   - Click Deploy

3. **Post-Deployment**
   - Configure Google OAuth redirect URIs: `https://your-domain.com/api/auth/callback/google`
   - Verify Twilio alerts work from production
   - Test all authentication methods

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Homepage with login
│   ├── dashboard/         # User dashboard
│   ├── emergencies/       # Public emergency feed
│   ├── responder/         # Responder dashboard
│   ├── admin/             # Admin settings
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Header.tsx        # Reusable navigation header
│   ├── LoginForm.tsx     # Authentication form
│   ├── MapView.tsx       # Live incident map
│   └── ReportEmergencyForm.tsx  # Emergency reporting with photo upload
├── db/                    # Database configuration
│   ├── index.ts          # Drizzle client
│   ├── schema.ts         # Database schema
│   └── seeds/            # Seed data
└── lib/                   # Utilities
    ├── auth.ts           # NextAuth configuration
    └── otp-store.ts      # OTP management
```

## 🔐 Authentication

The app supports three authentication methods:

1. **Phone OTP** - SMS-based one-time password (development mode auto-fills)
2. **Google OAuth** - Sign in with Google
3. **Guest Mode** - Quick access for emergencies

## 👥 User Roles

- **Citizen** - Report and view emergencies
- **Emergency Responder** - Monitor and update incident status
- **Admin** - Manage emergency service contacts

## 🗺️ Features Guide

### Reporting an Emergency
1. Sign in or use guest mode
2. Go to Dashboard → Report tab
3. Select emergency type and severity
4. Add description and location (or use GPS)
5. Optionally upload a photo (max 5MB)
6. Submit - Emergency services are notified via Twilio

### Emergency Feed
- View all reported emergencies in real-time
- Filter by type, status, and severity
- See emergency photos and locations
- Auto-refreshes every 10 seconds

### Responder Dashboard
- Real-time incident monitoring
- Update incident status (Active → Responding → Resolved)
- View incident details and location
- Open locations in Google Maps

### Admin Settings
- Configure emergency service contacts
- Update phone numbers for alerts
- Activate/deactivate services

## 🔔 Twilio Configuration

The app sends SMS/voice alerts to emergency services when an incident is reported.

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get a phone number with SMS/Voice capabilities
3. Add credentials to `.env`
4. Configure emergency contacts in Admin Settings

## 🐛 Troubleshooting

### Map not loading
- Ensure browser supports Leaflet
- Check browser console for errors
- Verify internet connection for tile loading

### OTP not received
- Development mode shows OTP in toast notification
- For production: Check Twilio credentials and phone number format
- View Twilio console for delivery logs

### Database connection errors
- Verify Turso credentials in `.env`
- Check network connectivity
- Run `npm run db:push` to sync schema

### Photo upload not working
- Check file size (max 5MB)
- Ensure file is an image format
- Verify browser supports FileReader API

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📞 Support

**For immediate emergencies, call 112 (India) or your local emergency services.**

---

Built with ❤️ for safer communities