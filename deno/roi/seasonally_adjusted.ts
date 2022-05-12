import api from './api.ts';

// Sample data for adjusting for seasons
const SEASONALLY_ADJUSTED_FACTORS = {
  name: "business",
  data: [
    { month: 1, value: 10000 },
    { month: 2, value: 10150 },
    { month: 3, value: 14661 },
    { month: 4, value: 14096 },
    { month: 5, value: 15806 },
    { month: 6, value: 15746 },
    { month: 7, value: 14916 },
    { month: 8, value: 15923 },
    { month: 9, value: 15948 },
    { month: 10, value: 15000 },
    { month: 11, value: 15000 },
    { month: 12, value: 13000 },
  ],
};

export const getSAFactors = async (guid: any, profile: string) => {
  let template: any = SEASONALLY_ADJUSTED_FACTORS;
  if (guid && profile) {
    template = SEASONALLY_ADJUSTED_FACTORS; //await api.getSAFactors(guid, profile);
  }

  const factors : any = {};
  let sum = 0;
  for (let i=0; i<template.data.length; i++) {
    sum += template.data[i].value;
  }
  const avg = sum / template.data.length;

  for (let i=0; i<template.data.length; i++) {
    factors[template.data[i].month] = template.data[i].value / avg;
  }

  return factors;
}