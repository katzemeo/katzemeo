import api from './api.ts';

// General template for counting cash (Canadian Currency)
const CASH_COUNT_CANADIAN_CURRENCY = {
  name: "business",
  from_date: null,
  to_date: null,
  categories: [
    { nickles: "Nickels (5&#162;)", type: "denomination" },
    { dimes: "Dimes (10&#162;)", type: "denomination" },
    { quarters: "Quarters (25&#162;)", type: "denomination" },
    { loonies: "Loonies (1&#36;)", type: "denomination" },
    { toonies: "Toonies (2&#36;)", type: "denomination" },
    { fives: "Fives (5&#36;)", type: "denomination" },
    { tens: "Tens (10&#36;)", type: "denomination" },
    { twenties: "Twenties (20&#36;)", type: "denomination" },
    { fifties: "Fifties (50&#36;)", type: "denomination" },
    { total: "Total" },
  ],
  nickles: [
    { total: "count", multiplier: 0.05 },
  ],
  dimes: [
    { total: "count", multiplier: 0.10 },
  ],
  quarters: [
    { total: "count", multiplier: 0.25 },
  ],
  loonies: [
    { total: "count", multiplier: 1 },
  ],
  toonies: [
    { total: "count", multiplier: 2 },
  ],
  fives: [
    { total: "count", multiplier: 5 },
  ],
  tens: [
    { total: "count", multiplier: 10 },
  ],
  twenties: [
    { total: "count", multiplier: 20 },
  ],
  fifties: [
    { total: "count", multiplier: 50 },
  ],
};

function getName(entry: any) {
  return Object.keys(entry)[0];
}

export const getCashCount = async (guid: any, profile: string) => {
  let template: any = CASH_COUNT_CANADIAN_CURRENCY;
  if (guid && profile) {
    template = await api.getCashCount(guid, profile);
  }

  const categories = template.categories.reduce((s: any, e: any) => {
    const name = getName(e);
    s[name] = e[name];
    return s;
  }, {});

  const denominations = template.categories.reduce((s: any, e: any) => {
    if (e.type) {
      const name = getName(e);
      const entry: any = {};
      entry[name] = template[name].map((e: any) => ({
          name: getName(e),
          multiplier: e.multiplier,
        }));
      s.push(entry);
    }
    return s;
  }, []);

  return {
    from_date: template.from_date,
    to_date: template.to_date ?? new Date(),
    categories: categories,
    denominations: denominations,
  };
}