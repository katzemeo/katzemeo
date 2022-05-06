import { serve } from "https://deno.land/std@0.128.0/http/server.ts";
import { open } from "https://deno.land/x/open/index.ts";
import { getCashCount } from "./cash_count.ts";
import { getCashFlow } from "./cash_flow.ts";

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

    <!-- Option 1: Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
      crossorigin="anonymous">
    </script>  
  </head>
  <body oncontextmenu="return false;">
  <div class="container mt-3">
    <ul class="m-0 nav nav-fill nav-justified nav-tabs" id="tab-nav" role="tablist">
      <li class="nav-item" role="presentation" title="Introduction and Notes"> <button class="active nav-link" name="home" id="home-tab" data-bs-toggle="tab" data-bs-target="#home-pane" type="button" role="tab" aria-controls="home-pane" aria-selected="true"><nobr><i class="fas fa-home"></i> Home</button></nobr></li>
      <li class="nav-item" role="presentation" title="Cash Count for Date"> <button class="nav-link" name="cashcount" id="cashcount-tab" data-bs-toggle="tab" data-bs-target="#cashcount-pane" type="button" role="tab" aria-controls="cashcount-pane" aria-selected="false"><nobr><i class="fas fa-coins"></i> Cash Count</button></nobr></li>
      <li class="nav-item" role="presentation" title="Extrapolated Income from Date Range"> <button class="nav-link" name="income" id="income-tab" data-bs-toggle="tab" data-bs-target="#income-pane" type="button" role="tab" aria-controls="income-pane" aria-selected="false"><nobr><i class="fas fa-dollar-sign"></i> Income</button></nobr></li>
      <li class="nav-item" role="presentation" title="Compound Annual Growth Rate (CAGR)"> <button class="nav-link" name="cagr" id="cagr-tab" data-bs-toggle="tab" data-bs-target="#cagr-pane" type="button" role="tab" aria-controls="cagr-pane" aria-selected="false"><nobr><i class="fas fa-percent"></i> CAGR</button></nobr></li>
      <li class="nav-item" role="presentation" title="Cash Flow Analysis"> <button class="nav-link" name="cashflow" id="cashflow-tab" data-bs-toggle="tab" data-bs-target="#cashflow-pane" type="button" role="tab" aria-controls="cashflow-pane" aria-selected="false"><nobr><i class="fas fa-chart-line"></i> Cash Flow</nobr></button> </li>  
    </ul>
    <div class="border-grey bg-white p-2 tab-content">
      <div class="tab-pane active" id="home-pane" role="tabpanel" aria-labelledby="home-tab">
        <p class="fw-bold">
          <a class="text-decoration-none" target="katzemeo" href="https://twitter.com/katzemeo" title='Follow "Silvester the Invester" on Twitter @katzemeo'>
            <img src="https://invest.npsolve.com/public/silvester.png" alt="Silvester" width="48" height="48">
          </a>
          Welcome!
        </p>
        <p> The following tools can help you measure Return on Investments (ROI),
        <a class="text-decoration-none" href="javascript:document.getElementById('cashcount-tab').click()">Count Cash</a>,
        calculate and assess your potential Cash Flow risks. </p>
        <ul>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('income-tab').click()">Income</a> tab help calculate the daily average as well as extrapolated monthly and annual income.</li>
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
        <p id="cashcount_totals" />
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
        <p>
          <label>ROI</label><br>
          <input class="form-control text-muted" type="text" id="roi" readonly="readonly"/>
        </p>
        <p>
          <label>CAGR</label><br>
          <input class="form-control text-muted" type="text" id="cagr" readonly="readonly"/>
        </p>
        <p id="cagr_table" />
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
        <br/>
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
        <p id="cashflow_net" />
      </div>
    </div>
  </div>
  <footer>
    <div class="text-center text-muted fs-6">v0.3 - &copy; 05/05/2022</div>
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
    var _guid = null;
    var _profile = null;
    var _cash_count_template = null;
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

    const createDiv = (className, title=null) => {
      const el = document.createElement("div");
      el.className = className;
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

      el = document.getElementById("count_from_date");
      el.valueAsDate = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 7);
      el = document.getElementById("count_to_date");
      el.valueAsDate = NOW;

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
        data.total_days = document.getElementById("total_days").value;
        data.daily_average = document.getElementById("daily_average").value;
        data.monthly_income = document.getElementById("monthly_income").value;
        data.annual_income = document.getElementById("annual_income").value;
      }
      return data;
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
      if (roi < 0) {
        el.className = "form-control text-danger";
      } else {
        el.className = "form-control text-success";
      }

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
          if (cagr < 0) {
            el.className = "form-control text-danger";
          } else {
            el.className = "form-control text-success";
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
  </script>
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
    } else if (pathname == "/cashcount/api") {
      const guid: any = url.searchParams.get("guid");
      const profile: any = url.searchParams.get("profile");
      return new Response(JSON.stringify(await getCashCount(guid, profile)), { headers: { 'Content-Type': 'application/json' } });
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