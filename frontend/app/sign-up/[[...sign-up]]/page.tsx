import { redirect } from 'next/navigation';

// Auth is disabled — redirect to home
export default function SignUpPage() {
  redirect('/');
}
