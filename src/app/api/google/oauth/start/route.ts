import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import crypto from 'node:crypto';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return NextResponse.json({ error: 'Credenciais Google ainda não configuradas.' }, { status: 503 });
  const state = crypto.randomBytes(24).toString('base64url');
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const url = oauth2.generateAuthUrl({ access_type: 'offline', prompt: 'consent', state,
    scope: ['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/documents'] });
  const response = NextResponse.redirect(url);
  response.cookies.set('google_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV==='production', sameSite:'lax', maxAge:600, path:'/' });
  return response;
}
