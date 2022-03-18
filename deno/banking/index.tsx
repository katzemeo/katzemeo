import { parse as parseArgs } from "https://deno.land/std@0.128.0/flags/mod.ts"
import { serve } from "https://deno.land/std@0.128.0/http/server.ts";
import { h, renderSSR, Helmet } from "https://deno.land/x/nano_jsx@v0.0.30/mod.ts";
import { open } from "https://deno.land/x/open/index.ts";
import { Grid } from "./Grid.tsx";
import { checkFiles, categorizeFiles } from "./csvCategorize.ts"

const output: any = [];
const title = `TX Categories`;

const App = () => (
  <div>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={title} />
    </Helmet>
    <div id="table">
      <Grid args={args} rows={output} />
    </div>
  </div>
)

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  try {
    if (pathname == "/ping") {
      return new Response(`OK`);
    }
    const html = renderHTML();
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.log(`Unable to process request - ${error}`);
    return new Response(`Unexpected error`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}

function checkUsage(args: any) {
  if (args["_"].length > 0) {
    return false;
  }
  return true;
}

const args = parseArgs(Deno.args, {
  default: {
    s: false,
    debug: false,
    d: ".",
    o: false,
    sort: "mean"
  },
  boolean: ["o", "stats", "debug"],
  string: ["p", "f", "d", "sort"],
  alias: {
    p: "port",
    o: "open",
    f: "file",
    d: "dir",
    s: "summary",
    h: "help"
  }
});

if (args.debug) {
  console.log(args);
}

if (args.help || !checkUsage(args)) {
  console.log(`Parse banking CSV files and summarize the transactions based on "Description 1" and "Description 2" columns in CAD$\n
Examples:
  csvSPA.exe -d c:\\laundromat\\bank -f "2020 - banking.csv" -f "2021 - banking.csv" --sort count -o
  csvSPA.exe -d c:\\laundromat\\bank --summary --open

Usage:
  -f or --file <CSV file> : specify the path to CSV file (repeat option to specify multiple files)
  -d or --dir <source dir> : specify the folder containing CSV file(s) to parse (defaults to current directory)
  -s or --summary: print transaction summary for each CSV file as well as grand totals
  --sort: sort the categories by "desc" asc, "count" desc, or "value" asc (default)
  -o or --open: automatically open default web browser to show the transaction summary
  -p or --port: specify the port to use (defaults to 7777)
  --debug : print diagnostics for validating the processing
  -h or --help : show this usage help`);
} else {
  const files: string[] = [];
  try {
    checkFiles(args, files);
    const result = await categorizeFiles(args, files, output);
    if (!result) {
      Deno.exit(-1);
    }

    if (args.dump) {
      console.debug(output);
    }
    output.sort(function (a: any, b: any) {
      if (args.sort === "count") {
        return b.count - a.count;
      } else if (args.sort.startsWith("desc")) {
        return a.desc.localeCompare(b.desc)
      } else if (args.sort === "value") {
        return a.value - b.value;
      } else if (args.stats) {
        return a.mean - b.mean;
      }
      return a.value - b.value;
    });

    const port = Number(args.port ?? Deno.env.get("PORT") ?? 7777);
    console.log(`Listening on http://localhost:${port}`);

    if (args.open) {
      open(`http://localhost:${port}`);
    }

    await serve(handleRequest, { port });

  } catch (err) {
    if (args.debug) {
      console.error(err);
    } else {
      console.error(`Error: ${err.message}`);
    }
  }
}

function renderHTML() {
  const ssr = renderSSR(<App />)
  const { body, head, footer } = Helmet.SSR(ssr)
  
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
      ${head.join('\n')}
    </head>
    <body>
      ${body}
      ${footer.join('\n')}
    </body>
  </html>`

  return html;
}