// ============================================================
// VacumQInvest — OAuth Callback Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', origin));
  }

  try {
    const supabase = createClient();

    // Exchange auth code for session
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !sessionData?.user) {
      console.error('Code exchange failed:', exchangeError);
      return NextResponse.redirect(
        new URL('/login?error=exchange_failed', origin)
      );
    }

    const userEmail = sessionData.user.email;

    if (!userEmail) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL('/login?error=no_email', origin)
      );
    }

    // Check if user email is in approved_emails table
    // Use service client to bypass RLS on approved_emails
    const serviceClient = createServiceClient();

    const { data: approved, error: approvedError } = await serviceClient
      .from('approved_emails')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (approvedError) {
      console.error('Failed to check approved emails:', approvedError);
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL('/login?error=server_error', origin)
      );
    }

    if (!approved) {
      // User is not approved — sign out and redirect
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', origin)
      );
    }

    // User is approved — redirect to home
    return NextResponse.redirect(new URL('/', origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=unexpected', request.url)
    );
  }
}
