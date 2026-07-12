import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Check, X, Plus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { meetings as initialMeetings, availabilitySlots as initialSlots } from '../../data/meetings';
import { findUserById } from '../../data/users';
import { Meeting, AvailabilitySlot, MeetingStatus } from '../../types';

const statusVariant: Record<MeetingStatus, 'success' | 'warning' | 'error' | 'gray'> = {
  confirmed: 'success',
  pending: 'warning',
  declined: 'error',
  cancelled: 'gray',
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const getMonthGrid = (viewDate: Date): (Date | null)[] => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
};

const toISO = (d: Date) => d.toISOString().split('T')[0];

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(toISO(new Date()));
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState({ start: '09:00', end: '09:30' });

  const myMeetings = useMemo(
    () => meetings.filter(m => user && (m.requesterId === user.id || m.recipientId === user.id)),
    [meetings, user]
  );

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    myMeetings.forEach(m => {
      map[m.date] = map[m.date] || [];
      map[m.date].push(m);
    });
    return map;
  }, [myMeetings]);

  const mySlots = useMemo(
    () => slots.filter(s => user && s.userId === user.id),
    [slots, user]
  );

  const pendingRequests = myMeetings.filter(
    m => m.status === 'pending' && user && m.recipientId === user.id
  );

  const upcomingConfirmed = myMeetings
    .filter(m => m.status === 'confirmed')
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleRespond = (id: string, status: MeetingStatus) => {
    setMeetings(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
    toast.success(status === 'confirmed' ? 'Meeting confirmed!' : 'Meeting declined');
  };

  const handleAddSlot = () => {
    if (!user) return;
    const slot: AvailabilitySlot = {
      id: `a${Date.now()}`,
      userId: user.id,
      date: selectedDate,
      startTime: newSlotTime.start,
      endTime: newSlotTime.end,
      isBooked: false,
    };
    setSlots(prev => [...prev, slot]);
    setShowAddSlot(false);
    toast.success('Availability slot added');
  };

  const monthCells = getMonthGrid(viewDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Schedule and manage your meetings</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setShowAddSlot(true)}>
          Add Availability
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">{formatMonthLabel(viewDate)}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>‹</Button>
              <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>Today</Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>›</Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
              {weekDays.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((date, idx) => {
                if (!date) return <div key={idx} className="h-20" />;
                const iso = toISO(date);
                const dayMeetings = meetingsByDate[iso] || [];
                const isSelected = iso === selectedDate;
                const isToday = iso === toISO(new Date());
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(iso)}
                    className={`h-20 rounded-md p-1 text-left border transition-colors ${
                      isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayMeetings.slice(0, 2).map(m => (
                        <div
                          key={m.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            m.status === 'confirmed' ? 'bg-success-50 text-success-700' :
                            m.status === 'pending' ? 'bg-warning-50 text-warning-700' :
                            'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {m.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div className="text-[10px] text-gray-400">+{dayMeetings.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Sidebar: requests + availability */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Meeting Requests {pendingRequests.length > 0 && <Badge variant="warning" size="sm">{pendingRequests.length}</Badge>}
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {pendingRequests.length === 0 && (
                <p className="text-sm text-gray-500">No pending requests.</p>
              )}
              {pendingRequests.map(m => {
                const requester = findUserById(m.requesterId);
                return (
                  <div key={m.id} className="border border-gray-100 rounded-md p-3">
                    <p className="text-sm font-medium text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">
                      with {requester?.name || 'Unknown'} · {m.date} · {m.startTime}-{m.endTime}
                    </p>
                    {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                    <div className="flex gap-2 mt-2">
                      <Button size="xs" variant="success" leftIcon={<Check size={14} />} onClick={() => handleRespond(m.id, 'confirmed')}>
                        Accept
                      </Button>
                      <Button size="xs" variant="outline" leftIcon={<X size={14} />} onClick={() => handleRespond(m.id, 'declined')}>
                        Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Upcoming Confirmed</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {upcomingConfirmed.length === 0 && (
                <p className="text-sm text-gray-500">No confirmed meetings yet.</p>
              )}
              {upcomingConfirmed.map(m => {
                const other = findUserById(m.requesterId === user?.id ? m.recipientId : m.requesterId);
                return (
                  <div key={m.id} className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary-600"><CalendarIcon size={16} /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {m.date} · {m.startTime}-{m.endTime} · with {other?.name}
                      </p>
                    </div>
                    <Badge variant={statusVariant[m.status]} size="sm" className="ml-auto">{m.status}</Badge>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">My Availability — {selectedDate}</h2>
            </CardHeader>
            <CardBody className="space-y-2">
              {mySlots.filter(s => s.date === selectedDate).length === 0 && (
                <p className="text-sm text-gray-500">No slots set for this day.</p>
              )}
              {mySlots.filter(s => s.date === selectedDate).map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-md px-3 py-2">
                  <span>{s.startTime} – {s.endTime}</span>
                  <Badge variant={s.isBooked ? 'gray' : 'success'} size="sm">
                    {s.isBooked ? 'Booked' : 'Open'}
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Add availability modal */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900">Add Availability — {selectedDate}</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                  <input
                    type="time"
                    value={newSlotTime.start}
                    onChange={e => setNewSlotTime(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                  <input
                    type="time"
                    value={newSlotTime.end}
                    onChange={e => setNewSlotTime(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
                <Button onClick={handleAddSlot}>Save Slot</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};