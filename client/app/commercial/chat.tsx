/**
 * Route de chat pour commercial
 * Redirige vers /chat
 */

import { Redirect } from 'expo-router';

export default function CommercialChatTab() {
  return <Redirect href="/chat" />;
}
