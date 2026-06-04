import { Email } from '../types';

export const mockEmails: Email[] = [
  {
    id: '1',
    sender: 'GitHub',
    subject: 'Your weekly activity report',
    preview: 'Here is a summary of your activity for the past week...',
    date: '10:00 AM',
    isRead: false,
    category: 'updates',
  },
  {
    id: '2',
    sender: 'Alex from warpSpeed',
    subject: 'Welcome to the team!',
    preview: 'We are thrilled to have you on board. Here are some resources...',
    date: 'Yesterday',
    isRead: true,
    category: 'primary',
  },
  {
    id: '3',
    sender: 'Acme Corp',
    subject: '50% off all shoes!',
    preview: 'Don\'t miss out on our biggest sale of the year. Grab your...',
    date: 'Oct 24',
    isRead: false,
    category: 'promotions',
  },
  {
    id: '4',
    sender: 'Google Calendar',
    subject: 'Event Reminder: Sync',
    preview: 'This is a reminder that you have an upcoming event...',
    date: 'Oct 23',
    isRead: true,
    category: 'updates',
  },
];
