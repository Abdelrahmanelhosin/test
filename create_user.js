import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xledmhxdjxswaxynsfmr.supabase.co';
const supabaseKey = 'sb_publishable_z1o0Y5ZVgucL71u73K12_g_4kZk9zR7';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'kaptan@ornek.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Mustafa Kaptan',
        avatar_url: 'https://i.pravatar.cc/150?u=mustafa'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('User created successfully:', data.user.email);
    console.log('Please log in with:');
    console.log('Email: kaptan@ornek.com');
    console.log('Password: password123');
  }
}

createTestUser();
