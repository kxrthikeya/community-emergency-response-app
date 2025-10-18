import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phoneNumber: '+919876543210',
            role: 'citizen',
            isGuest: false,
            googleId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Priya Singh',
            email: 'priya.singh@emergency.gov.in',
            phoneNumber: '+919876543211',
            role: 'emergency_responder',
            isGuest: false,
            googleId: null,
            createdAt: new Date().toISOString(),
        },
        {
            name: 'Admin User',
            email: 'admin@emergency.gov.in',
            phoneNumber: '+919876543212',
            role: 'admin',
            isGuest: false,
            googleId: null,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});