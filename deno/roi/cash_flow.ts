// Monthly budget based on https://itools-ioutils.fcac-acfc.gc.ca/yft-vof/eng/ieb-4-3.aspx
const CASH_FLOW_TEMPLATE = {
  income: [
    { employment: "Employment", freq: {every: 2, period: "week"}, value: 2000 },
    { bonuses: "Bonuses", freq: {every: 1, period: "year"}, value: 5000 },
    { other: "Other", freq: {every: 6, period: "month"}, value: 3000 },
  ],
  fixed_expenses: [
    { rent_or_mortgage: "Rent or mortgage payment", freq: {every: 1, period: "month"}, value: 2000 },
    { property_tax_or_condo_fee: "Property taxes and/or condo fees", freq: {every: 4, period: "month"}, value: 4000/4 },
    { home_insurance: "Home insurance", freq: {every: 1, period: "month"}, value: 100 },
    { utilities: "Utilities (electricity, water, heat)", freq: {every: 1, period: "month"}, value: 400 },
    { communications: "Communications (telephone, Internet, cable)", freq: {every: 1, period: "month"}, value: 200 },
    { transportation: "Transit, Car, or Travel related", freq: {every: 1, period: "month"}, value: 100 },
    { car_loan: "Car loan payment(s)", freq: {every: 1, period: "month"} },
    { other_loans: "Other loan payments", freq: {every: 1, period: "month"} },
  ],
  variable_expenses: [
    { groceries: "Groceries", freq: {every: 1, period: "week"}, value: 100 },
    { eating_out: "Eating out", freq: {every: 1, period: "month"}, value: 200 },
    { household: "Household expenses (maintenance, furniture, etc.)", freq: {every: 1, period: "year"}, value: 1000 },
    { car_related: "Car repairs, gas, etc.", freq: {every: 1, period: "year"}, value: 2500 },
    { computer_related: "Computer equipment and office supplies", freq: {every: 1, period: "year"}, value: 500 },
    { pets_related: "Pets", freq: {every: 1, period: "week"}, value: 20 },
    { health_care: "Health care (dental, medication, glasses/lenses)", freq: {every: 1, period: "month"} },
  ],
};

function getName(entry: any) {
  return Object.keys(entry)[0];
}

function getCaption(entry: any) {
  return entry[getName(entry)];
}

export const getCashFlow = (profile: string = "default") => {
  return {
    income_sources: CASH_FLOW_TEMPLATE.income.map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
    })),
    fixed_expenses: CASH_FLOW_TEMPLATE.fixed_expenses.map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
    })),
    variable_expenses: CASH_FLOW_TEMPLATE.variable_expenses.map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
    })),
  };
}