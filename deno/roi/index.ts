import { serve } from 'https://deno.land/std@0.128.0/http/server.ts'
import { open } from "https://deno.land/x/open/index.ts";
import { getCashFlow } from './cash_flow.ts';

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
      #tab-nav {
        background-color: #dee2e6
      }
      .nav-link {
        color: #666
      }
    </style>
    <title id="title">ROI Calculator @katzemeo</title>
    <link rel="icon" href="https://invest.npsolve.com/public/favicon.ico">
  </head>
  <body oncontextmenu="return false;">
  <!-- Option 1: Bootstrap Bundle with Popper -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
    crossorigin="anonymous">
  </script>
  <script>
    const JSON_HEADERS = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    const NOW = new Date();
    const _percentFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFactionDigits: 2 }).format;
    const PCT = function (value) { if (!isNaN(value)) { return _percentFormat(value); } return ""; };
    const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency", currencyDisplay: "symbol", currencySign: "accounting" }).format;
    var _guid = null;
    var _profile = null;
    var _cash_flow_template = null;

    const removeChildren = (parent, header = 0) => {
      while (parent.lastChild && parent.childElementCount > header) {
        parent.removeChild(parent.lastChild);
      }
    };

    const getFloatParam = (url, name, defaultValue) => {
      let value = url.searchParams.get(name);
      if (value) {
        value = parseFloat(value);
        if (!isNaN(value)) {
          return value;
        }
      }
      return defaultValue;
    };

    const configureTabs = () => {
      let tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
      tabs.forEach((tab) => {
        tab.addEventListener('show.bs.tab', function (event) {
          if (event.target && event.target.name === "cashflow") {
            if (!_cash_flow_template) {
              getCashflowTemplate();
            }
          }
          //event.target // newly activated tab
          //event.relatedTarget // previous active tab
        });
      });
    };

    const createDiv = (className, title=null) => {
      const el = document.createElement("div");
      el.className = className;
      if (title) {
        el.title = title;
      }
      return el;
    };

    const createValueControl = (entry) => {
      const el = document.createElement("input");
      el.id = entry.name;
      el.className = "form-control";
      el.type = entry.type ?? "number";
      if (entry.value !== undefined) {
        el.value = entry.value.toFixed(2);
      }
      el.min = entry.min ?? 0;
      if (entry.max !== undefined) {
        el.max = entry.max;
      }
      if (entry.step) {
        el.step = entry.step;
      }
      if (entry.pattern) {
        el.pattern = entry.pattern;
      }
      return el;
    };

    const createFreqControl = (entry) => {
      const el = document.createElement("input");
      el.id = entry.name +"_freq";
      el.className = "form-control";
      el.type = "number";
      el.value = entry.freq.every ?? 1;
      el.min = 1;
      el.max = 99;
      el.pattern = "^/d+$";
      return el;
    };
  
    const createOption = (name, caption, value) => {
      const el = document.createElement("option");
      el.value = name;
      el.innerText = caption;
      if (name == value) {
        el.selected = "selected";
      }
      return el;
    };

    const createPeriodSelect = (entry) => {
      const el = document.createElement("select");
      el.id = entry.name +"_period";
      el.className = "form-select";
      el.appendChild(createOption("day", "Day", entry.freq.period));
      el.appendChild(createOption("week", "Week", entry.freq.period));
      el.appendChild(createOption("month", "Month", entry.freq.period));
      el.appendChild(createOption("year", "Year", entry.freq.period));
      return el;
    };

    const buildCashFlowUI = () => {
      let groups = ["income_sources", "fixed_expenses", "variable_expenses"];
      groups.forEach((group) => {
        const groupEl = document.getElementById(group);
        _cash_flow_template[group].forEach((entry) => {
          const p = document.createElement("p");
          const divRow = createDiv("row align-items-center gx-1");
          const divCol = createDiv("col");
          const label = document.createElement("label");
          label.innerText = entry.caption +" $";
          label.appendChild(document.createElement("br"));
          divCol.appendChild(label);
  
          const divRowEntry = createDiv("row align-items-center gx-1");
          const divValue = createDiv("col-5");
          divValue.appendChild(createValueControl(entry));
          divRowEntry.appendChild(divValue);
          const divFreq = createDiv("col-auto", "Frequency");
          divFreq.appendChild(createFreqControl(entry));
          divRowEntry.appendChild(divFreq);
          const divPeriod = createDiv("col-auto", "Period");
          divPeriod.appendChild(createPeriodSelect(entry));
          divRowEntry.appendChild(divPeriod);
          divCol.appendChild(divRowEntry);
  
          divRow.appendChild(divCol);
          p.appendChild(divRow);
          groupEl.appendChild(p);
        });
      });
    };

    const getCashflowTemplate = () => {
      let url;
      const params = new URLSearchParams();
      if (_guid && _profile) {
        url = "/cashflow/api";
        params.set("guid", _guid);
        params.set("profile", _profile);
      } else {
        url = "/cashflow/template";
        if (_profile) {
          params.set("profile", _profile);
        }
      }
      fetch(url+"?"+params.toString(), {
        method: "GET",
        headers: JSON_HEADERS,
      }).then((res) => {
        if (res.status == 200) {
          res.json().then((data) => {
            _cash_flow_template = data;
            //console.log(_cash_flow_template);
            buildCashFlowUI();
          });
        } else {
          console.log("Unexpected response", res.status);
        }
      }).catch((error) => {
        console.error(error);
        window.alert("Unable to get cash flow template.  Please try again.");
      });
    };

    window.onload = function () {
      const url = new URL(window.location.href);
      _guid = url.searchParams.get("guid");
      _profile = url.searchParams.get("profile");
      configureTabs();

      let el;
      el = document.getElementById("income");
      el.value = getFloatParam(url, "income", 1000);
      el = document.getElementById("from_date");
      el.valueAsDate = new Date(NOW.getFullYear(), 0, 1);
      el = document.getElementById("to_date");
      el.valueAsDate = NOW;

      el = document.getElementById("amount");
      el.value = getFloatParam(url, "amount", 100000);
      el = document.getElementById("return");
      el.value = getFloatParam(url, "return", 250000);
      el = document.getElementById("years");
      el.value = getFloatParam(url, "years", 7);
      el = document.getElementById("start_year");
      el.value = NOW.getFullYear();

      let tab = url.searchParams.get("tab");
      if (!tab && url.pathname.length > 1) {
        tab = url.pathname.substring(1);
      }
      if (tab) {
        const tabEl = document.getElementById(tab+"-tab");
        if (tabEl) {
          tabEl.click();
        }
      }
    };

    function setTextColour(el, value) {
      if (value < 0) {
        el.className += " text-danger";
      } else {
        el.className += " text-success";
      }
    }

    function computeCAGR(start, end, n) {
      let cagr = Math.pow((end/start), 1/n) - 1;
      //console.log(cagr);
      return cagr;
    }

    function calculateIncome() {
      let el = document.getElementById("income");
      let income = parseFloat(el.value);
      try {
        el = document.getElementById("from_date");
        const fromDate = el.valueAsDate.getTime();
        el = document.getElementById("to_date");
        const toDate = el.valueAsDate.getTime();
        const delta = toDate - fromDate;
        if (isNaN(income) || isNaN(delta) || delta < 0) {
          alert("Invalid inputs!");
        } else {
          let days = 1 + (delta / 1000 / 60 / 60 / 24);
          el = document.getElementById("total_days");
          el.value = days;

          let average = income / days;
          el = document.getElementById("daily_average");
          el.value = CUR(average);

          let annual_income = average * 365;
          el = document.getElementById("monthly_income");
          el.value = CUR(annual_income/12);
          el = document.getElementById("annual_income");
          el.value = CUR(annual_income);
        }
      } catch (error) {
        //console.log(error);
        alert("Invalid inputs!");
      }
    }

    function calculateROI() {
      let el = document.getElementById("amount");
      let amount = parseFloat(el.value);
      el = document.getElementById("return");
      let ret = parseFloat(el.value);
      if (isNaN(amount) || amount <= 0 || isNaN(ret) || ret < 0) {
        alert("Invalid inputs!");
        return;
      }
      let roi = (ret - amount) / amount;
      el = document.getElementById("roi");
      el.value = PCT(roi*100) +" % or "+ CUR(ret - amount);
      if (roi < 0) {
        el.className = "form-control text-danger";
      } else {
        el.className = "form-control text-success";
      }

      let parentEl = document.getElementById("table");
      removeChildren(parentEl);
    
      el = document.getElementById("years");
      if (el.value) {
        let years = parseFloat(el.value);
        if (years > 0 && years < 100) {
          const cagr = computeCAGR(amount, ret, years);
          el = document.getElementById("cagr");
          el.value = PCT(cagr*100) +" %";
          if (cagr < 0) {
            el.className = "form-control text-danger";
          } else {
            el.className = "form-control text-success";
          }

          el = document.getElementById("start_year");
          let start_year = parseFloat(el.value);
          if (isNaN(start_year) || start_year < 1) {
            start_year = NOW.getFullYear();
          }
          value = amount;
          for (let i=1; i<=years; i++) {
            value += value * cagr;
            let li = document.createElement("li");
            li.innerText = "Year "+ i +" ("+ (start_year+i) +") = "+ CUR(value);
            parentEl.appendChild(li);
          }
        } else {
          alert("Invalid inputs!");
        }
      }
    }

    function calculateGroupYearly(group) {
      let total = 0;
      _cash_flow_template[group].forEach((entry) => {
        let el = document.getElementById(entry.name);
        if (el.value) {
          const freqEl = document.getElementById(entry.name+"_freq");
          const periodEl = document.getElementById(entry.name+"_period");
          let value = parseFloat(el.value);
          if (isNaN(value) || value < 0) {
            value = 0;
            el.value = value;
          }
          let freq = parseInt(freqEl.value);
          if (isNaN(freq) || freq < 1) {
            freq = 1;
            freqEl.value = freq;
          }
          let factor = 1;
          if (periodEl.value === "day") {
            factor = 365 / freq;
          } else if (periodEl.value === "week") {
            factor = 52 / freq;
          } else if (periodEl.value === "month") {
            factor = 12 / freq;
          } else if (freq > 1) {
            freqEl.value = 1;
          }
          total += value * factor;
        }
      });
      return total;
    }

    function calculateCashflow() {
      let yearlyIncome = calculateGroupYearly("income_sources");
      let yearlyExpense = calculateGroupYearly("fixed_expenses") + calculateGroupYearly("variable_expenses");
      let el;

      el = document.getElementById("total_monthly_income");
      el.value = CUR(yearlyIncome/12);
      el = document.getElementById("total_monthly_expense");
      el.value = CUR(yearlyExpense/12);

      el = document.getElementById("total_annual_income");
      el.value = CUR(yearlyIncome);
      el = document.getElementById("total_annual_expense");
      el.value = CUR(yearlyExpense);

      let parentEl = document.getElementById("cashflow_net");
      removeChildren(parentEl);

      const yearly_net = yearlyIncome - yearlyExpense;
      let li = document.createElement("li");
      li.innerText = "Daily Net = "+ CUR(yearly_net/365);
      setTextColour(li, yearly_net);
      parentEl.appendChild(li);
      li = document.createElement("li");
      li.innerText = "Monthly Net = "+ CUR(yearly_net/12);
      setTextColour(li, yearly_net);
      parentEl.appendChild(li);
      li = document.createElement("li");
      li.innerText = "Yearly Net = "+ CUR(yearly_net);
      setTextColour(li, yearly_net);
      parentEl.appendChild(li);
    }
  </script>

  <div class="container mt-3">
    <ul class="m-0 nav nav-fill nav-justified nav-tabs" id="tab-nav" role="tablist">
      <li class="nav-item" role="presentation" title="Introduction and Notes"> <button class="active nav-link" name="home" id="home-tab" data-bs-toggle="tab" data-bs-target="#home-pane" type="button" role="tab" aria-controls="home-pane" aria-selected="true"><nobr><i class="fas fa-home"></i> Home</button></nobr></li>
      <li class="nav-item" role="presentation" title="Extrapolated Income from Date Range"> <button class="nav-link" name="income" id="income-tab" data-bs-toggle="tab" data-bs-target="#income-pane" type="button" role="tab" aria-controls="income-pane" aria-selected="false"><nobr><i class="fas fa-dollar-sign"></i> Income</button></nobr></li>
      <li class="nav-item" role="presentation" title="Compound Annual Growth Rate (CAGR)"> <button class="nav-link" name="cagr" id="cagr-tab" data-bs-toggle="tab" data-bs-target="#cagr-pane" type="button" role="tab" aria-controls="cagr-pane" aria-selected="false"><nobr><i class="fas fa-percent"></i> CAGR</button></nobr></li>
      <li class="nav-item" role="presentation" title="Cash Flow Analysis"> <button class="nav-link" name="cashflow" id="cashflow-tab" data-bs-toggle="tab" data-bs-target="#cashflow-pane" type="button" role="tab" aria-controls="cashflow-pane" aria-selected="false"><nobr><i class="fas fa-chart-line"></i> Cash Flow</nobr></button> </li>  
    </ul>
    <div class="border-grey bg-white p-2 tab-content">
      <div class="tab-pane active" id="home-pane" role="tabpanel" aria-labelledby="home-tab">
        <p class="fw-bold"> Welcome! </p>
        <p> The following tools can help you measure Return on Investments (ROI) and assess your potential Cash Flow risks. </p>
        <ul>
          <li>Use the <a href="javascript:document.getElementById('income-tab').click()">Income</a> tab to help calculate the daily average as well as extrapolated monthly and annual income.</li>
          <li>Use the <a href="javascript:document.getElementById('cagr-tab').click()">CAGR</a> tab to help calculate the expected annual growth rate for your investments.</li>
          <li>Use the <a href="javascript:document.getElementById('cashflow-tab').click()">Cash Flow</a> tab to check if you have sufficient cash flow for your situation.</li>
        </ul>
        <p class="text-muted"> This simple tool is implemented as stateless single-page application (SPA) built primarily with HTML 5, JavaScript and Bootstrap 5 on the UI side and hosted at the edge on
        <a href="https://deno.com/deploy">Deno Deploy</a>.
        If interested, you can see the details on <a href="https://github.com/katzemeo/katzemeo/tree/main/deno/roi">Github</a>.
        </p>
      </div>
      <div class="tab-pane" id="income-pane" role="tabpanel" aria-labelledby="income-tab">
        <p>
          <label>Income / Revenue $</label><br>
          <input class="form-control" type="number" step="1000" pattern="^/d+$" id="income" maxlength="12"/>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>From Date</label><br>
              <input class="form-control" type="date" id="from_date"/>              
            </div>
            <div class="col">
              <label>To Date</label><br>
              <input class="form-control" type="date" id="to_date"/>              
            </div>
          </div>
        </p>
        <p>
          <button class="btn btn-primary" type="button" onclick="calculateIncome()">Calculate!</button>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Total Days</label><br>
              <input class="form-control" text-muted" type="text" id="total_days" readonly="readonly"/>              
            </div>
            <div class="col">
              <label>Daily Average</label><br>
              <input class="form-control" text-muted" type="text" id="daily_average" readonly="readonly"/>              
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Monthly Income</label><br>
              <input class="form-control" text-muted" type="text" id="monthly_income" readonly="readonly"/>              
            </div>
            <div class="col">
              <label>Annual Income</label><br>
              <input class="form-control" text-muted" type="text" id="annual_income" readonly="readonly"/>              
            </div>
          </div>
        </p>
      </div>
      <div class="tab-pane" id="cagr-pane" role="tabpanel" aria-labelledby="cagr-tab">
        <p>
          <label>Amount $</label><br>
          <input class="form-control" type="number" step="1000" pattern="^[-/d]/d*$" id="amount" maxlength="12"/>
        </p>
        <p>
          <label>Return $</label><br>
          <input class="form-control" type="number" step="1000" pattern="^[-/d]/d*$" id="return" maxlength="12"/>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Years</label><br>
              <input class="form-control" type="number" min="1" max="99" step="1" pattern="[0-9]{2}" id="years" maxlength="2" required/>              
            </div>
            <div class="col">
              <label>Start Year</label><br>
              <input class="form-control" type="number" min="0" max="2999" step="1" pattern="^/d+$" id="start_year" maxlength="4"/>              
            </div>
          </div>
        </p>
        <p>
          <button class="btn btn-primary" type="button" onclick="calculateROI()">Calculate!</button>
        </p>
        <p>
          <label>ROI</label><br>
          <input class="form-control text-muted" type="text" id="roi" readonly="readonly"/>
        </p>
        <p>
          <label>CAGR</label><br>
          <input class="form-control text-muted" type="text" id="cagr" readonly="readonly"/>
        </p>
        <p id="table" />
      </div>
      <div class="tab-pane" id="cashflow-pane" role="tabpanel" aria-labelledby="cashflow-tab">
        <div class="accordion">
          <div class="accordion-item">
            <h2 class="accordion-header" id="header-income">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-income" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne">
                Income / Revenue
              </button>
            </h2>
            <div id="collapse-income" class="accordion-collapse collapse show" aria-labelledby="header-income">
              <div id="income_sources" class="accordion-body p-1">
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header" id="header-fixed-expenses">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-fixed-expenses" aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo">
                Fixed Expenses
              </button>
            </h2>
            <div id="collapse-fixed-expenses" class="accordion-collapse collapse" aria-labelledby="header-fixed-expenses">
              <div id="fixed_expenses" class="accordion-body p-1">
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header" id="header-variable-expenses">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-variable-expenses" aria-expanded="false" aria-controls="panelsStayOpen-collapseTwo">
                Variable Expenses
              </button>
            </h2>
            <div id="collapse-variable-expenses" class="accordion-collapse collapse" aria-labelledby="header-variable-expenses">
              <div id="variable_expenses" class="accordion-body p-1">
              </div>
            </div>
          </div>
        </div>
        <br/>
        <p>
          <button class="btn btn-primary" type="button" onclick="calculateCashflow()">Calculate!</button>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Monthly Income</label><br>
              <input class="form-control" text-muted" type="text" id="total_monthly_income" readonly="readonly"/>              
            </div>
            <div class="col">
              <label>Monthly Expenses</label><br>
              <input class="form-control" text-muted" type="text" id="total_monthly_expense" readonly="readonly"/>              
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Annual Income</label><br>
              <input class="form-control" text-muted" type="text" id="total_annual_income" readonly="readonly"/>              
            </div>
            <div class="col">
              <label>Annual Expenses</label><br>
              <input class="form-control" text-muted" type="text" id="total_annual_expense" readonly="readonly"/>              
            </div>
          </div>
        </p>
        <p id="cashflow_net" />
      </div>
    </div>
  </div>
  </body>
</html>`

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  try {
    if (pathname == "/ping") {
      return new Response(`OK`);
    } else if (pathname == "/cashflow/template") {
      const profile: any = url.searchParams.get("profile");
      return new Response(JSON.stringify(await getCashFlow(null, profile)), { headers: { 'Content-Type': 'application/json' } });
    } else if (pathname == "/cashflow/api") {
      const guid: any = url.searchParams.get("guid");
      const profile: any = url.searchParams.get("profile");
      if (!guid || !profile) {
        return new Response(`Bad request`, {
          status: 400,
          headers: { "content-type": "text/plain" },
        });
      }
      return new Response(JSON.stringify(await getCashFlow(guid, profile)), { headers: { 'Content-Type': 'application/json' } });
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