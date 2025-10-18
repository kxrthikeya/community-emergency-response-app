import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { incidents } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_EMERGENCY_TYPES = ['fire', 'medical', 'crime', 'disaster', 'other'];
const VALID_STATUSES = ['active', 'responding', 'resolved'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single incident by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const incident = await db
        .select()
        .from(incidents)
        .where(eq(incidents.id, parseInt(id)))
        .limit(1);

      if (incident.length === 0) {
        return NextResponse.json(
          { error: 'Incident not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(incident[0], { status: 200 });
    }

    // List incidents with filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const emergencyType = searchParams.get('emergencyType');
    const severity = searchParams.get('severity');
    const userId = searchParams.get('userId');

    // Build filter conditions
    const conditions = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      conditions.push(eq(incidents.status, status));
    }

    if (emergencyType) {
      if (!VALID_EMERGENCY_TYPES.includes(emergencyType)) {
        return NextResponse.json(
          { error: `Invalid emergency type. Must be one of: ${VALID_EMERGENCY_TYPES.join(', ')}`, code: 'INVALID_EMERGENCY_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(incidents.emergencyType, emergencyType));
    }

    if (severity) {
      if (!VALID_SEVERITIES.includes(severity)) {
        return NextResponse.json(
          { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`, code: 'INVALID_SEVERITY' },
          { status: 400 }
        );
      }
      conditions.push(eq(incidents.severity, severity));
    }

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(incidents.userId, parseInt(userId)));
    }

    if (search) {
      conditions.push(
        or(
          like(incidents.description, `%${search}%`),
          like(incidents.locationName, `%${search}%`)
        )
      );
    }

    let query = db.select().from(incidents);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(incidents.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      emergencyType,
      description,
      latitude,
      longitude,
      userId,
      locationName,
      photoUrl,
      severity,
    } = body;

    // Validate required fields
    if (!emergencyType) {
      return NextResponse.json(
        { error: 'Emergency type is required', code: 'MISSING_EMERGENCY_TYPE' },
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'Description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    if (latitude === undefined || latitude === null) {
      return NextResponse.json(
        { error: 'Latitude is required', code: 'MISSING_LATITUDE' },
        { status: 400 }
      );
    }

    if (longitude === undefined || longitude === null) {
      return NextResponse.json(
        { error: 'Longitude is required', code: 'MISSING_LONGITUDE' },
        { status: 400 }
      );
    }

    // Validate emergency type
    if (!VALID_EMERGENCY_TYPES.includes(emergencyType)) {
      return NextResponse.json(
        { error: `Invalid emergency type. Must be one of: ${VALID_EMERGENCY_TYPES.join(', ')}`, code: 'INVALID_EMERGENCY_TYPE' },
        { status: 400 }
      );
    }

    // Validate severity if provided
    const finalSeverity = severity || 'medium';
    if (!VALID_SEVERITIES.includes(finalSeverity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`, code: 'INVALID_SEVERITY' },
        { status: 400 }
      );
    }

    // Validate coordinates are numbers
    if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
      return NextResponse.json(
        { error: 'Latitude and longitude must be valid numbers', code: 'INVALID_COORDINATES' },
        { status: 400 }
      );
    }

    // Validate userId if provided
    if (userId !== undefined && userId !== null && isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'User ID must be a valid number', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date().toISOString();

    const insertData: any = {
      emergencyType: emergencyType.trim(),
      description: description.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      status: 'active',
      severity: finalSeverity,
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };

    // Optional fields
    if (userId !== undefined && userId !== null) {
      insertData.userId = parseInt(userId);
    }
    if (locationName) {
      insertData.locationName = locationName.trim();
    }
    if (photoUrl) {
      insertData.photoUrl = photoUrl.trim();
    }

    const newIncident = await db.insert(incidents).values(insertData).returning();

    return NextResponse.json(newIncident[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if incident exists
    const existingIncident = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, parseInt(id)))
      .limit(1);

    if (existingIncident.length === 0) {
      return NextResponse.json(
        { error: 'Incident not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, severity, description, locationName, photoUrl } = body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Validate severity if provided
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}`, code: 'INVALID_SEVERITY' },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (status !== undefined) {
      updates.status = status;
    }
    if (severity !== undefined) {
      updates.severity = severity;
    }
    if (description !== undefined) {
      if (description.trim() === '') {
        return NextResponse.json(
          { error: 'Description cannot be empty', code: 'INVALID_DESCRIPTION' },
          { status: 400 }
        );
      }
      updates.description = description.trim();
    }
    if (locationName !== undefined) {
      updates.locationName = locationName ? locationName.trim() : null;
    }
    if (photoUrl !== undefined) {
      updates.photoUrl = photoUrl ? photoUrl.trim() : null;
    }

    const updatedIncident = await db
      .update(incidents)
      .set(updates)
      .where(eq(incidents.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedIncident[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}