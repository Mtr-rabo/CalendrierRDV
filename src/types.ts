export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  firstName?: string;
  lastName?: string;
  description?: string;
}

export type ViewType = 'day' | 'week' | 'month';

export interface NewMeetingFormData {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  firstName: string;
  lastName: string;
  description: string;
}

export interface DragResult {
  meetingId: string;
  newStartTime: Date;
  newEndTime: Date;
}