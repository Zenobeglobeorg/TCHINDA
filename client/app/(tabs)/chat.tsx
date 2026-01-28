/**
 * Route de chat dans les tabs
 * Redirige vers /chat
 */

import { Redirect } from 'expo-router';

export default function ChatTab() {
  return <Redirect href="/chat" />;
}
