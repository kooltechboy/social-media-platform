import type { Metadata } from 'next';
import { AntiliaMasterGateway } from '../../components/gateway/AntiliaMasterGateway';

export const metadata: Metadata = {
  title: 'ANTILIA — One Caribbean. One Community. One Digital Home.',
  description:
    'Sign in to ANTILIA — The premier digital platform connecting 59M+ Caribbean people, businesses, creators, music, and the global diaspora.',
};

export default function LoginPage() {
  return <AntiliaMasterGateway />;
}
