import { describe, it, expect } from 'vitest';
import clientPromise from '../src/lib/mongodb';
import { authOptions } from '../src/lib/authOptions';
import CredentialsProvider from "next-auth/providers/credentials";

describe('MongoDB Connection', () => {
  it('should connect to MongoDB successfully', async () => {
    const client = await clientPromise;
    const db = client.db();
    const collections = await db.collections();
    expect(collections).toBeDefined();
  });
});

describe('NextAuth Configuration', () => {
  it('should have NEXTAUTH_SECRET set', () => {
    expect(authOptions.secret).toBeDefined();
    expect(authOptions.secret).not.toBe('');
  });

  it('should use MongoDBAdapter', () => {
    expect(authOptions.adapter).toBeDefined();
  });

  it('should have CredentialsProvider configured', () => {
    const providers = authOptions.providers || [];
    const hasCredentialsProvider = providers.some(
      (provider) => provider.id === 'credentials'
    );
    expect(hasCredentialsProvider).toBe(true);
  });
});

import { GET as nextAuthGET } from '../src/app/api/auth/[...nextauth]/route';

describe('Deprecated NextAuth API Route', () => {
  it('should not expose NextAuth API route', async () => {
    // Call the GET handler directly instead of fetch
    const response = await nextAuthGET();
    expect(response.status).toBe(404);
    const text = await response.text();
    expect(text).toContain('NextAuth has been replaced with Firebase Auth');
  });
});
