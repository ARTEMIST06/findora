with open("server.ts", "r") as f:
    content = f.read()

# I see a dangling catch block around line 32:
# dotenv.config();
# catch (e) {
#    console.error("Metadata extraction error:", e);
#    return null;
#  }
# }
# This is left over from safeExtractMetadata removal (we probably only removed the function signature).

content = content.replace('''catch (e) {
    console.error("Metadata extraction error:", e);
    return null;
  }
}''', '')

with open("server.ts", "w") as f:
    f.write(content)

