import { db } from '@/db';
import { incidents } from '@/db/schema';

async function main() {
    const sampleIncidents = [
        {
            userId: 1,
            emergencyType: 'fire',
            description: 'Building fire reported at commercial complex',
            latitude: 28.6289,
            longitude: 77.2065,
            locationName: 'Connaught Place, Delhi',
            photoUrl: null,
            status: 'responding',
            severity: 'high',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            emergencyType: 'medical',
            description: 'Person collapsed at railway station',
            latitude: 19.1136,
            longitude: 72.8697,
            locationName: 'Andheri, Mumbai',
            photoUrl: null,
            status: 'responding',
            severity: 'critical',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            emergencyType: 'crime',
            description: 'Theft reported at residential area',
            latitude: 12.9352,
            longitude: 77.6245,
            locationName: 'Koramangala, Bangalore',
            photoUrl: null,
            status: 'active',
            severity: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: null,
            emergencyType: 'disaster',
            description: 'Flooding in coastal areas',
            latitude: 13.0478,
            longitude: 80.2838,
            locationName: 'Chennai Beach',
            photoUrl: null,
            status: 'active',
            severity: 'high',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 1,
            emergencyType: 'medical',
            description: 'Minor road accident victim needs assistance',
            latitude: 18.5204,
            longitude: 73.8567,
            locationName: 'Pune',
            photoUrl: null,
            status: 'resolved',
            severity: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            userId: 2,
            emergencyType: 'fire',
            description: 'Fire outbreak at technology park building',
            latitude: 17.4435,
            longitude: 78.3772,
            locationName: 'Hyderabad IT Park',
            photoUrl: null,
            status: 'active',
            severity: 'critical',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(incidents).values(sampleIncidents);
    
    console.log('✅ Incidents seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});