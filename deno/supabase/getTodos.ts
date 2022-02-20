// Update URL as appropriate
//const API_URL = "http://localhost:8000/todos";
const API_URL = "https://katzemeo.deno.dev/todos";

function getHeaders() {
  /*const b64: string = base64.fromUint8Array(
    new TextEncoder().encode(`${API_USER}:${API_PASSWORD}`),
  );*/
  const headers = new Headers({
    //"Authorization": `Basic ${b64}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  });
  return headers;
}

const getTodos = async () => {
  let res = await fetch(API_URL, {
    //headers: getHeaders(),
  });
  if (res.status == 200) {
    const contentType = res.headers.get("content-type");
    let data: any;
    if (contentType && (contentType?.startsWith("application/json") || contentType?.startsWith("text/json"))) {
      data = await res.json();
      return data;
    } else {
      console.log("Unexpected ", contentType);
      return null;
    }
  } else {
    console.error(res);
  }

  return null;
}

const createTodos = async () => {
  for (let i = 0; i < 10; i++) {
    await createTodo({ title: `This is todo ${i + 1}` });
  }
}

const createTodo = async (todo: any) => {
  let res = await doPost(getHeaders(), API_URL, todo);
  if (res.status == 201 || res.status == 200) {
    const contentType = res.headers.get("content-type");
    let data: any = null;
    if (contentType && (contentType?.startsWith("application/json") || contentType?.startsWith("text/json"))) {
      data = await res.json();
    } else if (contentType && contentType?.startsWith("text/plain")) {
      data = await res.text();
    } else {
      console.error("Unexpected ", contentType);
    }
    return data;
  } else {
    console.error(res);
  }

  return null;
}

function doPost(headers: any, url: string, data: object) {
  console.log("POST", url);
  console.log("data", data);
  return fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}

function doPut(headers: any, url: string, data: object) {
  console.log("PUT", url);
  console.log("data", data);
  return fetch(url, {
    method: "PUT",
    headers: headers,
    body: JSON.stringify(data),
  });
}

// Create dummy Todos
//await createTodos();

console.log(await getTodos());