import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, X } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval, setHours, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Meeting, ViewType, NewMeetingFormData, DragResult } from './types';
import { clsx } from 'clsx';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Réunion d\'équipe',
      startTime: new Date(2024, 2, 19, 10, 0),
      endTime: new Date(2024, 2, 19, 11, 0),
      location: 'Salle A',
      firstName: 'Jean',
      lastName: 'Dupont',
      description: 'Réunion hebdomadaire de l\'équipe'
    }
  ]);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState<NewMeetingFormData>({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    firstName: '',
    lastName: '',
    description: ''
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const meeting = meetings.find(m => m.id === draggableId);
    if (!meeting) return;

    const [newDateStr, newHourStr] = destination.droppableId.split('-');
    const newDate = new Date(newDateStr);
    const newHour = parseInt(newHourStr, 10);

    const duration = differenceInHours(meeting.endTime, meeting.startTime);
    const newStartTime = setHours(newDate, newHour);
    const newEndTime = setHours(newDate, newHour + duration);

    setMeetings(prevMeetings => 
      prevMeetings.map(m => 
        m.id === meeting.id 
          ? { ...m, startTime: newStartTime, endTime: newEndTime }
          : m
      )
    );
  };

  const handlePrevious = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, -1));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewType) {
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
    }
  };

  const getDateRange = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'dd MMMM yyyy', { locale: fr });
      case 'week': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(start, 'dd')} - ${format(end, 'dd MMMM yyyy', { locale: fr })}`;
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      default:
        return '';
    }
  };

  const handleSubmitMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = parseISO(newMeeting.startTime);
    const endDateTime = parseISO(newMeeting.endTime);

    const newMeetingData: Meeting = {
      id: Date.now().toString(),
      title: newMeeting.title,
      startTime: startDateTime,
      endTime: endDateTime,
      location: newMeeting.location,
      firstName: newMeeting.firstName,
      lastName: newMeeting.lastName,
      description: newMeeting.description
    };

    setMeetings(prev => [...prev, newMeetingData]);
    setIsNewMeetingModalOpen(false);
    setNewMeeting({
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      firstName: '',
      lastName: '',
      description: ''
    });
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const startTime = setHours(date, hour);
    const endTime = setHours(date, hour + 1);
    
    setNewMeeting(prev => ({
      ...prev,
      startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(endTime, "yyyy-MM-dd'T'HH:mm")
    }));
    setIsNewMeetingModalOpen(true);
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayMeetings = meetings.filter(meeting => 
      isSameDay(meeting.startTime, currentDate)
    );
    
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[60px_1fr] gap-1">
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="text-xs text-gray-500 pr-2 text-right">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              <Droppable droppableId={`${format(currentDate, 'yyyy-MM-dd')}-${hour}`}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="border-t border-gray-200 h-12 relative cursor-pointer hover:bg-gray-50"
                    onClick={() => handleTimeSlotClick(currentDate, hour)}
                  >
                    {dayMeetings.map(meeting => {
                      const startHour = meeting.startTime.getHours();
                      const endHour = meeting.endTime.getHours();
                      if (startHour === hour) {
                        return (
                          <Draggable key={meeting.id} draggableId={meeting.id} index={0}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="absolute left-0 right-0 bg-blue-100 p-2 rounded-md text-sm"
                                style={{
                                  ...provided.draggableProps.style,
                                  top: '0',
                                  height: `${(endHour - startHour) * 48}px`
                                }}
                              >
                                <div className="font-semibold">{meeting.title}</div>
                                <div className="text-xs text-gray-600">{meeting.location}</div>
                              </div>
                            )}
                          </Draggable>
                        );
                      }
                      return null;
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </React.Fragment>
          ))}
        </div>
      </DragDropContext>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
          <div className=""></div>
          {days.map(day => (
            <div key={day.toString()} className="text-center text-sm font-medium py-2">
              {format(day, 'EEE dd', { locale: fr })}
            </div>
          ))}
          
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="text-xs text-gray-500 pr-2 text-right">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              {days.map(day => (
                <Droppable key={day.toString()} droppableId={`${format(day, 'yyyy-MM-dd')}-${hour}`}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="border-t border-gray-200 h-12 relative cursor-pointer hover:bg-gray-50"
                      onClick={() => handleTimeSlotClick(day, hour)}
                    >
                      {meetings.filter(meeting => 
                        isSameDay(meeting.startTime, day) && 
                        meeting.startTime.getHours() === hour
                      ).map(meeting => (
                        <Draggable key={meeting.id} draggableId={meeting.id} index={0}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="absolute left-0 right-0 bg-blue-100 p-1 rounded-md text-xs"
                              style={{
                                ...provided.draggableProps.style,
                                top: '0',
                                height: `${(meeting.endTime.getHours() - meeting.startTime.getHours()) * 48}px`
                              }}
                            >
                              <div className="font-semibold truncate">{meeting.title}</div>
                              <div className="truncate text-gray-600">{meeting.location}</div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </React.Fragment>
          ))}
        </div>
      </DragDropContext>
    );
  };

  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const startWeek = startOfWeek(start, { weekStartsOn: 1 });
    const endWeek = endOfWeek(end, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: startWeek, end: endWeek });

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}
          
          {allDays.map(day => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayMeetings = meetings.filter(meeting => isSameDay(meeting.startTime, day));
            
            return (
              <Droppable key={day.toString()} droppableId={`${format(day, 'yyyy-MM-dd')}-9`}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      'min-h-[100px] border border-gray-200 p-1 cursor-pointer hover:bg-gray-50',
                      !isCurrentMonth && 'bg-gray-50'
                    )}
                    onClick={() => handleTimeSlotClick(day, 9)}
                  >
                    <div className="text-right text-sm text-gray-500">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayMeetings.map(meeting => (
                        <Draggable key={meeting.id} draggableId={meeting.id} index={0}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-blue-100 p-1 rounded-md text-xs"
                            >
                              <div className="font-semibold truncate">{meeting.title}</div>
                              <div className="truncate text-gray-600">
                                {format(meeting.startTime, 'HH:mm')}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">Calendrier</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewType('day')}
                className={`px-4 py-2 rounded-md ${
                  viewType === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-4 py-2 rounded-md ${
                  viewType === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`px-4 py-2 rounded-md ${
                  viewType === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Mois
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium">{getDateRange()}</span>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 overflow-x-auto">
            {viewType === 'day' && renderDayView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'month' && renderMonthView()}
          </div>
        </div>
      </main>

      {/* Quick Add Meeting Button */}
      <button
        onClick={() => {
          setNewMeeting({
            title: '',
            startTime: '',
            endTime: '',
            location: '',
            firstName: '',
            lastName: '',
            description: ''
          });
          setIsNewMeetingModalOpen(true);
        }}
        className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Users className="w-6 h-6" />
      </button>

      {/* New Meeting Modal */}
      {isNewMeetingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nouveau Rendez-vous</h2>
              <button
                onClick={() => setIsNewMeetingModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <input
                  type="text"
                  required
                  value={newMeeting.title}
                  onChange={e => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date et heure de début</label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeeting.startTime}
                    onChange={e => setNewMeeting(prev => ({ ...prev, startTime: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date et heure de fin</label>
                  <input
                    type="datetime-local"
                    required
                    value={newMeeting.endTime}
                    onChange={e => setNewMeeting(prev => ({ ...prev, endTime: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lieu</label>
                <input
                  type="text"
                  required
                  value={newMeeting.location}
                  onChange={e => setNewMeeting(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    required
                    value={newMeeting.firstName}
                    onChange={e => setNewMeeting(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    required
                    value={newMeeting.lastName}
                    onChange={e => setNewMeeting(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={e => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewMeetingModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;