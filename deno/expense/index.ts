import { serve } from "https://deno.land/std@0.128.0/http/server.ts";
import { open } from "https://deno.land/x/open/index.ts";
import { getExpenseTemplate } from "./expense_template.ts";

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
    <title id="title">Expenses @katzemeo</title>
    <link rel="icon" href="https://invest.npsolve.com/public/favicon.ico">

    <!-- Option 1: Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
      crossorigin="anonymous">
    </script>  
  </head>
  <body oncontextmenu="return false;">
  <div class="container mt-sm-3 px-sm-3 px-0">
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
      <li class="nav-item" role="presentation" title="Variable Expenses"> <button class="nav-link" name="variable" id="variable-tab" data-bs-toggle="tab" data-bs-target="#variable-pane" type="button" role="tab" aria-controls="variable-pane" aria-selected="false"><nobr><i class="fas fa-chart-line"></i> Variable</nobr></button> </li>
      <li class="nav-item" role="presentation" title="Fixed Expenses"> <button class="nav-link" name="fixed" id="fixed-tab" data-bs-toggle="tab" data-bs-target="#fixed-pane" type="button" role="tab" aria-controls="fixed-pane" aria-selected="false"><nobr><i class="fas fa-dollar-sign"></i> Fixed</button></nobr></li>
      <li class="nav-item" role="presentation" title="Intermittent Expenses"> <button class="nav-link" name="intermittent" id="intermittent-tab" data-bs-toggle="tab" data-bs-target="#intermittent-pane" type="button" role="tab" aria-controls="intermittent-pane" aria-selected="false"><nobr><i class="fas fa-sack-dollar"></i> Intermittent</nobr></button> </li>
      <li class="nav-item" role="presentation" title="Discretionary Expenses"> <button class="nav-link" name="discretionary" id="discretionary-tab" data-bs-toggle="tab" data-bs-target="#discretionary-pane" type="button" role="tab" aria-controls="discretionary-pane" aria-selected="false"><nobr><i class="fas fa-coins"></i> Discretionary</button></nobr></li>
    </ul>
    <div class="border-grey bg-white p-2 tab-content">
      <div class="tab-pane active" id="home-pane" role="tabpanel" aria-labelledby="home-tab">
        <div class="d-flex justify-content-between">
          <div>
            <p class="fw-bold">
              <a class="text-decoration-none" target="katzemeo" href="https://twitter.com/katzemeo" title='Follow "Silvester the Invester" on Twitter @katzemeo'>
                <img src="https://invest.npsolve.com/public/silvester.png" alt="Silvester" width="48" height="48">
              </a>
              Welcome!
            </p>
          </div>
          <div>
            <button class="btn btn-primary mb-1" type="button" onclick="clearAllValues()" title="Clear All Values"><i class="fa-solid fa-rotate"></i></button>
            <button class="btn btn-primary mb-1" type="button" onclick="deleteLocalStorage()" title="Delete Local Storage"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <p>
        The following application can help you better track your expenses and help ensure a positive cash flow.
        </p>
        <div id="total_expenses" class="mb-3" style="display: none;">
          <div class="row align-items-end">
            <div class="col">
              <label>Annual Expenses</label><br>
              <input class="form-control text-danger" type="text" id="total_annual_expense" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Monthly Expenses</label><br>
              <input class="form-control text-danger" type="text" id="total_monthly_expense" readonly="readonly"/>
            </div>
          </div>
          <div class="row align-items-end">
            <div class="col">
              <label>Weekly Expenses</label><br>
              <input class="form-control text-danger" type="text" id="total_weekly_expense" readonly="readonly"/>
            </div>
            <div class="col">
              <label>Daily Expenses</label><br>
              <input class="form-control text-danger" type="text" id="total_daily_expense" readonly="readonly"/>
            </div>
          </div>
        </div>
        <ul>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('variable-tab').click()">Variable</a> tab is used to track expenses that varies from month to month (e.g. utilities, groceries).</li>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('fixed-tab').click()">Fixed</a> tab is used to track all your fixed expenses (e.g. rent, internet).</li>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('intermittent-tab').click()">Intermittent</a> tab is used to track irregular but typically larger expenses (e.g. car repairs, tuition).</li>
          <li>The <a class="text-decoration-none" href="javascript:document.getElementById('discretionary-tab').click()">Discretionary</a> tab is used to track non-essential spending (e.g. donations, eating out).</li>
          </ul>
        <p class="text-muted"> The tools are implemented as a stateless single-page application (SPA) built primarily with HTML 5, JavaScript and Bootstrap 5 on the UI side and hosted at the edge on
        <a class="text-decoration-none" href="https://deno.com/deploy" target="_blank" rel="noopener noreferrer">Deno Deploy</a>.  Authentication and database persistence is implement with <a class="text-decoration-none" href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase</a>.
        If interested, you can see the details on <a class="text-decoration-none" href="https://github.com/katzemeo/katzemeo/tree/main/deno/expense" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
      </div>
      <div class="tab-pane" id="variable-pane" role="tabpanel" aria-labelledby="variable-tab">
        <div class="d-flex justify-content-between">
          <div>
            <p class="fw-bold text-dark">Variable Expenses
            <button class="btn btn-primary mb-1" type="button" onclick="toggleEditMode()" title="Edit Mode"><i class="fa-solid fa-pen"></i></button>
            </p>
          </div>
          <div>
            <button name="edit-hide-show" class="btn btn-primary" type="button" onclick="addEntry('variable')" title="Edit Entry" style="display: none;"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        <div id="variable_expenses" class="p-1">
        </div>
      </div>
      <div class="tab-pane" id="fixed-pane" role="tabpanel" aria-labelledby="fixed-tab">
        <div id="fixed_expenses" class="p-1">
        </div>
      </div>
      <div class="tab-pane" id="intermittent-pane" role="tabpanel" aria-labelledby="intermittent-tab">
        <div id="intermittent_expenses" class="p-1">
        </div>
      </div>
      <div class="tab-pane" id="discretionary-pane" role="tabpanel" aria-labelledby="discretionary-tab">   
        <div id="discretionary_expenses" class="p-1">
        </div>
      </div>
    </div>
  </div>
  <footer>
    <div class="text-center text-muted fs-6">v0.2 - &copy; 2022-05-15</div>
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
    var _expense_template = null;
    var _edit_mode = false;

    const formatDate = (dt, timeZone = TIME_ZONE) => {
      return dt ? new Date(dt).toLocaleDateString('en-us', { timeZone: timeZone, weekday: "long", year: "numeric", month: "short", day: "numeric" }) : "";
    }

    function formatTime(dt, timeZone = TIME_ZONE) {
      return dt ? new Date(dt).toLocaleTimeString('en-us', { timeZone: timeZone, weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "";
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
      if (entry.value) {
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
      el.setAttribute("onchange", "onChangeHandler()");
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
      //el.setAttribute("size", "2");
      el.setAttribute("onchange", "onChangeHandler()");
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
      el.setAttribute("onchange", "onChangeHandler()");
      return el;
    };

    const createEditEntry = (entry) => {
      const el = document.createElement("button");
      el.name = "edit-hide-show";
      el.className = "btn btn-primary";
      el.title = "Edit Mode";
      el.style = "display: none";
      el.setAttribute("onclick", "editEntry('variable')");
      el.innerHTML = '<i class="fa-solid fa-angles-right"/>';
      return el;
    };

    const toggleEditMode = () => {
      _edit_mode = !_edit_mode;
      const editMode = _edit_mode;
      let editButtons = document.querySelectorAll('button[name = edit-hide-show]');
      if (editButtons && editButtons.length > 0) {
        editButtons.forEach((el) => {
          if (editMode) {
            el.style = "display: block";
          } else {
            el.style = "display: none";
          }
        });
      }
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

    const createReadonlyInput = (elementId) => {
      const el = document.createElement("input");
      el.type = "text";
      el.setAttribute("readonly", "readonly");
      el.id = elementId;
      el.className = "form-control text-danger";
      return el;
    }

    const createLabelReadonlyInput = (labelText, elementId) => {
      const divCol = createDiv("col");
      const label = document.createElement("label");
      label.innerText = labelText;
      divCol.appendChild(label);
      divCol.appendChild(createReadonlyInput(elementId));
      return divCol;
    }

    const createLabelReadonlyInputs = (labelText1, elementId1, labelText2, elementId2) => {
      const divRowEntry = createDiv("row align-items-center");
      divRowEntry.appendChild(createLabelReadonlyInput(labelText1, elementId1));
      divRowEntry.appendChild(createLabelReadonlyInput(labelText2, elementId2));
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
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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

    const buildExpenseUI = () => {
      let groups = ["variable", "fixed", "intermittent", "discretionary"];
      groups.forEach((group) => {
        const groupEl = document.getElementById(group +"_expenses");
        groupEl.appendChild(createLabelReadonlyInputs("Annual Total", group +"_annual_total", "Monthly Total", group +"_monthly_total"));
        groupEl.appendChild(document.createElement("br"));
        _expense_template[group].forEach((entry) => {
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
          const divEdit = createDiv("col-auto", "Edit");
          divEdit.appendChild(createEditEntry(entry));
          divRowEntry.appendChild(divEdit);
          divCol.appendChild(divRowEntry);
  
          divRow.appendChild(divCol);
          p.appendChild(divRow);
          groupEl.appendChild(p);
        });
      });
    };

    const updateExpenseTemplate = () => {
      Object.keys(_expense_template).forEach((group) => {
        _expense_template[group].forEach((entry) => {
          const valueEl = document.getElementById(entry.name);
          const freqEl = document.getElementById(entry.name+"_freq");
          const periodEl = document.getElementById(entry.name+"_period");
          entry.value = valueEl.value ? parseFloat(valueEl.value) : "";
          entry.freq.every = parseInt(freqEl.value);
          entry.freq.period = periodEl.value;
        });
      });
    };

    const getExpenseTemplate = () => {
      const params = new URLSearchParams();
      if (_guid) {
        params.set("guid", _guid);
      }
      params.set("profile", _profile ?? "template");
      let url = "/expense" + "?" + params.toString();
      fetch(url, {
        method: "GET",
        headers: JSON_HEADERS,
      }).then((res) => {
        if (res.status == 200) {
          res.json().then((data) => {
            _expense_template = data;
            buildExpenseUI();
            calculateTotal();
          });
        } else {
          showError("Unable to lookup Expense template.");
          console.log("Unexpected response", res.status);
        }
      }).catch((error) => {
        console.error(error);
        window.alert("Unable to get Expense template.  Please try again.");
      });
    };

    const configureTabs = () => {
      let tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
      tabs.forEach((tab) => {
        tab.addEventListener('show.bs.tab', function (event) {
          if (event.target && event.target.name !== "home") {
            if (!_expense_template) {
              getExpenseTemplate();
            }
          }
        });
      });
    };

    var _modified = false;
    var _state = null;
    const saveToStorage = () => {
      if (localStorage && _modified) {
        updateExpenseTemplate();
        _state = {};
        _state.template = _expense_template;
        _state.lastModified = new Date();
        localStorage.setItem("npsolve.expense", JSON.stringify(_state));
        _modified = false;
        showInfo("Saved latest state to local storage (Updated: "+ formatTime(_state.lastModified) +")");
      } else if (!localStorage) {
        showWarning("Local storage not supported!");
      }
    };

    const restoreFromStorage = () => {
      if (localStorage) {
        _state = localStorage.getItem("npsolve.expense");
        if (_state) {
          try {
            _state = JSON.parse(_state);
            _expense_template = _state.template;
            showInfo("Restored state to local storage (Updated: "+ formatTime(_state.lastModified) +")");
            if (_expense_template) {
              buildExpenseUI();
              calculateTotal();
            }
            return true;
          } catch (error) {
            console.log(error);
            _expense_template = null;
          }
        }
        _modified = false;
      } else if (!localStorage) {
        showWarning("Local storage not supported!");
      }
      return false;
    };

    const clearAllValues = () => {
      if (_expense_template) {
        Object.keys(_expense_template).forEach((group) => {
          _expense_template[group].forEach((entry) => {
            const valueEl = document.getElementById(entry.name);
            valueEl.value = "";
            delete entry.value;
          });
        });
        calculateTotal();
      }
    };

    const deleteLocalStorage = () => {
      if (localStorage) {
        localStorage.removeItem("npsolve.expense");
        showInfo("Removed state from local storage. Refreshing...");
        setTimeout(function() { document.location.reload(true); }, 1000);
      } else {
        showWarning("Local storage not supported!");
      }
    };

    const configureAutomaticSave = () => {
      if (localStorage) {
        setInterval(saveToStorage, 60 * 1000);
      } else {
        showWarning("Local storage not supported!");
      }
    };

    window.onload = function () {
      const url = new URL(window.location.href);
      _guid = url.searchParams.get("guid");
      _profile = url.searchParams.get("profile");
      if (!restoreFromStorage()) {
        showInfo("Today is "+ formatDate(new Date()));
      }
      configureTabs();
      configureAutomaticSave();

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

    function calculateGroupYearly(group) {
      let total = 0;
      group.forEach((entry) => {
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
            factor /= freq;
          }
          total += value * factor;
        }
      });
      return total;
    }

    function onChangeHandler() {
      _modified = true;
      calculateTotal();
    }

    function calculateTotal(subtotals = {}) {
      let total = 0;
      Object.keys(_expense_template).forEach((name) => {
        const group = _expense_template[name];
        const groupTotal = calculateGroupYearly(group);

        let el = document.getElementById(name +"_annual_total");
        el.value = CUR(groupTotal);
        el = document.getElementById(name +"_monthly_total");
        el.value = CUR(groupTotal/12);
        total += groupTotal;
      });

      const groupEl = document.getElementById("total_expenses");
      groupEl.style = "display: block";
      let totalEl = document.getElementById("total_annual_expense");
      totalEl.value = CUR(total);
      totalEl = document.getElementById("total_monthly_expense");
      totalEl.value = CUR(total/12);
      totalEl = document.getElementById("total_weekly_expense");
      totalEl.value = CUR(total/52);
      totalEl = document.getElementById("total_daily_expense");
      totalEl.value = CUR(total/365);

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
    } else if (pathname == "/expense") {
      return new Response(JSON.stringify(await getExpenseTemplate(guid, profile)), { headers: { 'Content-Type': 'application/json' } });
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