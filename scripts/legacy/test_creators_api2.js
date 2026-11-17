const clientId = process.env.AMAZON_CREATORS_API_CREDENTIAL_ID;
const clientSecret = process.env.AMAZON_CREATORS_API_SECRET;
const partnerTag = process.env.AMAZON_PARTNER_TAG || "findora-21";

async function run() {
  console.log("Fetching token...");
  const tokenRes = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "creatorsapi::default"
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return;

  console.log("Fetching item...");
  const itemRes = await fetch("https://creatorsapi.amazon/catalog/v1/getItems", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + tokenData.access_token,
      "Content-Type": "application/json",
      "x-marketplace": "www.amazon.in"
    },
    body: JSON.stringify({
      itemIds: ["B08N5W4NNB"],
      itemIdType: "ASIN",
      marketplace: "www.amazon.in",
      partnerTag: partnerTag
    })
  });
  const itemData = await itemRes.json();
  console.log("Item Data:", JSON.stringify(itemData, null, 2));
}

run();
