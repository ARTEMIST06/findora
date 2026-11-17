with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("await getAuth().verifyIdToken(token)", "await getAuth(adminApp).verifyIdToken(token)")
content = content.replace("const adminDb = getFirestore();", "")

with open("server.ts", "w") as f:
    f.write(content)
