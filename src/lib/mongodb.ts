import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI || '';
const options = {
  connectTimeoutMS: 5000,      // 5 seconds
  socketTimeoutMS: 30000,      // 30 seconds
  serverSelectionTimeoutMS: 5000, // 5 seconds
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true
};

let client;
let clientPromise: Promise<MongoClient>;

// Create a mock MongoDB client for development when connection fails
const createMockClient = () => {
  console.warn("⚠️ Using mock MongoDB client - database connection failed");
  
  // Create a mock MongoDB client that returns empty arrays or mock data
  const mockClient = {
    db: () => ({
      collection: (collectionName: string) => ({
        find: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({
                toArray: async () => {
                  console.log(`Mock DB: Returning empty array for ${collectionName}`);
                  return [];
                }
              })
            })
          }),
          toArray: async () => []
        }),
        findOne: async () => {
          if (collectionName === 'users') {
            return { _id: 'mock-user-id', username: 'MockUser', email: 'mock@example.com' };
          }
          return null;
        },
        insertOne: async () => ({ insertedId: `mock-${Date.now()}` }),
        updateOne: async () => ({ modifiedCount: 1 }),
        deleteOne: async () => ({ deletedCount: 1 }),
        countDocuments: async () => 0
      })
    }),
    connect: async () => mockClient
  };
  
  return Promise.resolve(mockClient as unknown as MongoClient);
};

try {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect()
        .catch(err => {
          console.error("MongoDB connection error:", err);
          return createMockClient();
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} catch (error) {
  console.error("MongoDB initialization error:", error);
  
  // In development, use mock client as fallback
  if (process.env.NODE_ENV === "development") {
    clientPromise = createMockClient();
  } else {
    throw error; // Re-throw in production
  }
}

// Export a module-scoped MongoClient promise
export default clientPromise; 