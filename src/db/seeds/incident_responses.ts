import { db } from '@/db';
import { incidentResponses } from '@/db/schema';

async function main() {
    const sampleIncidentResponses = [
        {
            incidentId: 1,
            responderId: 2,
            responseType: 'acknowledged',
            notes: 'Fire brigade dispatched',
            createdAt: new Date().toISOString(),
        },
        {
            incidentId: 1,
            responderId: 2,
            responseType: 'en_route',
            notes: 'ETA 5 minutes',
            createdAt: new Date().toISOString(),
        },
        {
            incidentId: 2,
            responderId: 2,
            responseType: 'acknowledged',
            notes: 'Ambulance on the way',
            createdAt: new Date().toISOString(),
        },
        {
            incidentId: 2,
            responderId: 2,
            responseType: 'arrived',
            notes: 'Patient being treated on site',
            createdAt: new Date().toISOString(),
        },
        {
            incidentId: 5,
            responderId: 2,
            responseType: 'resolved',
            notes: 'Patient transported to hospital safely',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(incidentResponses).values(sampleIncidentResponses);
    
    console.log('✅ Incident responses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});