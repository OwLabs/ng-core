import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Store the URI so test files can connect
  process.env.MONGO_URI = uri;
  // Store the instance reference for teardown
  // globalThis persists across the globalSetup/globalTeardown lifecycle
  (globalThis as any).__MONGOD__ = mongod;

  console.log(`\n🔌 MongoMemoryServer started at ${uri}\n`);
}
