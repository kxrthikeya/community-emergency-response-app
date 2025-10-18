import { db } from '@/db';
import { notifications } from '@/db/schema';

async function main() {
    const sampleNotifications = [
        {
            userId: 1,
            incidentId: 1,
            notificationType: 'status_update',
            message: 'Your reported fire incident status changed to responding',
            isRead: false,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 1,
            incidentId: 2,
            notificationType: 'nearby_incident',
            message: 'Critical medical emergency reported 2km from your location',
            isRead: false,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 2,
            incidentId: 3,
            notificationType: 'response_update',
            message: 'New crime incident assigned to you in Koramangala',
            isRead: true,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 1,
            incidentId: 4,
            notificationType: 'nearby_incident',
            message: 'Disaster alert: Flooding reported in Chennai Beach area',
            isRead: false,
            createdAt: new Date().toISOString(),
        },
        {
            userId: 2,
            incidentId: 6,
            notificationType: 'response_update',
            message: 'Critical fire emergency requires immediate attention',
            isRead: false,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(notifications).values(sampleNotifications);
    
    console.log('✅ Notifications seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});