// Ten plik istnieje dla kompatybilności wstecznej.
// Projekt używa demo-client.ts / data-server.ts zamiast Supabase.
// W przyszłości zostanie zastąpiony przez klienta Firebase.

export { createServerDataClient as createServerSupabaseClient, createAdminDataClient as createAdminSupabaseClient } from './data-server'
