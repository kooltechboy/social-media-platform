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
      className="text-xs md:text-sm font-bold text-brand-sandstone/60 hover:text-brand-caribbeanSea transition-colors disabled:opacity-50 min-h-[32px] md:min-h-[36px] px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer inline-flex items-center"
      aria-label={props.mode === 'all' ? 'Mark all as read' : 'Mark as read'}
    >
      {pending ? '…' : props.mode === 'all' ? 'Mark all read' : 'Mark read'}
    </button>
  );
}
