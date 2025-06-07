# Configuring CORS for Firebase Storage

To fix the CORS issues with your Firebase Storage, you need to update the Firebase Storage security rules. Here's how:

1. Go to the [Firebase Console](https://console.firebase.google.com/) and select your project "sociodent-smile-database"

2. In the left sidebar, click "Storage"

3. Go to the "Rules" tab at the top

4. Update your Storage rules to include CORS headers. Here's a sample configuration:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow read access to anyone
      allow read;
      
      // Allow write access only to authenticated users
      allow write: if request.auth != null;
      
      // Add CORS headers for public files
      function corsHeaders() {
        return response.headers = response.headers.concat({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
      }
      
      // Apply CORS headers to all responses
      match /{allPaths=**} {
        function publicRead() {
          return corsHeaders();
        }
        allow read: if publicRead();
      }
    }
  }
}
```

5. Click "Publish" to save your changes

6. For more control over CORS in Firebase Storage, you can also use the Firebase CLI with the following commands:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to your project directory
cd /Users/rsreeram/Downloads/sociosmile-with-database-main\ 2

# Set default project
firebase use sociodent-smile-database

# Create cors.json file
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition", "Cache-Control", "Authorization"]
  }
]
EOF

# Set CORS configuration for your bucket
firebase storage:cors update cors.json
```

After applying these changes, the CORS issues with your Firebase Storage should be resolved.
