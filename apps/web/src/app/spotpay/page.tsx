import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SpotPayRedirectPage() {
  // Safe redirect from legacy /spotpay to /financial-center
  redirect('/financial-center');
}
