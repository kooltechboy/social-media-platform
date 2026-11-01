import type { Metadata } from 'next';
import PublicFrontDoor from '../../components/public-front-door';

export const metadata: Metadata = {
  title: 'About TUKUBI — The Caribbean Connected',
  description:
    'A simple, powerful platform for the Caribbean and our global community. Connect with real people, share Caribbean sounds, shorts, events, and trade in our sovereign marketplace.',
};

export default function AboutPage() {
  return <PublicFrontDoor />;
}
