import { serve } from 'https://deno.land/std@0.128.0/http/server.ts'
import { open } from "https://deno.land/x/open/index.ts";

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap CSS & Font Awesome Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"
      integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <link href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" rel="stylesheet">
    <style>
      body {
        padding: 0;
        margin: 0;
        background-color: #eee
      }
      .border-grey {
        border: 1px solid;
        border-end-start-radius: 5px;
        border-end-end-radius: 5px;
        border-top: none;
        border-color: #dee2e6
      }
      .active {
        background-color: white
      }
      #myTab {
        background-color: #dee2e6
      }
      .nav-link {
        color: #666
      }
    </style>
    <title id="title">ROI Calculator @katzemeo</title>
  </head>
  <body>
  <!-- Option 1: Bootstrap Bundle with Popper -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
    crossorigin="anonymous">
  </script>
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
      if (isNaN(amount) || amount <= 0 || isNaN(ret) || ret < 0) {
        alert("Invalid inputs!");
        return;
      }
      let roi = (ret - amount) / amount;
      el = document.getElementById("roi");
      el.value = PCT(roi*100) +" % or "+ CUR(ret - amount);
      if (roi < 0) {
        el.className = "input-group-text text-danger";
      } else {
        el.className = "input-group-text text-success";
      }

      let parentEl = document.getElementById("table");
      removeChildren(parentEl);
    
      el = document.getElementById("years");
      if (el.value) {
        let years = parseFloat(el.value);
        const cagr = computeCAGR(amount, ret, years);
        el = document.getElementById("cagr");
        el.value = PCT(cagr*100) +" %";
        if (cagr < 0) {
          el.className = "input-group-text text-danger";
        } else {
          el.className = "input-group-text text-success";
        }

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

  <div class="container mt-5">
    <ul class="m-0 nav nav-fill nav-justified nav-tabs" id="myTab" role="tablist">
      <li class="nav-item" role="presentation" title="Return on Investments"> <button class="active nav-link" id="home-tab" data-bs-toggle="tab" data-bs-target="#home-pane" type="button" role="tab" aria-controls="home-pane" aria-selected="true"> <i class="fas fa-home"></i> Home </button> </li>
      <li class="nav-item" role="presentation" title="Compound Annual Growth Rate (CAGR)"> <button class="nav-link" id="cagr-tab" data-bs-toggle="tab" data-bs-target="#cagr-pane" type="button" role="tab" aria-controls="cagr-pane" aria-selected="false"> <i class="fas fa-percent"></i> CAGR </button> </li>
      <li class="nav-item" role="presentation" title="Cash Flow Analysis"> <button class="nav-link" id="cashflow-tab" data-bs-toggle="tab" data-bs-target="#cashflow-pane" type="button" role="tab" aria-controls="cashflow-pane" aria-selected="false"> <i class="fas fa-chart-line"></i> Cash Flow </button> </li>  
    </ul>
    <div class="border-grey bg-white p-3 tab-content">
      <div class="tab-pane active" id="home-pane" role="tabpanel" aria-labelledby="home-tab">
        <p> Welcome! </p>
        <p> The following tools can help you measure Return on Investments and assess your potential Cash Flow risks. </p>
        <ul>
          <li>Use the <a href="javascript:document.getElementById('cagr-tab').click()">CAGR</a> tab to help calculated the expected annual growth rate for your investments.</li>
          <li>Use the <a href="javascript:document.getElementById('cashflow-tab').click()">Cash Flow</a> tab to check if you have sufficient cash flow for your situation.</li>
        </ul>
      </div>
      <div class="tab-pane" id="cagr-pane" role="tabpanel" aria-labelledby="cagr-tab">
        <p>
        <label>Amount $</label><br>
        <input class="form-control" type="text" id="amount" size="50" maxlength="12"/>
        </p>
        <p>
          <label>Return $</label><br>
          <input class="form-control" type="text" id="return" size="50" maxlength="12"/>
        </p>
        <p>
          <label>Years</label><br>
          <input class="form-control" type="text" id="years" size="50" maxlength="2"/>
        </p>
        <p>
          <button class="btn btn-primary" type="button" onclick="calculate()">Calculate!</button>
        </p>
        <p>
          <label>ROI</label><br>
          <input class="input-group-text text-muted" type="text" id="roi" size="50" readonly="readonly"/>
        </p>
        <p>
          <label>CAGR</label><br>
          <input class="input-group-text text-muted" type="text" id="cagr" size="50" readonly="readonly"/>
        </p>
        <p id="table" />
      </div>
      <div class="tab-pane" id="cashflow-pane" role="tabpanel" aria-labelledby="cashflow-tab">
        <p> This is the Cash Flow tab! </p>
        <p> TODO - Implement feature to dynamically build revenue and expense models and analyze probability of crash or flow... </p>
      </div>
    </div>
  </div>
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
if (port == 7777) {
  open(`http://localhost:${port}`);
}
await serve(handleRequest, { port });