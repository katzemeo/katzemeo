import { serve } from "https://deno.land/std@0.128.0/http/server.ts";
import { open } from "https://deno.land/x/open/index.ts";
import { getCashCount } from "./cash_count.ts";
import { getCashFlow } from "./cash_flow.ts";
import { getSAFactors } from "./seasonally_adjusted.ts";

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap CSS & Font Awesome Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet"
      integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <link href="https://use.fontawesome.com/releases/v6.1.0/css/all.css" rel="stylesheet">
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

    <!-- Option 1: Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
      crossorigin="anonymous">
    </script>  
  </head>
  <body oncontextmenu="return false;">
  <div class="container mt-3">
    <div id="header">
      <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        <symbol id="check-circle-fill" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </symbol>
        <symbol id="info-fill" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </symbol>
        <symbol id="exclamation-triangle-fill" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </symbol>
      </svg>
    </div>
    <ul class="m-0 nav nav-fill nav-justified nav-tabs" id="tab-nav" role="tablist">
      <li class="nav-item" role="presentation" title="Introduction and Notes"> <button class="active nav-link" name="home" id="home-tab" data-bs-toggle="tab" data-bs-target="#home-pane" type="button" role="tab" aria-controls="home-pane" aria-selected="true"><nobr><i class="fas fa-home"></i> Home</button></nobr></li>
      <li class="nav-item" role="presentation" title="Cash Count for Date"> <button class="nav-link" name="cashcount" id="cashcount-tab" data-bs-toggle="tab" data-bs-target="#cashcount-pane" type="button" role="tab" aria-controls="cashcount-pane" aria-selected="false"><nobr><i class="fas fa-coins"></i> Cash Count</button></nobr></li>
      <li class="nav-item" role="presentation" title="Extrapolated Income from Date Range"> <button class="nav-link" name="income" id="income-tab" data-bs-toggle="tab" data-bs-target="#income-pane" type="button" role="tab" aria-controls="income-pane" aria-selected="false"><nobr><i class="fas fa-dollar-sign"></i> Income</button></nobr></li>
      <li class="nav-item" role="presentation" title="Compound Annual Growth Rate (CAGR)"> <button class="nav-link" name="cagr" id="cagr-tab" data-bs-toggle="tab" data-bs-target="#cagr-pane" type="button" role="tab" aria-controls="cagr-pane" aria-selected="false"><nobr><i class="fas fa-percent"></i> CAGR</button></nobr></li>
      <li class="nav-item" role="presentation" title="Cash Flow Analysis"> <button class="nav-link" name="cashflow" id="cashflow-tab" data-bs-toggle="tab" data-bs-target="#cashflow-pane" type="button" role="tab" aria-controls="cashflow-pane" aria-selected="false"><nobr><i class="fas fa-chart-line"></i> Cash Flow</nobr></button> </li>
      <li class="nav-item" role="presentation" title="Net Present Value (NPV)"> <button class="nav-link" name="npv" id="npv-tab" data-bs-toggle="tab" data-bs-target="#npv-pane" type="button" role="tab" aria-controls="npv-pane" aria-selected="false"><nobr><i class="fas fa-sack-dollar"></i> NPV</nobr></button> </li>
    </ul>
    <div class="border-grey bg-white p-2 tab-content">
      <div class="tab-pane active" id="home-pane" role="tabpanel" aria-labelledby="home-tab">
        <p class="fw-bold">
          <a class="text-decoration-none" target="katzemeo" href="https://twitter.com/katzemeo" title='Follow "Silvester the Invester" on Twitter @katzemeo'>
            <img src="https://invest.npsolve.com/public/silvester.png" alt="Silvester" width="48" height="48">
          </a>
          Welcome!
        </p>
        <p>
        The following tools can help you
        <a class="text-decoration-none" href="javascript:document.getElementById('cashcount-tab').click()">Count Cash</a>,
        measure Return on Investments (<a class="text-decoration-none" href="javascript:document.getElementById('cagr-tab').click()">ROI</a>),
        perform <a class="text-decoration-none" href="javascript:document.getElementById('npv-tab').click()">Capital Budgeting</a>, as well as
        calculate and assess your potential
        <a class="text-decoration-none" href="javascript:document.getElementById('cashflow-tab').click()">Cash Flow</a> risks.
        </p>
        <ul>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('income-tab').click()">Income</a> tab help calculate the daily average as well as extrapolated (seasonally adjusted) monthly and annual income.</li>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('cagr-tab').click()">CAGR</a> tab help calculate the expected annual growth rate for your investments.</li>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('cashflow-tab').click()">Cash Flow</a> tab help check if your income is sufficient after expenses.</li>
        </ul>
        <p class="text-muted"> The tools are implemented as a stateless single-page application (SPA) built primarily with HTML 5, JavaScript and Bootstrap 5 on the UI side and hosted at the edge on
        <a class="text-decoration-none" href="https://deno.com/deploy">Deno Deploy</a>.  Once loaded, all processing is done locally within the web browser.
        If interested, you can see the details on <a class="text-decoration-none" href="https://github.com/katzemeo/katzemeo/tree/main/deno/roi">GitHub</a>.
        </p>
      </div>
      <div class="tab-pane" id="cashcount-pane" role="tabpanel" aria-labelledby="cashcount-tab">
        <div class="accordion" id="accordion-items-denominations">
          <div class="accordion-item">
            <h2 class="accordion-header" id="header-dates">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-dates" aria-expanded="true" aria-controls="panelsStayOpen-collapseOne">
                Dates
              </button>
            </h2>
            <div id="collapse-dates" class="accordion-collapse collapse show" aria-labelledby="header-dates">
              <div id="cashcount-dates" class="accordion-body p-1">
                <p>
                  <div class="row align-items-center">
                    <div class="col">
                      <label>From Date</label><br>
                      <input class="form-control" type="date" id="count_from_date"/>              
                    </div>
                    <div class="col">
                      <label>To Date</label><br>
                      <input class="form-control" type="date" id="count_to_date"/>              
                    </div>
                  </div>
                </p>
              </div>
            </div>
          </div>
        </div>
        <br/>
        <div class="d-flex justify-content-between">
          <div>
            <button class="btn btn-primary" type="button" onclick="calculateCashCount()">Calculate!</button>
            <button class="btn btn-primary" type="button" onclick="copyData(exportCashCount)"><i class="fas fa-copy"></i></button>
          </div>
          <button class="btn btn-primary" type="button" onclick="shareURL('cashcount', 'ROI - Cash Count')"><i class="fas fa-share"></i></button>
        </div>
        <br/>
        <p id="cashcount_subtotals_group">
        </p>
        <p class="ms-3" id="cashcount_totals" />
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
          <div class="row align-items-center">
            <div class="col">
              <input class="form-check-input" id="seasonally_adjusted_cb" title="Adjust for Seaons" onchange="calculateIncome()" type="checkbox" value="" />
              <label>Season Adjusted $</label><br>
              <input class="form-control text-muted" type="text" id="seasonally_adjusted_income" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Adjustment Factor(s)</label><br>
              <input class="form-control text-muted" type="text" id="seasonally_adjusted_factor" readonly="readonly"/>           
            </div>
          </div>
        </p>
        <div class="d-flex justify-content-between">
          <div>
            <button class="btn btn-primary" type="button" onclick="calculateIncome()">Calculate!</button>
            <button class="btn btn-primary" type="button" onclick="copyData(exportIncome)"><i class="fas fa-copy"></i></button>
          </div>
          <button class="btn btn-primary" type="button" onclick="shareURL('income', 'ROI - Income')"><i class="fas fa-share"></i></button>
        </div>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Total Days</label><br>
              <input class="form-control text-muted" type="text" id="total_days" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Daily Average</label><br>
              <input class="form-control text-muted" type="text" id="daily_average" readonly="readonly"/>
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Monthly Income</label><br>
              <input class="form-control text-muted" type="text" id="monthly_income" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Annual Income</label><br>
              <input class="form-control text-muted" type="text" id="annual_income" readonly="readonly"/>
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
        <div class="d-flex justify-content-between">
          <div>
            <button class="btn btn-primary" type="button" onclick="calculateROI()">Calculate!</button>
            <button class="btn btn-primary" type="button" onclick="copyData(exportROI)"><i class="fas fa-copy"></i></button>
          </div>
          <button class="btn btn-primary" type="button" onclick="shareURL('cagr', 'ROI - CAGR')"><i class="fas fa-share"></i></button>
        </div>
        <br/>
        <p>
          <label>Return on Investment (ROI)</label><br>
          <input class="form-control text-muted" type="text" id="roi" readonly="readonly"/>
        </p>
        <p>
          <label>Compound Annual Growth Rate (CAGR)</label><br>
          <input class="form-control text-muted" type="text" id="cagr" readonly="readonly"/>
        </p>
        <p class="ms-3" id="cagr_table" />
      </div>
      <div class="tab-pane" id="cashflow-pane" role="tabpanel" aria-labelledby="cashflow-tab">
        <div class="accordion">
          <div class="accordion-item">
            <h2 class="accordion-header" id="header-income">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-income" aria-expanded="false" aria-controls="panelsStayOpen-collapseOne">
                Income / Revenue
              </button>
            </h2>
            <div id="collapse-income" class="accordion-collapse collapse" aria-labelledby="header-income">
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
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Remittance Rate</label><br>
              <input class="form-control" type="number" max="1" min="0" step="0.01" id="remittance_rate"/>              
            </div>
            <div class="col">
              <label>Annual Remittance</label><br>
              <input class="form-control text-danger" type="text" id="remittance_amount" readonly="readonly"/>
            </div>
          </div>
        </p>
        <div class="d-flex justify-content-between">
          <div>
            <button class="btn btn-primary" type="button" onclick="calculateCashFlow()">Calculate!</button>
            <button class="btn btn-primary" type="button" onclick="copyData(exportCashFlow)"><i class="fas fa-copy"></i></button>
          </div>
          <button class="btn btn-primary" type="button" onclick="shareURL('cashflow', 'ROI - Cash Flow')"><i class="fas fa-share"></i></button>
        </div>
        <p>
          <div class="row align-items-end">
            <div class="col">
              <label>Monthly Income / Revenue</label><br>
              <input class="form-control text-muted" type="text" id="total_monthly_income" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Monthly Expenses</label><br>
              <input class="form-control text-muted" type="text" id="total_monthly_expense" readonly="readonly"/>
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-end">
            <div class="col">
              <label>Annual Income / Revenue</label><br>
              <input class="form-control text-primary" type="text" id="total_annual_income" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Annual Expenses</label><br>
              <input class="form-control text-danger" type="text" id="total_annual_expense" readonly="readonly"/>
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-end">
            <div class="col">
              <label>Annual Before Remittance</label><br>
              <input class="form-control text-muted" type="text" id="total_annual_raw" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Annual After Expenses</label><br>
              <input class="form-control" type="text" id="total_annual_after" readonly="readonly"/>
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-center">
            <div class="col">
              <label>Tax Rate</label><br>
              <input class="form-control" type="number" max="1" min="0" step="0.01" id="tax_rate"/>              
            </div>
            <div class="col">
              <label>Annual Tax</label><br>
              <input class="form-control text-danger" type="text" id="tax_amount" readonly="readonly"/>
            </div>
          </div>
        </p>
        <p>
          <div class="row align-items-end">
            <div class="col">
              <label>Annual Net (After Expenses/Tax)</label><br>
              <input class="form-control" type="text" id="total_annual_net" readonly="readonly"/>
            </div>
          </div>
        </p>
        <p class="ms-3" id="cashflow_net" />
      </div>
      <div class="tab-pane" id="npv-pane" role="tabpanel" aria-labelledby="npv-tab">
        <p>
          <label>Initial Investment $</label><br>
          <input class="form-control" type="number" min="0" step="1000" pattern="^[-/d]/d*$" id="initial_investment" maxlength="12"/>
        </p>
        <p>
          <label>Required Return / Discount Rate</label><br>
          <input class="form-control" type="number" min="0" step="0.01" pattern="^[-/d]/d*$" id="discount_rate" maxlength="12"/>
        </p>
        <p>
          <label>Number of Time Periods</label><br>
          <input class="form-control" type="number" min="1" max="1000" step="1" pattern="^[-/d]/d*$" id="num_time_periods" maxlength="12"/>
        </p>
        <p id="cash_flow_single">
          <label>Cash Flows $</label>
          <button class="btn btn-primary mb-1" type="button" onclick="hideShow(expandNPVCashFlows, 'cash_flow_single', 'cash_flow_expanded')"><i class="fas fa-angles-down"></i></button>
          <br>
          <input class="form-control" type="number" step="1000" pattern="^[-/d]/d*$" id="cash_flow" maxlength="12"/>
        </p>
        <div class="mb-3" id="cash_flow_expanded" style="display: none;">
          <label>Cash Flows $</label>
          <button class="btn btn-primary mb-1" type="button" onclick="hideShow(collapseNPVCashFlows, 'cash_flow_expanded', 'cash_flow_single')"><i class="fas fa-angles-up"></i></button>
          <div class="container" id="cash_flows"></div>
        </div>
        <p>
          <label>Residual / Salvage Value $</label><br>
          <input class="form-control" type="number" min="0" step="1000" pattern="^[-/d]/d*$" id="residual_value" maxlength="12"/>
        </p>
        <div class="d-flex justify-content-between">
          <div>
            <button class="btn btn-primary" type="button" onclick="calculateNPV()">Calculate!</button>
            <button class="btn btn-primary" type="button" onclick="copyData(exportNPV)"><i class="fas fa-copy"></i></button>
          </div>
          <button class="btn btn-primary" type="button" onclick="shareURL('npv', 'ROI - NPV')"><i class="fas fa-share"></i></button>
        </div>
        <br/>
        <p>
          <label>Net Present Value (NPV)</label><br>
          <input class="form-control text-muted" type="text" id="npv" readonly="readonly"/>
        </p>
      </div>
    </div>
  </div>
  <footer>
    <div class="text-center text-muted fs-6">v0.6 - &copy; 2022-05-11</div>
  </footer>

  <script>
    const JSON_HEADERS = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    const NOW = new Date();
    const _percentFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFactionDigits: 2 }).format;
    const PCT = function (value) { if (!isNaN(value)) { return _percentFormat(value); } return ""; };
    const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency", currencyDisplay: "symbol", currencySign: "accounting" }).format;
    const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Toronto";
    var _guid = null;
    var _profile = null;
    var _cash_count_template = null;
    var _income_sa_factors = null;
    var _cash_flow_template = null;

    const formatDate = (dt, timeZone = TIME_ZONE) => {
      return dt ? new Date(dt).toLocaleDateString('en-us', { timeZone: timeZone, weekday: "long", year: "numeric", month: "short", day: "numeric" }) : "";
    }

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

    const hideShow = (callback, hideId, showId) => {
      if (callback()) {
        let el = document.getElementById(hideId);
        el.style = "display: none";
        el = document.getElementById(showId);
        el.style = "display: block";  
      }
    };

    const createDiv = (className=null, title=null) => {
      const el = document.createElement("div");
      if (className) {
        el.className = className;
      }
      if (title) {
        el.title = title;
      }
      return el;
    };

    const createCountControl = (prefix, entry) => {
      const el = document.createElement("input");
      el.id = prefix + "_"+ entry.name;
      el.className = "form-control";
      el.type = "number";
      if (entry.multiplier && entry.multiplier !== 1) {
        el.placeholder = "Count";
      } else {
        el.placeholder = "$ Amount";
      }
      if (entry.value !== undefined) {
        el.value = entry.value;
      }
      el.min = entry.min ?? 0;
      if (entry.max !== undefined) {
        el.max = entry.max;
      }
      if (entry.step) {
        el.step = entry.step;
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

    const getName = (entry) => {
      return Object.keys(entry)[0];
    };

    const createAccordionItem = (entry) => {
      const name = getName(entry);
      const divAccordionItem = createDiv("accordion-item");
      const accordionHeader = document.createElement("h2");
      accordionHeader.className = "accordion-header";
      accordionHeader.id = "header-" + name;
      const accordionButton = document.createElement("button");
      accordionButton.className = "accordion-button collapsed";
      accordionButton.type = "button";
      accordionButton.setAttribute("data-bs-toggle", "collapse");
      accordionButton.setAttribute("data-bs-target", "#collapse-" + name);
      accordionButton.setAttribute("aria-expanded", "false");
      accordionButton.setAttribute("aria-controls", "panelsStayOpen-collapseTwo");
      accordionButton.innerHTML = _cash_count_template.categories[name];
      accordionHeader.appendChild(accordionButton);
      divAccordionItem.appendChild(accordionHeader);

      const divAccordionCollapse = createDiv("accordion-collapse collapse");
      divAccordionCollapse.id = "collapse-" + name;
      divAccordionCollapse.setAttribute("aria-labelledby", "header-" + name);
      const divAccordionBody = createDiv("accordion-body p-1");
      divAccordionBody.id = name;
      divAccordionCollapse.appendChild(divAccordionBody);
      divAccordionItem.appendChild(divAccordionCollapse);

      return divAccordionItem;
    };

    const createLabelReadonlyInput = (labelText, elementId) => {
      const divRowEntry = createDiv("row align-items-center");
      const divCol = createDiv("col");
      const label = document.createElement("label");
      label.innerText = labelText;
      divCol.appendChild(label);

      const el = document.createElement("input");
      el.type = "text";
      el.readonly = "readonly";
      el.id = elementId;
      el.className = "form-control text-muted";
      divCol.appendChild(el);
      divRowEntry.appendChild(divCol);

      return divRowEntry;
    }

    const createLabelNumberInput = (labelText, elementId, step=1000, min=0, max=undefined) => {
      const divRowEntry = createDiv("row align-items-center");
      let divCol;

      const label = document.createElement("label");
      label.innerText = labelText;
      divCol = createDiv("col col-4 col-sm-3 col-md-2");
      divCol.appendChild(label);
      divRowEntry.appendChild(divCol);

      const el = document.createElement("input");
      el.type = "number";
      el.id = elementId;
      el.className = "form-control";
      if (!isNaN(min)) {
        el.min = min;
      }
      if (!isNaN(max)) {
        el.max = max;
      }
      if (!isNaN(step)) {
        el.step = step;
      }
      divCol = createDiv("col");
      divCol.appendChild(el);
      divRowEntry.appendChild(divCol);
     
      return divRowEntry;
    }

    const showAlert = (type, icon, message) => {
      const parentEl = document.getElementById("header");
      const divAlert = createDiv("alert "+ type +" d-flex align-items-center alert-dismissible fade show");
      divAlert.role = "alert";

      if (icon) {
        //const svg = document.createElement("svg");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        //svg.className = "bi flex-shrink-0 me-2";
        //svg.width = "24";
        //svg.height = "24";
        //svg.role = "img";
        svg.setAttribute("class", "bi flex-shrink-0 me-2");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("role", "img");
        svg.innerHTML = '<use href="#' + icon + '"/>';
        divAlert.appendChild(svg);  
      }

      const divMessage = createDiv();
      divMessage.innerText = message;
      divAlert.appendChild(divMessage);
      const button = document.createElement("button");
      button.className = "btn-close";
      button.setAttribute("data-bs-dismiss", "alert");
      button.setAttribute("aria-label", "Close");
      divAlert.appendChild(button);
      parentEl.appendChild(divAlert);
    };

    const showInfo = (message) => {
      showAlert("alert-primary", "info-fill", message);
    };

    const showSuccess = (message) => {
      showAlert("alert-success ", "check-circle-fill", message);
    };

    const showWarning = (message) => {
      showAlert("alert-warning", "exclamation-triangle-fill", message);
    };

    const showError = (message) => {
      showAlert("alert-danger", "exclamation-triangle-fill", message);
    };

    const buildCashCountUI = () => {
      const parentEl = document.getElementById("accordion-items-denominations");
      _cash_count_template.denominations.forEach((group) => {
        parentEl.appendChild(createAccordionItem(group));
        const group_name = getName(group);
        const groupEl = document.getElementById(group_name);
        group[group_name].forEach((entry) => {
          const p = document.createElement("p");
          const divRow = createDiv("row align-items-center gx-1");
          const divCol = createDiv("col");
          const label = document.createElement("label");
          label.innerText = _cash_count_template.categories[entry.name];
          label.appendChild(document.createElement("br"));
          divCol.appendChild(label);
  
          const divRowEntry = createDiv("row align-items-center gx-1");
          const divValue = createDiv("col-5");
          divValue.appendChild(createCountControl(group_name, entry));
          divRowEntry.appendChild(divValue);
          divCol.appendChild(divRowEntry);
  
          divRow.appendChild(divCol);
          p.appendChild(divRow);
          groupEl.appendChild(p);
        });
      });
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

      if (_cash_flow_template.remittance_rate) {
        const el = document.getElementById("remittance_rate");
        el.value = PCT(_cash_flow_template.remittance_rate);
      }

      if (_cash_flow_template.tax_rate) {
        const el = document.getElementById("tax_rate");
        el.value = PCT(_cash_flow_template.tax_rate);
      }
    };

    const getCashCountTemplate = () => {
      const params = new URLSearchParams();
      if (_guid) {
        params.set("guid", _guid);
      }
      params.set("profile", _profile ?? "template");
      let url = "/cashcount/api" + "?" + params.toString();
      fetch(url, {
        method: "GET",
        headers: JSON_HEADERS,
      }).then((res) => {
        if (res.status == 200) {
          res.json().then((data) => {
            _cash_count_template = data;
            buildCashCountUI();
          });
        } else {
          showError("Unable to lookup Cash Count template.");
          console.log("Unexpected response", res.status);
        }
      }).catch((error) => {
        console.error(error);
        window.alert("Unable to get cash count template.  Please try again.");
      });
    };
  
    const getIncomeSAFactors = () => {
      const params = new URLSearchParams();
      if (_guid) {
        params.set("guid", _guid);
      }
      if (_profile) {
        params.set("profile", _profile);
      }
      let url = "/income/safactors" + "?" + params.toString();
      fetch(url, {
        method: "GET",
        headers: JSON_HEADERS,
      }).then((res) => {
        if (res.status == 200) {
          res.json().then((data) => {
            _income_sa_factors = data;
          });
        } else {
          showError("Unable to lookup Income Seasonally Adjusted factors.");
          console.log("Unexpected response", res.status);
        }
      }).catch((error) => {
        console.error(error);
        window.alert("Unable to get cash count template.  Please try again.");
      });
    };
    

    const getCashFlowTemplate = () => {
      let url;
      const params = new URLSearchParams();
      if (_guid) {
        params.set("guid", _guid);
      }
      if (_profile) {
        params.set("profile", _profile);
      }
      if (_guid && _profile) {
        url = "/cashflow/api";
      } else {
        url = "/cashflow/template";
      }
      url += "?"+params.toString();

      fetch(url, {
        method: "GET",
        headers: JSON_HEADERS,
      }).then((res) => {
        if (res.status == 200) {
          res.json().then((data) => {
            _cash_flow_template = data;
            buildCashFlowUI();
          });
        } else {
          showError("Unable to lookup Cash Flow template.");
          console.log("Unexpected response", res.status);
        }
      }).catch((error) => {
        console.error(error);
        window.alert("Unable to get cash flow template.  Please try again.");
      });
    };

    const configureTabs = () => {
      let tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
      tabs.forEach((tab) => {
        tab.addEventListener('show.bs.tab', function (event) {
          //console.log(event.target);
          if (event.target && event.target.name === "cashcount") {
            if (!_cash_count_template) {
              getCashCountTemplate();
            }
          } else if (event.target && event.target.name === "income") {
            if (!_income_sa_factors) {
              getIncomeSAFactors();
            }
          } else if (event.target && event.target.name === "cashflow") {
            if (!_cash_flow_template) {
              getCashFlowTemplate();
            }
          }
          //event.target // newly activated tab
          //event.relatedTarget // previous active tab
        });
      });
    };

    window.onload = function () {
      const url = new URL(window.location.href);
      _guid = url.searchParams.get("guid");
      _profile = url.searchParams.get("profile");
      configureTabs();

      let el;
      const nowDate = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

      el = document.getElementById("count_from_date");
      el.valueAsDate = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 7);
      el = document.getElementById("count_to_date");
      el.valueAsDate = nowDate;

      el = document.getElementById("income");
      el.value = getFloatParam(url, "income", 1000);
      el = document.getElementById("from_date");
      el.valueAsDate = new Date(NOW.getFullYear(), 0, 1);
      el = document.getElementById("to_date");
      el.valueAsDate = nowDate;

      el = document.getElementById("amount");
      el.value = getFloatParam(url, "amount", 100000);
      el = document.getElementById("return");
      el.value = getFloatParam(url, "return", 250000);
      el = document.getElementById("years");
      el.value = getFloatParam(url, "years", 7);
      el = document.getElementById("start_year");
      el.value = NOW.getFullYear();

      el = document.getElementById("initial_investment");
      el.value = getFloatParam(url, "amount", 350000);
      el = document.getElementById("num_time_periods");
      el.value = getFloatParam(url, "years", 10);
      el = document.getElementById("discount_rate");
      el.value = getFloatParam(url, "rate", 0.09);
      el = document.getElementById("cash_flow");
      el.value = getFloatParam(url, "cash_flow", 48000);
      el = document.getElementById("residual_value");
      el.value = getFloatParam(url, "residual", 250000);

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

      showInfo("Today is "+ formatDate(nowDate));
    };

    function setTextColour(el, value, className = null) {
      if (className) {
        el.className = className;
      }
      if (value < 0) {
        el.className += " text-danger";
      } else {
        el.className += " text-success";
      }
    }

    function computeCAGR(start, end, n) {
      let cagr = Math.pow((end/start), 1/n) - 1;
      return cagr;
    }

    function computeNPV(initialInvestment, discountRate, numTimePeriods, cashFlows) {
      let npv = -initialInvestment;
      for (let t=1; t<=numTimePeriods; t++) {
        npv += cashFlows[t-1] / Math.pow(1+discountRate, t);
      }
      return npv;
    }

    function copyToClipboard(text) {
      var tmpElement = document.createElement("input");
      tmpElement.value = text;
      document.body.appendChild(tmpElement);
      tmpElement.select();
      document.execCommand("copy");
      document.body.removeChild(tmpElement);
    }

    function copyData(exportFn) {
      let data = exportFn();
      if (data) {
        copyToClipboard(JSON.stringify(data, null, 1));
      }
    }

    function shareURL(path, title) {
      if (navigator.share) {
        const url = window.location.origin +"/"+ path + window.location.search;
        navigator.share({
          title: title,
          url: url,
        }).then(() => {
          console.log('Thanks for sharing!');
        }).catch(err => {
          console.log("Error while using Web share API:");
          console.log(err);
        });
      } else {
        alert("Share not supported!");
      }
    }

    function exportIncome() {
      let data = null;
      if (calculateIncome()) {
        data = {};
        data.income = document.getElementById("income").value;
        data.from_date = document.getElementById("from_date").valueAsDate;
        data.to_date = document.getElementById("to_date").valueAsDate;
        data.seasonally_adjusted_income = document.getElementById("seasonally_adjusted_income").value;
        data.seasonally_adjusted_factor = document.getElementById("seasonally_adjusted_factor").value;
        data.total_days = document.getElementById("total_days").value;
        data.daily_average = document.getElementById("daily_average").value;
        data.monthly_income = document.getElementById("monthly_income").value;
        data.annual_income = document.getElementById("annual_income").value;
      }
      return data;
    }

    function calculateIncome() {
      try {
        let el = document.getElementById("income");
        let income = parseFloat(el.value);  
        el = document.getElementById("from_date");
        const fromDateTime = el.valueAsDate;
        el = document.getElementById("to_date");
        const toDateTime = el.valueAsDate.getTime();
        el = document.getElementById("seasonally_adjusted_cb");
        const seasonallyAdjust = el.checked;
        const delta = toDateTime - fromDateTime;
        if (isNaN(income) || isNaN(delta) || delta < 0) {
          showError("Invalid Income or Date range.");
        } else {
          let days = 1 + (delta / 1000 / 60 / 60 / 24);
          el = document.getElementById("total_days");
          el.value = days;

          let average = income / days;
          let annual_income = average * 365;
          if (seasonallyAdjust && _income_sa_factors) {
            let dt = new Date(fromDateTime);
            let count = 0;
            let saFactors = "";
            while (dt.getTime() <= toDateTime) {
              if (count < 1) {
                if (count > 0) {
                  saFactors += ", ";  
                }
                saFactors += _income_sa_factors[dt.getUTCMonth() + 1].toFixed(5);
              }
              dt.setMonth(dt.getMonth() + 1);
              count++;
            }

            if (count > 1) {
              saFactors += "...";
            }

            dt = new Date(fromDateTime);
            const sa_average = income / count;
            income = 0;
            while (dt.getTime() <= toDateTime) {
              income += sa_average / _income_sa_factors[dt.getUTCMonth() + 1];
              dt.setMonth(dt.getMonth() + 1);
            }
            average = income / days;
            annual_income = average * 365;

            el = document.getElementById("seasonally_adjusted_income");
            el.value = CUR(income);
            el = document.getElementById("seasonally_adjusted_factor");
            el.value = saFactors + " (count=" + count + ")";
          } else {
            el = document.getElementById("seasonally_adjusted_income");
            el.value = "";
            el = document.getElementById("seasonally_adjusted_factor");
            el.value = "";
          }

          el = document.getElementById("daily_average");
          el.value = CUR(annual_income/365);
          el = document.getElementById("monthly_income");
          el.value = CUR(annual_income/12);
          el = document.getElementById("annual_income");
          el.value = CUR(annual_income);
        }
      } catch (error) {
        //console.log(error);
        alert("Invalid inputs!");
        return false;
      }
      return true;
    }

    function exportROI() {
      let data = null;
      if (calculateROI()) {
        data = {};
        data.amount = document.getElementById("amount").value;
        data.return = document.getElementById("return").value;
        data.years = document.getElementById("years").value;
        data.start_year = document.getElementById("start_year").value;
        data.roi = document.getElementById("roi").value;
        data.cagr = document.getElementById("cagr").value;

        let parentEl = document.getElementById("cagr_table");
        var children = parentEl.children;
        for (var i=0; i < children.length; i++) {
          el = children[i];
          data["cagr_year"+(i+1)] = el.innerText;
        }
      }
      return data;
    }

    function calculateROI() {
      let el = document.getElementById("amount");
      let amount = parseFloat(el.value);
      el = document.getElementById("return");
      let ret = parseFloat(el.value);
      if (isNaN(amount) || amount <= 0 || isNaN(ret) || ret < 0) {
        alert("Invalid inputs!");
        return false;
      }
      let roi = (ret - amount) / amount;
      el = document.getElementById("roi");
      el.value = PCT(roi*100) +" % or "+ CUR(ret - amount);
      setTextColour(el, roi, "form-control");

      let parentEl = document.getElementById("cagr_table");
      removeChildren(parentEl);
    
      el = document.getElementById("years");
      if (el.value) {
        let years = parseInt(el.value);
        if (years > 0 && years < 100) {
          el.value = years;
          const cagr = computeCAGR(amount, ret, years);
          el = document.getElementById("cagr");
          el.value = PCT(cagr*100) +" %";
          setTextColour(el, cagr, "form-control");
          if (cagr < 0) {
            showWarning("Compound Annual Growth Rate is Negative!");
          }

          el = document.getElementById("start_year");
          let start_year = parseInt(el.value);
          if (isNaN(start_year) || start_year < 1) {
            start_year = NOW.getFullYear();
          }
          el.value = start_year;
          value = amount;
          for (let i=1; i<=years; i++) {
            value += value * cagr;
            let li = document.createElement("li");
            li.innerText = "Year "+ i +" ("+ (start_year+i) +") = "+ CUR(value);
            parentEl.appendChild(li);
          }
        } else {
          alert("Invalid inputs!");
          return false;
        }
      }
      return true;
    }

    function calculateDenominationTotal(group, subtotals) {
      let total = 0;
      const group_name = getName(group);
      group[group_name].forEach((entry) => {
        let el = document.getElementById(group_name +"_"+ entry.name);
        if (el.value) {
          let amount;
          if (entry.multiplier && entry.multiplier !== 1) {
            amount = parseFloat(el.value) * entry.multiplier;
          } else {
            amount = parseFloat(el.value);
          }
          if (subtotals[entry.name] == undefined) {
            subtotals[entry.name] = amount;
          } else {
            subtotals[entry.name] += amount;
          }
          total += amount;
        }
      });
      return total;
    }

    function calculateCashCount(subtotals = {}) {
      const subtotalsGroupEl = document.getElementById("cashcount_subtotals_group");
      removeChildren(subtotalsGroupEl);
      const denominationsEl = document.getElementById("cashcount_totals");
      removeChildren(denominationsEl);

      let total = 0;
      _cash_count_template.denominations.forEach((group) => {
        const denominationTotal = calculateDenominationTotal(group, subtotals);
        if (denominationTotal > 0) {
          let li = document.createElement("li");
          li.innerHTML = _cash_count_template.categories[getName(group)] +" = "+ CUR(denominationTotal);
          denominationsEl.appendChild(li);
        }
        total += denominationTotal;
      });

      let el, elId;
      subtotalsGroupEl.appendChild(createLabelReadonlyInput("Total Cash", "cashcount_total"));
      el = document.getElementById("cashcount_total");
      el.value = CUR(total);

      let keys = Object.keys(subtotals);
      if (keys.length > 1) {
        keys = keys.sort();
        keys.forEach((k) => {
          elId = "cashcount_" + k;
          subtotalsGroupEl.appendChild(createLabelReadonlyInput(_cash_count_template.categories[k], elId));
          el = document.getElementById(elId);
          el.value = CUR(subtotals[k]);
        });
      }

      // If successful, copy over results to "Income" tab (in case it's useful)
      if (total > 0) {
        el = document.getElementById("from_date");
        el.value = document.getElementById("count_from_date").value;
        el = document.getElementById("to_date");
        el.value = document.getElementById("count_to_date").value;
        el = document.getElementById("income");
        el.value = total.toFixed(2);  
      }

      return true;
    }

    function exportCashCount() {
      let data = null;
      const subtotals = {}
      if (calculateCashCount(subtotals)) {
        data = {};
        data.from_date = document.getElementById("count_from_date").valueAsDate;
        data.to_date = document.getElementById("count_to_date").valueAsDate;

        let el, elId;
        el = document.getElementById("cashcount_total");
        data["total_cash"] = el.value;

        let keys = Object.keys(subtotals);
        if (keys.length > 1) {
          keys.forEach((k) => {
            elId = "cashcount_" + k;
            el = document.getElementById(elId);
            data[elId] = el.value;
          });
        }

        let parentEl = document.getElementById("cashcount_totals");
        var children = parentEl.children;
        for (var i=0; i < children.length; i++) {
          el = children[i];
          data["denomination_totals_"+(i+1)] = el.innerText;
        }
      }

      return data;
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

    function calculateCashFlow() {
      const yearlyBeforeRemittance = calculateGroupYearly("income_sources");
      let yearlyRemittanceAmount = 0;
      let yearlyTaxAmount = 0;
      let el;

      el = document.getElementById("remittance_rate");
      if (el.value) {
        let remittanceRate = parseFloat(el.value);
        if (!isNaN(remittanceRate)) {
          yearlyRemittanceAmount = remittanceRate * yearlyBeforeRemittance;
          el = document.getElementById("remittance_amount");
          el.value = CUR(yearlyRemittanceAmount);
        }
      } else {
        el = document.getElementById("remittance_amount");
        el.value = "";
      }

      const yearlyIncome = yearlyBeforeRemittance - yearlyRemittanceAmount;
      const yearlyExpense = calculateGroupYearly("fixed_expenses") + calculateGroupYearly("variable_expenses");
      const yearlyTaxable = yearlyIncome - yearlyExpense;

      el = document.getElementById("total_monthly_income");
      el.value = CUR(yearlyIncome/12);
      el = document.getElementById("total_monthly_expense");
      el.value = CUR(yearlyExpense/12);

      el = document.getElementById("total_annual_income");
      el.value = CUR(yearlyIncome);
      el = document.getElementById("total_annual_expense");
      el.value = CUR(yearlyExpense);

      el = document.getElementById("total_annual_raw");
      el.value = CUR(yearlyBeforeRemittance);
      el = document.getElementById("total_annual_after");
      el.value = CUR(yearlyTaxable);
      setTextColour(el, yearlyTaxable, "form-control");

      el = document.getElementById("tax_rate");
      if (el.value) {
        let taxRate = parseFloat(el.value);
        if (!isNaN(taxRate)) {
          yearlyTaxAmount = taxRate * yearlyTaxable;
          el = document.getElementById("tax_amount");
          el.value = CUR(yearlyTaxAmount);
        }
      } else {
        el = document.getElementById("tax_amount");
        el.value = "";
      }

      const yearlyNet = yearlyTaxable - yearlyTaxAmount;
      el = document.getElementById("total_annual_net");
      el.value = CUR(yearlyNet);
      setTextColour(el, yearlyNet, "form-control");

      if (yearlyNet > 1000) {
        showSuccess("Annual Net is "+ el.value);
      } else {
        showWarning("Annual Net is "+ el.value);
      }

      let parentEl = document.getElementById("cashflow_net");
      removeChildren(parentEl);

      let li = document.createElement("li");
      li.innerText = "Daily Net = "+ CUR(yearlyNet/365);
      setTextColour(li, yearlyNet);
      parentEl.appendChild(li);
      li = document.createElement("li");
      li.innerText = "Weekly Net = "+ CUR(yearlyNet/52);
      setTextColour(li, yearlyNet);
      parentEl.appendChild(li);
      li = document.createElement("li");
      li.innerText = "Monthly Net = "+ CUR(yearlyNet/12);
      setTextColour(li, yearlyNet);
      parentEl.appendChild(li);

      // If successful, copy over yearly net to "NPV" tab (in case it's useful)
      if (yearlyNet > 0) {
        el = document.getElementById("cash_flow");
        el.value = yearlyNet.toFixed(2);
      }

      return true;
    }

    function exportCashFlow() {
      let data = null;
      if (calculateCashFlow()) {
        data = {};
        el = document.getElementById("remittance_rate");
        if (el.value) {
          data.remittance_rate = document.getElementById("remittance_rate").value;
          data.remittance_amount = document.getElementById("remittance_amount").value;
        }
        data.total_monthly_income = document.getElementById("total_monthly_income").value;
        data.total_monthly_expense = document.getElementById("total_monthly_expense").value;
        data.total_annual_income = document.getElementById("total_annual_income").value;
        data.total_annual_expense = document.getElementById("total_annual_expense").value;
        data.total_annual_raw = document.getElementById("total_annual_raw").value;
        data.total_annual_after = document.getElementById("total_annual_after").value;

        el = document.getElementById("tax_rate");
        if (el.value) {
          data.tax_rate = document.getElementById("tax_rate").value;
          data.tax_amount = document.getElementById("tax_amount").value;
        }
        data.total_annual_net = document.getElementById("total_annual_net").value;

        let parentEl = document.getElementById("cashflow_net");
        var children = parentEl.children;
        for (var i=0; i < children.length; i++) {
          el = children[i];
          data["net"+(i+1)] = el.innerText;
        }
      }
      return data;
    }

    function expandNPVCashFlows() {
      const parentEl = collapseNPVCashFlows();

      let el = document.getElementById("num_time_periods");
      let numTimePeriods = parseInt(el.value);
      if (numTimePeriods <= 20) {
        el = document.getElementById("cash_flow");
        let cashFlow = parseFloat(el.value);
        if (isNaN(cashFlow)) {
          cashFlow = "";
        }
        for (let i=1; i<=numTimePeriods; i++) {
          const elId = "cash_flow_" + i;
          parentEl.appendChild(createLabelNumberInput("Period "+ i, elId));
          el = document.getElementById(elId);
          el.value = cashFlow;
        }
      } else {
        showWarning("Maximum Expanded Time Periods is 20");
        return false
      }
      return true;
    }

    function collapseNPVCashFlows() {
      const parentEl = document.getElementById("cash_flows");
      removeChildren(parentEl);
      return parentEl;
    }

    function exportNPV() {
      let data = null;
      if (calculateNPV()) {
        data = {};
        data.initial_investment = document.getElementById("initial_investment").value;
        data.discount_rate = document.getElementById("discount_rate").value;
        data.num_time_periods = document.getElementById("num_time_periods").value;
        if (document.getElementById("cash_flow_1")) {
          numTimePeriods = parseInt(data.num_time_periods);
          for (let i=1; i<=numTimePeriods; i++) {
            const elId = "cash_flow_" + i;
            el = document.getElementById(elId);
            data[elId] = el.value;
          }
        } else {
          data.cash_flow = document.getElementById("cash_flow").value;
        }

        data.residual_value = document.getElementById("residual_value").value;
        data.npv = document.getElementById("npv").value;
      }
      return data;
    }

    function calculateNPV() {
      let el = document.getElementById("initial_investment");
      let initialInvestment = parseFloat(el.value);
      el = document.getElementById("discount_rate");
      let discountRate = parseFloat(el.value);
      el = document.getElementById("num_time_periods");
      let numTimePeriods = parseInt(el.value);
      el = document.getElementById("cash_flow");
      let defaultCashFlow = parseFloat(el.value);

      el = document.getElementById("residual_value");
      let residualValue = parseFloat(el.value);
      if (isNaN(residualValue)) {
        residualValue = 0;
        el.value = "";
      }

      if (isNaN(initialInvestment) || initialInvestment < 0 || isNaN(discountRate) || discountRate < 0 ||
        isNaN(numTimePeriods) || numTimePeriods <= 0 || isNaN(defaultCashFlow)) {
        showError("Invalid inputs!");
        return false;
      }

      if (numTimePeriods > 1000) {
        showWarning("Maximum Number of Time Periods is 1000");
        return false
      }

      let cashFlows = [];
      for (let i=1; i<=numTimePeriods; i++) {
        const elId = "cash_flow_" + i;
        let cashFlow = defaultCashFlow;
        el = document.getElementById(elId);
        if (el) {
          let cashFlowValue = parseFloat(el.value);
          if (!isNaN(cashFlowValue)) {
            cashFlow = cashFlowValue;
          }
        }
        if (i === numTimePeriods) {
          cashFlow += residualValue;
        }
        cashFlows.push(cashFlow);
      }

      let npv = computeNPV(initialInvestment, discountRate, numTimePeriods, cashFlows);
      el = document.getElementById("npv");
      el.value = CUR(npv);
      setTextColour(el, npv, "form-control");
      if (cagr < 0) {
        showWarning("Net Present Value is Negative!");
      }

      return true;
    }
  </script>
  </body>
</html>`

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const guid: any = url.searchParams.get("guid");
  const profile: any = url.searchParams.get("profile");
  try {
    if (pathname == "/ping") {
      return new Response(`OK`);
    } else if (pathname == "/cashflow/template") {
      return new Response(JSON.stringify(await getCashFlow(null, profile)), { headers: { 'Content-Type': 'application/json' } });
    } else if (pathname == "/cashflow/api") {
      if (!guid || !profile) {
        return new Response(`Bad request`, {
          status: 400,
          headers: { "content-type": "text/plain" },
        });
      }
      return new Response(JSON.stringify(await getCashFlow(guid, profile)), { headers: { 'Content-Type': 'application/json' } });
    } else if (pathname == "/cashcount/api") {
      return new Response(JSON.stringify(await getCashCount(guid, profile)), { headers: { 'Content-Type': 'application/json' } });
    } else if (pathname == "/income/safactors") {
      return new Response(JSON.stringify(await getSAFactors(guid, profile)), { headers: { 'Content-Type': 'application/json' } });
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