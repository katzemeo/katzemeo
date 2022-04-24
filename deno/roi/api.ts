function getHeaders(api_key: string) {
  const headers = new Headers({
    "User-Agent": "@katzemeo",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": api_key,
  });
  return headers;
}

class API {
  api_url = Deno.env.get("API_URL");
  api_key = Deno.env.get("API_KEY");

  async getCashFlow(guid: string, profile: string) {
    if (!this.api_url) {
      throw new Error("Invalid or missing API URL!");
    }

    if (!this.api_key) {
      throw new Error("Invalid or missing API Key!");
    }

    const url = new URL(`${this.api_url}/${guid}`);
    url.search = new URLSearchParams({ profile: profile }).toString();
    let res = await fetch(url, {
      headers: getHeaders(this.api_key),
    });
    if (res.status == 201 || res.status == 200) {
      const contentType = res.headers.get("content-type");
      let data: any;
      if (contentType && (contentType?.startsWith("application/json") || contentType?.startsWith("text/json"))) {
        data = await res.json();
        return data;
      } else {
        console.log("Unexpected", contentType);
        return null;
      }
    } else if (res.status == 401) {
      throw new Error("Invalid API Key!");
    } else {
      console.error(res);
    }

    return null;
  }
}

export default new API();