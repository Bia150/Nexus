import { Meeting, AvailabilitySlot } from '../types';

// Helper to build ISO date strings relative to today, so demo data always looks current
const toISODate = (daysFromToday: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
};

export const meetings: Meeting[] = [
  {
    id: 'm1',
    requesterId: 'i1',
    recipientId: 'e1',
    title: 'Series A Pitch Discussion',
    date: toISODate(2),
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    notes: 'Follow-up on the funding deck shared last week.',
    createdAt: toISODate(-3),
  },
  {
    id: 'm2',
    requesterId: 'i2',
    recipientId: 'e1',
    title: 'Product Demo Walkthrough',
    date: toISODate(4),
    startTime: '14:00',
    endTime: '14:45',
    status: 'pending',
    notes: 'Would love to see the latest platform demo.',
    createdAt: toISODate(-1),
  },
  {
    id: 'm3',
    requesterId: 'e2',
    recipientId: 'i1',
    title: 'Due Diligence Q&A',
    date: toISODate(-1),
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    createdAt: toISODate(-5),
  },
  {
    id: 'm4',
    requesterId: 'i1',
    recipientId: 'e2',
    title: 'Term Sheet Review',
    date: toISODate(6),
    startTime: '11:00',
    endTime: '11:30',
    status: 'declined',
    notes: 'Requesting a later slot instead.',
    createdAt: toISODate(-2),
  },
];

export const availabilitySlots: AvailabilitySlot[] = [
  { id: 'a1', userId: 'e1', date: toISODate(2), startTime: '10:00', endTime: '10:30', isBooked: true },
  { id: 'a2', userId: 'e1', date: toISODate(2), startTime: '11:00', endTime: '11:30', isBooked: false },
  { id: 'a3', userId: 'e1', date: toISODate(3), startTime: '09:00', endTime: '09:30', isBooked: false },
  { id: 'a4', userId: 'e1', date: toISODate(4), startTime: '14:00', endTime: '14:45', isBooked: true },
  { id: 'a5', userId: 'i1', date: toISODate(2), startTime: '10:00', endTime: '10:30', isBooked: true },
  { id: 'a6', userId: 'i1', date: toISODate(5), startTime: '15:00', endTime: '15:30', isBooked: false },
];