import re
with open("server.ts", "r") as f:
    content = f.read()

# I see lines:
#  // Configure rate limiter for external API fetches
#  }
#  });
#  // API routes

content = content.replace('''  // Configure rate limiter for external API fetches
  }
  });''', '  // Configure rate limiter for external API fetches\n')

with open("server.ts", "w") as f:
    f.write(content)
