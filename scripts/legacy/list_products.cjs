const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

async function run() {
    const res = await fetch('http://localhost:3000/api/health'); // just checking if server is up
    console.log(await res.text());
}
run();
