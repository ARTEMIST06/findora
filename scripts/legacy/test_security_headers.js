fetch("http://localhost:3000/")
  .then(res => {
    console.log("Status:", res.status);
    console.log("Cross-Origin-Opener-Policy:", res.headers.get("Cross-Origin-Opener-Policy"));
    console.log("Content-Security-Policy:", res.headers.get("Content-Security-Policy") ? "Present" : "Missing");
    console.log("Strict-Transport-Security:", res.headers.get("Strict-Transport-Security"));
    const csp = res.headers.get("Content-Security-Policy") || "";
    if (csp.includes("https://*.firebaseapp.com") && csp.includes("https://accounts.google.com")) {
      console.log("CSP Configuration: PASS (Firebase and Google permitted)");
    } else {
      console.log("CSP Configuration: FAIL", csp);
    }
  })
  .catch(err => console.error(err));
