import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = context.params;
    
    // Validate userId parameter
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { 
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Parse filter parameters
    const isReadParam = searchParams.get('isRead');
    const notificationType = searchParams.get('notificationType');

    // Build query conditions
    const conditions = [eq(notifications.userId, parsedUserId)];

    if (isReadParam !== null) {
      const isRead = isReadParam === 'true';
      conditions.push(eq(notifications.isRead, isRead));
    }

    if (notificationType) {
      conditions.push(eq(notifications.notificationType, notificationType));
    }

    // Execute query with filters, ordering, and pagination
    const results = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}