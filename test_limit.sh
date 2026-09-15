for i in {1..205}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/fetch-product -H "Content-Type: application/json" -d '{"url":"https://www.amazon.in/dp/B000000000", "merchantId":"amazon"}')
  echo $response
done | tail -n 10
