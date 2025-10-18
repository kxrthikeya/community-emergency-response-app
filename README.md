# EmergencyConnect - Real-Time Emergency Response System

A comprehensive emergency reporting and response application built with Next.js 15, featuring real-time incident mapping, instant SMS/voice alerts, and role-based dashboards for emergency responders.

## 🚨 Features

### Core Functionality
- **Quick Emergency Reporting**: Report emergencies with text, photos, and location data
- **Live Incident Map**: Real-time OpenStreetMap visualization of all active incidents
- **Instant Alerts**: Automatic SMS and voice call alerts to appropriate emergency services
- **Emergency Contacts**: Direct calling to Indian emergency services (Police, Fire, Ambulance, etc.)
- **Role-Based Access**: Separate dashboards for citizens, emergency responders, and admins

### Authentication Options
1. **Phone/OTP Login**: Secure authentication via Twilio SMS
2. **Google Sign-In**: Quick OAuth2 authentication
3. **Guest Mode**: Immediate access for urgent emergency reporting

### Emergency Types Supported
- 🔥 Fire Emergency → Fire Station (101)
- 🚑 Medical Emergency → Ambulance (102/108)
- 🚨 Crime/Security → Police (100)
- 🌊 Natural Disaster → Disaster Management (108)
- ⚠️ Other Emergencies → National Emergency (112)

### Smart Alert System
- **Medium/Low Severity**: SMS notification to emergency services
- **High/Critical Severity**: SMS + Voice call for immediate response
- Automatic routing to correct department based on emergency type
- Real-time location and incident details included

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Shadcn/UI + Tailwind CSS
- **Database**: Turso (SQLite) + Drizzle ORM
- **Authentication**: NextAuth.js
- **Maps**: React Leaflet + OpenStreetMap
- **SMS/Voice**: Twilio API
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ or Bun
- Twilio Account (for SMS/Voice alerts)
- Google OAuth Credentials (optional, for Google sign-in)

## 🚀 Getting Started

### 1. Clone and Install

```bash
# Install dependencies
npm install
# or
bun install
```

### 2. Environment Variables

The `.env` file is already configured with Twilio credentials:

```env
# Database (Already configured)
TURSO_CONNECTION_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Twilio (Already configured)
TWILIO_ACCOUNT_SID=ACfac3d3917e35e9d5c6fc6c5747f40fde
TWILIO_AUTH_TOKEN=8d4da91fc64ad9e4c8e5c1da59a87aef
TWILIO_PHONE_NUMBER=+14247811513

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Generate NextAuth Secret

```bash
# Generate a secure random string
openssl rand -base64 32
# Add the output to NEXTAUTH_SECRET in .env
```

### 4. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### 5. Run Database Migrations

```bash
# The database is already set up with schema and seed data
# But if you need to reset:
npm run db:push
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
# or
bun dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📱 Testing the Application

### Development Mode Features
- **Auto OTP**: In development, use OTP `123456` for phone login
- **Test Users**: Pre-seeded test users available (see Database section)
- **Mock Alerts**: Twilio alerts logged to console in dev mode

### Test Accounts

```
Citizen User:
- Phone: +919876543210
- Email: rahul.sharma@example.com
- OTP: 123456 (dev mode)

Emergency Responder:
- Email: priya.singh@emergency.gov.in
- Access: /responder dashboard

Admin:
- Email: admin@emergency.gov.in
- Access: /admin settings
```

## 🗺️ Application Routes

### Public Routes
- `/` - Homepage with login options and emergency contacts
- `/api/auth/*` - Authentication endpoints

### Protected Routes
- `/dashboard` - Main user dashboard with map, report form, and incidents
- `/responder` - Emergency responder dashboard (role: emergency_responder, admin)
- `/admin` - Admin settings for emergency contacts (role: admin)

## 📊 API Endpoints

### Incidents API
```
GET    /api/incidents              - List all incidents (with filters)
GET    /api/incidents?id=[id]      - Get single incident
POST   /api/incidents              - Create new incident
PATCH  /api/incidents?id=[id]      - Update incident status
```

### Emergency Contacts API
```
GET    /api/emergency-contacts     - List emergency contacts
GET    /api/emergency-contacts?id=[id] - Get single contact
POST   /api/emergency-contacts     - Create new contact
PUT    /api/emergency-contacts?id=[id] - Update contact
```

### Authentication API
```
POST   /api/auth/send-otp         - Send OTP to phone number
POST   /api/auth/signin           - Sign in with credentials
```

### Twilio Alert API
```
POST   /api/twilio/alert          - Send emergency alert (SMS + Voice)
```

## 🎯 User Workflows

### Reporting an Emergency
1. User logs in (Phone/Google/Guest)
2. Clicks "Report" tab
3. Selects emergency type and severity
4. Adds description and location (auto or manual)
5. Optionally adds photo
6. Submits report
7. System creates incident in database
8. System sends SMS/Voice alert to appropriate emergency service
9. Incident appears on live map for all users

### Emergency Responder Workflow
1. Responder logs in
2. Views real-time incident dashboard
3. Filters by status (Active/Responding/Resolved)
4. Updates incident status
5. Opens location in Google Maps
6. Responds to emergency

### Admin Workflow
1. Admin logs in
2. Goes to /admin
3. Updates emergency service contact numbers
4. Activates/deactivates services
5. Manages system configuration

## 📞 Indian Emergency Numbers (Pre-configured)

| Service | Number |
|---------|--------|
| National Emergency | 112 |
| Police | 100 |
| Fire Brigade | 101 |
| Ambulance | 102 |
| Disaster Management | 108 |
| Women Helpline | 1091 |
| Child Helpline | 1098 |
| Senior Citizen Helpline | 14567 |
| Air Ambulance | 9540161344 |

## 🔒 Security Features

- **JWT-based authentication** with NextAuth.js
- **Role-based access control** (citizen, emergency_responder, admin)
- **Guest mode** with limited permissions
- **Phone verification** via Twilio OTP
- **Secure API routes** with validation

## 🚀 Deployment

### Environment Variables for Production
```bash
# Update these in your hosting platform
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-secure-secret>
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **AWS/Azure/GCP**

## 📝 Development Notes

### Database Schema
- `users` - User accounts with roles
- `incidents` - Emergency reports
- `emergency_contacts` - Service contact numbers
- `incident_responses` - Responder actions
- `notifications` - User notifications

### Key Components
- `MapView.tsx` - OpenStreetMap with real-time markers
- `ReportEmergencyForm.tsx` - Emergency reporting interface
- `EmergencyContactsDialog.tsx` - Quick access to emergency numbers
- `LoginForm.tsx` - Multi-method authentication

## 🐛 Troubleshooting

### Maps not loading
- Ensure Leaflet CSS is imported
- Check console for errors
- Verify network access to OpenStreetMap

### Twilio alerts not sending
- Verify credentials in `.env`
- Check Twilio account balance
- Ensure phone numbers are in E.164 format (+919876543210)

### Authentication issues
- Clear browser cookies
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain

## 🤝 Contributing

This is a demo/prototype application. For production use:
1. Add Redis for OTP storage
2. Implement WebSocket for real-time updates
3. Add push notifications
4. Implement geofencing for nearby alerts
5. Add incident photos upload (Cloudinary/S3)
6. Add multi-language support

## 📄 License

MIT License - feel free to use for emergency response systems

## 🆘 Support

For immediate emergencies, always call your local emergency services:
- **India**: 112 (National Emergency Number)
- **USA**: 911
- **UK**: 999
- **EU**: 112

---

**Built with ❤️ to help communities respond faster in emergencies**