import { h, renderSSR, Helmet } from './nano.ts'
import { serve } from 'https://deno.land/std@0.116.0/http/server.ts'

import { Hello } from './components/Hello.tsx'
import { Comments } from './components/Comments.tsx'

function getDateTime() {
  const dt = new Date();
  return `${dt.getFullYear().toString().padStart(4, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getDate().toString().padStart(2, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt.getSeconds().toString().padStart(2, '0')}`;
}
const now = getDateTime();
const comments = [`The current time is ${now}`, 'This is a sample Nano JSX App', "http://katzemeo.deno.dev"]

const App = () => (
  <div>
    <Helmet>
      <title>The KatzeMèo</title>
      <meta name="description" content="Server Side Rendered Nano JSX Application" />
    </Helmet>

    <Hello />

    <h2>Please leave a comment:</h2>

    <div id="comments">
      <Comments comments={comments} />
    </div>

    <h3>Follow me on Twitter at @katzemeo</h3>
  </div>
)

const ssr = renderSSR(<App />)
const { body, head, footer } = Helmet.SSR(ssr)

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${head.join('\n')}
  </head>
  <body>
    ${body}
    ${footer.join('\n')}
  </body>
</html>`

// TODO - rewrite to use more efficicient byobRequest for byte streams
// https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_byte_streams
async function createReadableStream(fileName) {
  console.log(`createReadableStream("${fileName}")...`);
  const body = new ReadableStream({
    //type: "bytes",
    async start(controller) {
      let numberOfBytesRead = 0;
      const file = await Deno.open(fileName, {read: true});
      const readBlockSize=100000;
      while (true) {
        await Deno.seek(file.rid, numberOfBytesRead, Deno.SeekMode.Current)
        const buf = new Uint8Array(readBlockSize);
        numberOfBytesRead = await Deno.read(file.rid, buf);
        if (!numberOfBytesRead) {
          console.log(`createReadableStream("${fileName}") EOF!`);
          controller.close();
          break;
        }
        console.log(`createReadableStream("${fileName}") - read ${numberOfBytesRead} byte(s)`);
        if (numberOfBytesRead === buf.length) {
          console.log(`createReadableStream("${fileName}") - Full chunk`);
          controller.enqueue(buf);
        } else {
          console.log(`createReadableStream("${fileName}") - Partial chunk`);
          const bufResized = new Uint8Array(buf, 0, numberOfBytesRead);
          controller.enqueue(bufResized);
        }
      }
      file.close();
    },
  });
  return body;
}

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith("/favicon.")) {
    //console.debug(`${pathname}`);
    const file = await Deno.readFile("."+ pathname);
    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } else if (pathname.startsWith("/style.css")) {
    //console.debug(`${pathname}`);
    const file = await Deno.readFile("./style.css");
    return new Response(file, {
      headers: {
        "content-type": "text/css",
      },
    });
  } else if (pathname.startsWith("/dnf4life.")) {
    //console.debug(`${pathname}`);

    // Note 1: reading entire into memory fails on Deno Deploy due to 512MB max memory is available!
    // https://docs.deno.com/subhosting/manual/pricing_and_limits/#:~:text=512MB%20max%20memory%20is%20available.
    //
    // Note 2: Godot 4.3 or later required for streaming?
    // [HTML5] Replace XMLHttpRequest(s) with Fetch. #46728
    // https://github.com/godotengine/godot/pull/46728/commits/fd7697718311338fa1d546ded4f8dc4a8a9ae8eb
    let body: any = await Deno.readFile("."+ pathname);
    /*
    if (pathname.endsWith(".wasm") || pathname.endsWith(".pck")) {
      body = await createReadableStream("."+ pathname);
    } else {
      body = await Deno.readFile("."+ pathname);
    }
    */
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000",
      },
    });
  }

  try {
    if (pathname == "/ping") {
      return new Response(`OK`);
    }

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.log(`Unable to process request - ${error}`);
    return new Response(`Unexpected error`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}

const PORT = Deno.env.get("PORT") ?? "8000";
const addr = `:${PORT}`;
console.log(`Listening on http://localhost${addr}`);
await serve(handleRequest, { addr });
