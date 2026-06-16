import * as admin from 'firebase-admin';

try {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ship-auth',
    });
  }
} catch (error) {
  console.warn('Firebase Admin SDK could not be initialized with default credentials. Using dummy credential for development/testing.');
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'ship-auth',
    credential: {
      getAccessToken: () => Promise.resolve({
        access_token: 'dummy_token',
        expires_in: 3600,
      }),
    },
  });
}

export const firebaseAdmin = admin;
