import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emergencyContacts } from '@/db/schema';
import { eq, like, or, asc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const contact = await db
        .select()
        .from(emergencyContacts)
        .where(eq(emergencyContacts.id, parseInt(id)))
        .limit(1);

      if (contact.length === 0) {
        return NextResponse.json(
          { error: 'Emergency contact not found', code: 'CONTACT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(contact[0], { status: 200 });
    }

    // List with filtering and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const serviceType = searchParams.get('serviceType');
    const isActiveParam = searchParams.get('isActive');

    // Default isActive to true if not specified
    const isActive = isActiveParam !== null ? isActiveParam === 'true' : true;

    let query = db.select().from(emergencyContacts);

    // Build WHERE conditions
    const conditions = [];

    // Filter by isActive
    conditions.push(eq(emergencyContacts.isActive, isActive));

    // Filter by serviceType
    if (serviceType) {
      conditions.push(eq(emergencyContacts.serviceType, serviceType));
    }

    // Search by serviceName or phoneNumber
    if (search) {
      const searchCondition = or(
        like(emergencyContacts.serviceName, `%${search}%`),
        like(emergencyContacts.phoneNumber, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by serviceName ASC
    const results = await query
      .orderBy(asc(emergencyContacts.serviceName))
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
    const { serviceType, serviceName, phoneNumber, isActive } = body;

    // Validate required fields
    if (!serviceType) {
      return NextResponse.json(
        { error: 'serviceType is required', code: 'MISSING_SERVICE_TYPE' },
        { status: 400 }
      );
    }

    if (!serviceName) {
      return NextResponse.json(
        { error: 'serviceName is required', code: 'MISSING_SERVICE_NAME' },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required', code: 'MISSING_PHONE_NUMBER' },
        { status: 400 }
      );
    }

    // Validate serviceType is unique
    const existingContact = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.serviceType, serviceType.trim()))
      .limit(1);

    if (existingContact.length > 0) {
      return NextResponse.json(
        {
          error: 'serviceType must be unique',
          code: 'DUPLICATE_SERVICE_TYPE',
        },
        { status: 400 }
      );
    }

    // Create new emergency contact
    const newContact = await db
      .insert(emergencyContacts)
      .values({
        serviceType: serviceType.trim(),
        serviceName: serviceName.trim(),
        phoneNumber: phoneNumber.trim(),
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newContact[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { serviceName, phoneNumber, isActive } = body;

    // Check if contact exists
    const existingContact = await db
      .select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.id, parseInt(id)))
      .limit(1);

    if (existingContact.length === 0) {
      return NextResponse.json(
        { error: 'Emergency contact not found', code: 'CONTACT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only allowed fields
    const updates: {
      serviceName?: string;
      phoneNumber?: string;
      isActive?: boolean;
    } = {};

    if (serviceName !== undefined) {
      updates.serviceName = serviceName.trim();
    }

    if (phoneNumber !== undefined) {
      updates.phoneNumber = phoneNumber.trim();
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    // Update emergency contact
    const updatedContact = await db
      .update(emergencyContacts)
      .set(updates)
      .where(eq(emergencyContacts.id, parseInt(id)))
      .returning();

    if (updatedContact.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update emergency contact', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedContact[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}