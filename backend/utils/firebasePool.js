import admin from 'firebase-admin';

class FirebaseConnectionPool {
  constructor(maxSize = 10) {
    this.pool = [];
    this.maxSize = maxSize;
    this.inUse = new Set();
  }

  async getConnection() {
    // Try to get an existing idle connection
    const connection = this.pool.find(conn => !this.inUse.has(conn));
    if (connection) {
      this.inUse.add(connection);
      return connection;
    }

    // Create new connection if pool isn't full
    if (this.pool.length < this.maxSize) {
      const newConnection = admin.firestore();
      this.pool.push(newConnection);
      this.inUse.add(newConnection);
      return newConnection;
    }

    // Wait for a connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const availableConnection = this.pool.find(conn => !this.inUse.has(conn));
        if (availableConnection) {
          clearInterval(checkInterval);
          this.inUse.add(availableConnection);
          resolve(availableConnection);
        }
      }, 100);
    });
  }

  releaseConnection(connection) {
    this.inUse.delete(connection);
  }
}

export const connectionPool = new FirebaseConnectionPool(20);

// Utility function to execute queries with automatic connection management
export async function executeQuery(callback) {
  const connection = await connectionPool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connectionPool.releaseConnection(connection);
  }
}