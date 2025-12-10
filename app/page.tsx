import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/Navbar'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen pattern-bg">
      <Navbar user={user} />
      <main className="pt-24 md:px-10 px-3">
        <h1>Welcome to My Next.js App</h1>
      </main>
    </div>
  );
}
