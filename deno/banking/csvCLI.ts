import { parse as parseArgs } from "https://deno.land/std@0.128.0/flags/mod.ts"
import { checkFiles, categorizeFiles } from "./csvCategorize.ts"

function checkUsage(args: any) {
  if (args["_"].length > 0) {
    return false;
  }
  return true;
}

const args = parseArgs(Deno.args, {
  default: {
    s: false,
    debug: false,
    d: "."
  },
  boolean: ["a", "debug"],
  string: ["f", "d"],
  alias: {
    f: "file",
    d: "dir",
    s: "summary",
    h: "help"
  }
});

if (args.debug) {
  console.log(args);
}

if (args.help || !checkUsage(args)) {
  console.log(`Parse banking CSV files and summarize the transactions based on "Description 1" and "Description 2" columns in CAD$\n
Examples:
  csvCLI.exe -d c:\\laundromat\\bank -f "2020 - banking.csv" -f "2021 - banking.csv"
  csvCLI.exe -d c:\\laundromat\\bank --summary

Usage:
  -f or --file <CSV file> : specify the path to CSV file (repeat option to specify multiple files)
  -d or --dir <source dir> : specify the folder containing CSV file(s) to parse (defaults to current directory)
  -s or --summary: print transaction summary for each CSV file as well as grand totals
  --debug : print diagnostics for validating the processing
  -h or --help : show this usage help`);
} else {
  const files: string[] = [];
  try {
    checkFiles(args, files);
    await categorizeFiles(args, files, null);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}
