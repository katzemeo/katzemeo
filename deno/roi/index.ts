import { serve } from 'https://deno.land/std@0.128.0/http/server.ts'
import { open } from "https://deno.land/x/open/index.ts";

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title id="title">Compound Annual Growth Rate (CAGR) @katzemeo</title>
  </head>
  <body>
  <script>
  const _percentFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFactionDigits: 2 }).format;
  const PCT = function (value) { if (!isNaN(value)) { return _percentFormat(value); } return ""; };
  const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency", currencyDisplay: "symbol", currencySign: "accounting" }).format;

  const removeChildren = (parent, header = 0) => {
    while (parent.lastChild && parent.childElementCount > header) {
      parent.removeChild(parent.lastChild);
    }
  };

  // CAGR = ((end point / start point)^1/n) - 1
  function computeCAGR(start, end, n) {
    let cagr = Math.pow((end/start), 1/n) - 1;
    //console.log(cagr);
    return cagr;
  }
  
  // ROI = (Gain from Investment - Cost of Investment) / Cost of Investment
  function calculate() {
    let el = document.getElementById("amount");
    let amount = parseInt(el.value);
    el = document.getElementById("return");
    let ret = parseInt(el.value);
    if (ret < 0) {
      alert("Return cannot be negative!");
      return;
    }
    let roi = (ret - amount) / amount;
    el = document.getElementById("roi");
    el.value = PCT(roi*100) +" %";

    let parentEl = document.getElementById("table");
    removeChildren(parentEl);
  
    el = document.getElementById("years");
    if (el.value) {
      let years = parseFloat(el.value);
      const cagr = computeCAGR(amount, ret, years);
      el = document.getElementById("cagr");
      el.value = PCT(cagr*100) +" %";

      value = amount;
      for (let i=1; i<=years; i++) {
        value += value * cagr;
        let li = document.createElement("li");
        li.innerText = "Year "+ i +" = "+ CUR(value);
        parentEl.appendChild(li);
      }
    }
  }
  </script>
  <p>
    <label>Amount</label><br>
    <input type="text" id="amount"/>
  </p>
  <p>
    <label>Return</label><br>
    <input type="text" id="return"/>
  </p>
  <p>
    <label>Years</label><br>
    <input type="text" id="years"/>
  </p>
  <p>
    <button type="button" onclick="calculate()">Calculate!</button>
  </p>
  <p>
    <label>ROI</label><br>
    <input type="text" id="roi" readonly="readonly"/>
  </p>
  <p>
    <label>CAGR</label><br>
    <input type="text" id="cagr" readonly="readonly"/>
  </p>
  <div id="table" />
  </body>
</html>`

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
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

const port = Number(Deno.env.get("PORT") ?? 7777);
console.log(`Listening on http://localhost:${port}`);
open(`http://localhost:${port}`);
await serve(handleRequest, { port });