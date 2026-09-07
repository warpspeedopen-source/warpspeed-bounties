import React from 'react';
import { ClassicInboxUI } from './ClassicInboxUI';

export default {
  title: 'ClassicInboxUI',
  component: ClassicInboxUI,
};

const mockEmails = [
  {
    id: '1',
    sender: 'Alice',
    subject: 'Meeting notes',
    snippet: 'Here are the notes from our last meeting...',
    time: '10:00 AM',
    isOpened: false,
  },
  {
    id: '2',
    sender: 'Bob',
    subject: 'Lunch?',
    snippet: 'Are we still on for lunch today?',
    time: 'Yesterday',
    isOpened: true,
  },
  {
    id: '3',
    sender: 'Charlie',
    subject: 'Project Update',
    snippet: 'The project is moving along nicely. We should be done by...',
    time: 'Monday',
    isOpened: true,
  },
];

export const Default = () => <ClassicInboxUI emails={mockEmails} />;
