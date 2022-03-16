// Replace the ${API_KEY} below with your own key from https://www.alphavantage.co/support/#api-key
// Reference: https://www.alphavantage.co/documentation/
const API_KEY = "";
const ALPHA_VANTAGE_API_URL = "https://www.alphavantage.co/query";

function getHeaders() {
  const headers = new Headers({
    "User-Agent": "request",
    "Accept": "application/json",
    "Content-Type": "application/json",
  });
  return headers;
}

const getExchangeRate = async (fromCurrency: string, toCurrency: string = "CAD") => {
  if (!API_KEY) {
    throw new Error("Invalid or missing API Key!");
  }

  const url = new URL(ALPHA_VANTAGE_API_URL);
  url.search = new URLSearchParams({ apikey: API_KEY, function: "CURRENCY_EXCHANGE_RATE", from_currency: fromCurrency, to_currency: toCurrency }).toString();
  //console.log(url);
  let res = await fetch(url, {
    headers: getHeaders(),
  });
  if (res.status == 200) {
    const contentType = res.headers.get("content-type");
    let data: any;
    if (contentType && (contentType?.startsWith("application/json") || contentType?.startsWith("text/json"))) {
      data = await res.json();
      return data;
    } else {
      console.log("Unexpected", contentType);
      return null;
    }
  } else {
    console.error(res);
  }

  return null;
}

const getDailySeries = async (symbol: string) => {
  if (!API_KEY) {
    throw new Error("Invalid or missing API Key!");
  }

  const url = new URL(ALPHA_VANTAGE_API_URL);
  url.search = new URLSearchParams({ apikey: API_KEY, function: "TIME_SERIES_DAILY", outputsize: "compact", symbol: symbol }).toString();
  //console.log(url);
  let res = await fetch(url, {
    headers: getHeaders(),
  });
  if (res.status == 200) {
    const contentType = res.headers.get("content-type");
    let data: any;
    if (contentType && (contentType?.startsWith("application/json") || contentType?.startsWith("text/json"))) {
      data = await res.json();
      return data;
    } else {
      console.log("Unexpected", contentType);
      return null;
    }
  } else {
    console.error(res);
  }

  return null;
}

//const result = await getDailySeries("SHOP.TO");
const result = await getExchangeRate("USD");

console.log(result);