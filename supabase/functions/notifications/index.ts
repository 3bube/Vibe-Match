// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const { chatRoomId, senderId, content } = await req.json()
  
  // Get the other participant
  const { data: participant } = await supabase
    .from('chat_participants')
    .select('user_id')
    .eq('chat_room_id', chatRoomId)
    .neq('user_id', senderId)
    .single()

  // Get user's notification settings/token
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('push_token')
    .eq('user_id', participant.user_id)
    .single()

  if (userSettings?.push_token) {
    // Send push notification using your preferred service
    // (e.g., web push, Firebase, OneSignal)
    await sendPushNotification(userSettings.push_token, {
      title: 'New Message',
      body: content
    })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notifications' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
