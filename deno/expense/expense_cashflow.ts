
function getHeaders() {
  const headers = new Headers({
    "User-Agent": "Silvester",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": Deno.env.get("API_KEY") ?? "",
  });
  return headers;
}

function doPost(headers: any, url: any, data: object) {
  return fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}

export const computeCashFlow = async (expenses: any, guid: any = null, profile: string = "default") => {
  const data: any = { status: "ERROR" };
  const urlPath = Deno.env.get("API_URL");
  if (!urlPath) {
    return data;
  }

  const url = new URL(urlPath);
  if (guid || profile) {
    const params: any = {};
    if (guid) {
      params.guid = guid;
    }
    if (profile) {
      params.profile = profile;
    }
    url.search = new URLSearchParams(params).toString();
  }

  let res = await doPost(getHeaders(), url, expenses);
  if (res.status == 201 || res.status == 200) {
    const contentType = res.headers.get("content-type");
    let result: any;
    if (contentType && (contentType?.startsWith("application/json") || contentType?.startsWith("text/json"))) {
      result = await res.json();
      data.status = "OK";
      data.result = result;
    } else {
      console.log("computeCashFlow() - Unexpected", contentType);
      data.result = "Unexpected error!";
    }
  } else if (res.status == 401) {
    console.warn("computeCashFlow() - service unauthorized");
    data.result = "Unauthorized!";
  } else if (res.status == 500) {
    console.warn("computeCashFlow() - service unavailable");
    data.result = "Unavailable";
  } else {
    console.error(res);
  }
  return data;
}
