import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  phoneNumber: text('phone_number').unique(),
  email: text('email').unique(),
  name: text('name'),
  googleId: text('google_id').unique(),
  role: text('role').notNull().default('citizen'),
  isGuest: integer('is_guest', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

export const incidents = sqliteTable('incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  emergencyType: text('emergency_type').notNull(),
  description: text('description').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  locationName: text('location_name'),
  photoUrl: text('photo_url'),
  status: text('status').notNull().default('active'),
  severity: text('severity').notNull().default('medium'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const emergencyContacts = sqliteTable('emergency_contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceType: text('service_type').notNull().unique(),
  serviceName: text('service_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
});

export const incidentResponses = sqliteTable('incident_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  responderId: integer('responder_id').notNull().references(() => users.id),
  responseType: text('response_type').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  incidentId: integer('incident_id').notNull().references(() => incidents.id),
  notificationType: text('notification_type').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});