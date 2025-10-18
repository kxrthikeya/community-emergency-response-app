import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate id parameter
    if (!id) {
      return NextResponse.json(
        { 
          error: 'Notification ID is required',
          code: 'MISSING_ID'
        },
        { status: 400 }
      );
    }

    // Validate id is a valid integer
    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { 
          error: 'Valid notification ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Check if notification exists
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (existingNotification.length === 0) {
      return NextResponse.json(
        { 
          error: 'Notification not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Update notification to mark as read
    const updatedNotification = await db
      .update(notifications)
      .set({
        isRead: true
      })
      .where(eq(notifications.id, notificationId))
      .returning();

    return NextResponse.json(updatedNotification[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}