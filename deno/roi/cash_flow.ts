import api from './api.ts';

// Monthly budget for a single individual
const CASH_FLOW_SINGLE = {
  income: [
    { employment: "Employment", freq: {every: 1, period: "month"}, value: 4000 },
    { bonuses: "Bonuses", freq: {every: 1, period: "year"}, value: 2000 },
    { other: "Other", freq: {every: 1, period: "month"} },
  ],
  fixed_expenses: [
    { mortgage: "Mortgage payment", freq: {every: 1, period: "month"}, value: 2000 },
    { car: "Car payment", freq: {every: 1, period: "month"}, value: 43000/72 },
    { hydro: "Hydro", freq: {every: 1, period: "month"}, value: 100 },
    { water: "Water", freq: {every: 1, period: "month"}, value: 50 },
    { heating_cooling: "Heating and Cooling", freq: {every: 1, period: "month"}, value: 85 },
    { cell_phone: "Cell Phone", freq: {every: 1, period: "month"}, value: 50 },
    { gas: "Gas", freq: {every: 1, period: "month"}, value: 200 },
    { insurance: "Insurance (Home and Auto)", freq: {every: 1, period: "month"}, value: 120 },
    { internet: "Internet", freq: {every: 1, period: "month"}, value: 100 },
  ],
  variable_expenses: [
    { food: "Food", freq: {every: 1, period: "month"}, value: 200 },
    { entertainment: "Entertainment", freq: {every: 1, period: "month"}, value: 90 },
  ],
};

// Monthly budget based on https://itools-ioutils.fcac-acfc.gc.ca/yft-vof/eng/ieb-4-3.aspx
const CASH_FLOW_DEFAULT = {
  income: [
    { employment: "Employment (after deductions)", freq: {every: 2, period: "week"}, value: 2500, step: 500 },
    { bonuses: "Bonuses (after deductions)", freq: {every: 1, period: "year"}, value: 5000, step: 1000 },
    { tips_commissions: "Tips or commissions", freq: {every: 1, period: "week"}, step: 100 },
    { govt_payments: "Government payments", freq: {every: 1, period: "month"}, step: 100 },
    { self_employment: "Self-employment (net)", freq: {every: 1, period: "month"}, step: 1000 },
    { gifts: "Gifts", freq: {every: 1, period: "year"}, step: 1000 },
    { grants_scholarships: "Grants or scholarships", freq: {every: 1, period: "year"}, step: 500 },
    { royalties: "Royalties", freq: {every: 1, period: "year"}, step: 1000 },
    { other: "Other", freq: {every: 1, period: "month"}, step: 100 },
  ],
  fixed_expenses: [
    { rent_or_mortgage: "Rent or mortgage payment", freq: {every: 1, period: "month"}, value: 2000, step: 100 },
    { property_tax_or_condo_fee: "Property taxes and/or condo fees", freq: {every: 4, period: "month"}, value: 4000/4, step: 100 },
    { home_insurance: "Home insurance", freq: {every: 1, period: "month"}, value: 100, step: 10 },
    { utilities: "Utilities (electricity, water, heat)", freq: {every: 1, period: "month"}, value: 400, step: 25 },
    { communications: "Communications (telephone, internet, cable)", freq: {every: 1, period: "month"}, value: 200 },
    { transportation: "Transit, Car, or Travel related", freq: {every: 1, period: "month"}, value: 100 },
    { car_loan: "Car loan payment(s)", freq: {every: 1, period: "month"}, step: 100 },
    { other_loans: "Other loan payments", freq: {every: 1, period: "month"}, step: 100 },
    { child_care: "Child care", freq: {every: 1, period: "month"}, step: 100 },
    { bank_service_fees: "Banking and credit card service fees", freq: {every: 1, period: "month"}, value: 4 },
    { savings: "Savings", freq: {every: 1, period: "year"}, step: 1000 },
  ],
  variable_expenses: [
    { groceries: "Groceries", freq: {every: 1, period: "week"}, value: 100, step: 10 },
    { eating_out: "Eating out", freq: {every: 1, period: "month"}, value: 200, step: 50 },
    { household: "Household expenses (maint., furniture, etc.)", freq: {every: 1, period: "year"}, value: 1000, step: 100 },
    { car_related: "Car repairs, gas, etc.", freq: {every: 1, period: "year"}, value: 2500, step: 250 },
    { computer_related: "Computer equipment and office supplies", freq: {every: 1, period: "year"}, value: 500, step: 100 },
    { pets_related: "Pets", freq: {every: 1, period: "week"}, value: 20, step: 10 },
    { health_care: "Health care (dental, medication, glasses/lenses)", freq: {every: 1, period: "month"}, step: 100 },
    { clothing_footwear: "Clothing and footwear", freq: {every: 1, period: "month"}, value: 100, step: 20 },
    { personal_care: "Personal care (toiletries, hair care, makeup, laundry)", freq: {every: 1, period: "week"}, value: 20 },
    { recreation: "Recreation", freq: {every: 1, period: "month"}, value: 100, step: 25 },
    { travel: "Travel", freq: {every: 1, period: "year"}, value: 1000, step: 500 },
    { gifts_donations: "Gifts and charitable donations", freq: {every: 1, period: "year"}, value: 1000, step: 200 },
    { education: "Education (tuition, books, fees, etc.)", freq: {every: 1, period: "year"}, step: 500 },
  ],
};

function getName(entry: any) {
  return Object.keys(entry)[0];
}

function getCaption(entry: any) {
  return entry[getName(entry)];
}

export const getCashFlow = async (guid: any = null, profile: string = "default") => {
  let template: any;
  if (guid) {
    template = await api.getCashFlow(guid, profile);
  } else {
    template = profile == "single" ? CASH_FLOW_SINGLE : CASH_FLOW_DEFAULT;
  }

  if (!template) {
    throw new Error(`CashFlow profile "${profile}" not found!`);
  }

  return {
    income_sources: template.income.map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
      step: e.step,
    })),
    fixed_expenses: template.fixed_expenses.map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
      step: e.step,
    })),
    variable_expenses: template.variable_expenses.map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
      step: e.step,
    })),
    remittance_rate: template.remittance_rate ?? 0,
    tax_rate: template.tax_rate ?? 0
  };
}
