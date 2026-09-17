import re

with open("server.ts", "r") as f:
    content = f.read()

# Replace the import and initialization of adminDb
content = content.replace("import { getFirestore } from 'firebase-admin/firestore';", "import { getFirestore } from 'firebase-admin/firestore';\nimport { Firestore } from '@google-cloud/firestore';")

# Replace initialization
init_old = """  adminDb = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);"""
init_new = """  adminDb = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
  });"""
content = content.replace(init_old, init_new)

with open("server.ts", "w") as f:
    f.write(content)

