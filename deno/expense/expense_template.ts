
// Monthly budget based on https://itools-ioutils.fcac-acfc.gc.ca/yft-vof/eng/ieb-4-3.aspx
const EXPENSE_TEMPLATE_DEFAULT = {
  variable: [
    { groceries: "Groceries", freq: {every: 1, period: "week"}, value: 100, step: 10 },
    { utilities: "Utilities (electricity, water, heat)", freq: {every: 1, period: "month"}, value: 400, step: 25 },
    { household: "Household expenses (maint., furniture, etc.)", freq: {every: 1, period: "year"}, value: 1000, step: 100 },
    { computer_related: "Computer equipment and office supplies", freq: {every: 1, period: "year"}, value: 500, step: 100 },
    { pets_related: "Pets", freq: {every: 1, period: "week"}, value: 20, step: 10 },
    { clothing_footwear: "Clothing and footwear", freq: {every: 1, period: "month"}, value: 100, step: 20 },
    { personal_care: "Personal care (toiletries, hair care, makeup, laundry)", freq: {every: 1, period: "week"}, value: 20 },
  ],
  fixed: [
    { rent_or_mortgage: "Rent or mortgage payment", freq: {every: 1, period: "month"}, value: 2000, step: 100 },
    { property_tax_or_condo_fee: "Property taxes and/or condo fees", freq: {every: 4, period: "month"}, value: 4000/4, step: 100 },
    { home_insurance: "Home insurance", freq: {every: 1, period: "month"}, value: 100, step: 10 },
    { communications: "Communications (telephone, internet, cable)", freq: {every: 1, period: "month"}, value: 200 },
    { transportation: "Transit, Car, or Travel related", freq: {every: 1, period: "month"}, value: 100 },
    { car_loan: "Car loan payment(s)", freq: {every: 1, period: "month"}, step: 100 },
    { other_loans: "Other loan payments", freq: {every: 1, period: "month"}, step: 100 },
    { child_care: "Child care", freq: {every: 1, period: "month"}, step: 100 },
    { bank_service_fees: "Banking and credit card service fees", freq: {every: 1, period: "month"}, value: 4 },
    { savings: "Savings", freq: {every: 1, period: "year"}, step: 1000 },
  ],
  intermittent: [
    { car_related: "Car repairs, gas, etc.", freq: {every: 1, period: "year"}, value: 2500, step: 250 },
    { health_care: "Health care (dental, medication, glasses/lenses)", freq: {every: 1, period: "month"}, step: 100 },
    { education: "Education (tuition, books, fees, etc.)", freq: {every: 1, period: "year"}, step: 500 },
  ],
  discretionary: [
    { eating_out: "Eating out", freq: {every: 1, period: "month"}, value: 200, step: 50 },
    { recreation: "Recreation", freq: {every: 1, period: "month"}, value: 100, step: 25 },
    { travel: "Travel", freq: {every: 1, period: "year"}, value: 1000, step: 500 },
    { gifts_donations: "Gifts and charitable donations", freq: {every: 1, period: "year"}, value: 1000, step: 200 },
  ],
};

// Expense template for a Univesity/College student
const EXPENSE_TEMPLATE_STUDENT = {
  variable: [
    { groceries: "Groceries", freq: {every: 1, period: "week"}, value: 100, step: 10 },
    { utilities: "Utilities (electricity, water, heat)", freq: {every: 1, period: "month"}, value: 0, step: 25 },
    //{ household: "Household expenses (maint., furniture, etc.)", freq: {every: 1, period: "year"}, value: 1000, step: 100 },
    { computer_related: "Computer equipment and office supplies", freq: {every: 1, period: "year"}, value: 0, step: 100 },
    //{ pets_related: "Pets", freq: {every: 1, period: "week"}, value: 0, step: 10 },
    { clothing_footwear: "Clothing and footwear", freq: {every: 1, period: "month"}, value: 0, step: 20 },
    { personal_care: "Personal care (toiletries, hair care, makeup, laundry)", freq: {every: 1, period: "week"}, value: 0 },
  ],
  fixed: [
    { rent_or_mortgage: "Rent or mortgage payment", freq: {every: 1, period: "month"}, value: 3400/2, step: 100 },
    //{ property_tax_or_condo_fee: "Property taxes and/or condo fees", freq: {every: 4, period: "month"}, value: 4000/4, step: 100 },
    //{ home_insurance: "Home insurance", freq: {every: 1, period: "month"}, value: 100, step: 10 },
    { communications: "Communications (telephone, internet, cable)", freq: {every: 1, period: "month"}, value: 150/2 },
    { transportation: "Transit, Car, or Travel related", freq: {every: 1, period: "month"}, value: 100 },
    //{ car_loan: "Car loan payment(s)", freq: {every: 1, period: "month"}, step: 100 },
    //{ other_loans: "Other loan payments", freq: {every: 1, period: "month"}, step: 100 },
    //{ child_care: "Child care", freq: {every: 1, period: "month"}, step: 100 },
    //{ bank_service_fees: "Banking and credit card service fees", freq: {every: 1, period: "month"}, value: 4 },
    //{ savings: "Savings", freq: {every: 1, period: "year"}, step: 1000 },
  ],
  intermittent: [
    //{ car_related: "Car repairs, gas, etc.", freq: {every: 1, period: "year"}, value: 2500, step: 250 },
    //{ health_care: "Health care (dental, medication, glasses/lenses)", freq: {every: 1, period: "month"}, step: 100 },
    { education: "Education (tuition, books, fees, etc.)", freq: {every: 1, period: "year"}, value: 6100, step: 500 },
  ],
  discretionary: [
    { eating_out: "Eating out", freq: {every: 1, period: "month"}, value: 0, step: 50 },
    { recreation: "Recreation", freq: {every: 1, period: "month"}, value: 0, step: 25 },
    //{ travel: "Travel", freq: {every: 1, period: "year"}, value: 0, step: 500 },
    //{ gifts_donations: "Gifts and charitable donations", freq: {every: 1, period: "year"}, value: 1000, step: 200 },
  ],
};

function getName(entry: any) {
  return Object.keys(entry)[0];
}

function getCaption(entry: any) {
  return entry[getName(entry)];
}

export const getExpenseTemplate = async (guid: any = null, profile: string = "default") => {
  let template: any = profile === "student" ? EXPENSE_TEMPLATE_STUDENT : EXPENSE_TEMPLATE_DEFAULT;
  const data: any = {};
  Object.keys(template).forEach((group: string) => {
    data[group] = template[group].map((e: any) => ({
      name: getName(e),
      caption: getCaption(e),
      freq: e.freq,
      value: e.value,
      step: e.step,
    }));
  });
  return data;
}
