'use client';

import React, { useTransition } from 'react';
import { markNotificationReadAction, markAllNotificationsReadAction } from '../lib/notifications/actions';

interface Props {
  mode: 'single';
  notificationId: string;
}

interface AllProps {
  mode: 'all';
}

export default function NotificationMarkRead(props: Props | AllProps) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      if (props.mode === 'all') {
        void markAllNotificationsReadAction();
      } else {
        void markNotificationReadAction(props.notificationId);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-[10px] font-semibold text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-50"
      aria-label={props.mode === 'all' ? 'Mark all as read' : 'Mark as read'}
    >
      {pending ? '…' : props.mode === 'all' ? 'Mark all read' : 'Mark read'}
    </button>
  );
}
