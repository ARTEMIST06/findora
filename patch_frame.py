import re

with open('server.ts', 'r') as f:
    code = f.read()

old_helmet = """        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Prevents loading external product images if enabled
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for Firebase Google Auth popup
  }));"""

new_helmet = """        upgradeInsecureRequests: [],
        frameAncestors: ["'self'", "https://aistudio.google.com", "https://*.googleusercontent.com"], // Allow AI Studio iframe preview
      },
    },
    xFrameOptions: false, // Disable X-Frame-Options to allow framing in AI Studio preview
    crossOriginEmbedderPolicy: false, // Prevents loading external product images if enabled
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for Firebase Google Auth popup
  }));

  // Add Permissions-Policy (Helmet v7 removed it from default, we add it manually)
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
"""

code = code.replace(old_helmet, new_helmet)

with open('server.ts', 'w') as f:
    f.write(code)
print("Patched frame protection")
