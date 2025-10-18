import { db } from '@/db';
import { emergencyContacts } from '@/db/schema';

async function main() {
    const sampleEmergencyContacts = [
        {
            serviceType: 'national_emergency',
            serviceName: 'National Emergency Number',
            phoneNumber: '112',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'police',
            serviceName: 'Police',
            phoneNumber: '100',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'fire',
            serviceName: 'Fire',
            phoneNumber: '101',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'ambulance',
            serviceName: 'Ambulance',
            phoneNumber: '102',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'disaster_management',
            serviceName: 'Disaster Management',
            phoneNumber: '108',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'women_helpline',
            serviceName: 'Women Helpline',
            phoneNumber: '1091',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'child_helpline',
            serviceName: 'Child Helpline',
            phoneNumber: '1098',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'senior_citizen_helpline',
            serviceName: 'Senior Citizen Helpline',
            phoneNumber: '14567',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'railway_helpline',
            serviceName: 'Railway Helpline',
            phoneNumber: '139',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'road_accident_emergency',
            serviceName: 'Road Accident Emergency',
            phoneNumber: '1073',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'air_ambulance',
            serviceName: 'Air Ambulance',
            phoneNumber: '9540161344',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        {
            serviceType: 'blood_bank',
            serviceName: 'Blood Bank',
            phoneNumber: '1910',
            isActive: true,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(emergencyContacts).values(sampleEmergencyContacts);
    
    console.log('✅ Emergency contacts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});