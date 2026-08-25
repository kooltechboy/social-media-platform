import type { Metadata } from 'next';
import { GatewayShell } from '../../components/gateway/GatewayShell';
import { SignInForm } from '../../components/gateway/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In | ANTILIA Gateway',
  description: 'Sign in to your ANTILIA account — The digital home of the Caribbean and its global diaspora.',
};

export default function LoginPage() {
  return (
    <GatewayShell>
      <SignInForm />
    </GatewayShell>
  );
}
