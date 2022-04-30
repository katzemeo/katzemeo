import api from './api.ts';

function getName(entry: any) {
  return Object.keys(entry)[0];
}

export const getCashCount = async (guid: any, profile: string) => {
  let template: any;
  
  template = await api.getCashCount(guid, profile);
  const categories = template.categories.reduce((s: any, e: any) => {
      const name = getName(e);
      s[name] = e[name];
      return s;
    }, {});

  return {
    from_date: template.from_date,
    to_date: template.to_date ?? new Date(),
    categories: categories,
    quarters: template.quarters.map((e: any) => ({
      name: getName(e),
      multiplier: e.multiplier,
    })),
    loonies: template.loonies.map((e: any) => ({
      name: getName(e),
      multiplier: e.multiplier,
    })),
    toonies: template.toonies.map((e: any) => ({
      name: getName(e),
      multiplier: e.multiplier,
    })),
  };
}