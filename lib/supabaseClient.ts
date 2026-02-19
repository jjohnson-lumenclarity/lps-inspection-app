import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://latrpcynyafmknmcvgha.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHJwY3lueWFmbWtubWN2Z2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTE0NjEsImV4cCI6MjA4NjQ4NzQ2MX0.h5nIamRUliPjyBxja7mr6oSm6RCsYfuLcABlCAl-2Kg'

export const supabase = createClient(supabaseUrl, supabaseKey)

