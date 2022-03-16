import { parse as parseArgs } from "https://deno.land/std@0.128.0/flags/mod.ts"
import { normalize, isAbsolute, join, basename } from "https://deno.land/std@0.128.0/path/mod.ts";
import { parse as parseCSV } from "https://deno.land/std@0.128.0/encoding/csv.ts";
import { StringReader } from "https://deno.land/std@0.128.0/io/readers.ts";
import { BufReader } from "https://deno.land/std@0.128.0/io/bufio.ts";

const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format;

export const parseCSVText = async (text: string) => {
  const bufReader = new BufReader(new StringReader(text));
  let json: Array<any> = await parseCSV(bufReader, {
    skipFirstRow: true
  });
  return json;
};

export const parseCSVFile = async (csvFile: string) => {
  try {
    const text = await Deno.readTextFile(csvFile);
    //console.log(text);
    return await parseCSVText(text);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      throw new Error("Specified CSV file not found!");
    }
    throw e;
  }
};

const DESC_1_REGEX = [
  { pattern: `ACCOUNT TRANSFER`, categorize: true },
  { pattern: `ATM cash deposited fee`, categorize: false },
  { pattern: `ATM deposit - .*` },
  { pattern: `ATM withdrawal - .*` },
  { pattern: `BR TO BR - [0-9]+`, credit: false },
  { pattern: `BR TO BR - [0-9]+`, credit: true },
  { pattern: `Bill Payment`, categorize: true },
  { pattern: `COMMERCIAL TAXES`, categorize: true },
  { pattern: `Cash withdrawal` },
  { pattern: `Cheque - [0-9]+` },
  { pattern: `Cheque returned NSF` },
  { pattern: `Chq Printing Fee`, categorize: true },
  { pattern: `Credit Memo`, categorize: true },
  { pattern: `Credit memo` },
  { pattern: `Deposit [' ']* [0-9]+` },
  { pattern: `Deposit`, credit: false, categorize: true },
  { pattern: `Deposit`, credit: true, categorize: true },
  { pattern: `Federal Payment`, categorize: true },
  { pattern: `INTERAC e-Transfer cancel - [0-9]+` },
  { pattern: `INTERAC e-Transfer fee` },
  { pattern: `In branch cash deposited fee`, categorize: false },
  { pattern: `Interac purchase - [0-9]+`, categorize: true },
  { pattern: `Interac purchase refund - [0-9]+`, categorize: true },
  { pattern: `Item returned NSF` },
  { pattern: `Items on deposit fee`, categorize: false },
  { pattern: `Loan payment`, categorize: true },
  { pattern: `Misc Payment`, categorize: true },
  { pattern: `Monthly fee` },
  { pattern: `NSF item fee` },
  { pattern: `Online Banking payment - [0-9]+`, categorize: true },
  { pattern: `Online Banking transfer - [0-9]+`, credit: false },
  { pattern: `Online Banking transfer - [0-9]+`, credit: true },
  { pattern: `Online transfer received - [0-9]+`, categorize: true },
  { pattern: `Online transfer sent - [0-9]+`, categorize: true },
  { pattern: `Other loan`, categorize: true },
  { pattern: `Overdraft handling fee`, categorize: true },
  { pattern: `Overdraft interest`, categorize: true },
  { pattern: `Pay Employee-Vendor`, categorize: true },
  { pattern: `Regular transaction fee`, categorize: false },
  { pattern: `e-Transfer received` },
  { pattern: `e-Transfer sent`, categorize: true },

  { pattern: `CASH WITHDRAWAL`, categorize: true },
  { pattern: `DEPOSIT INTEREST`, categorize: true },
  { pattern: `DEPOSIT`, categorize: true },
  { pattern: `Email Trfs`, categorize: true },
  { pattern: `INSURANCE`, credit: false, categorize: true },
  { pattern: `INSURANCE`, credit: true, categorize: true },
  { pattern: `INVESTMENT`, categorize: false },
  { pattern: `MONTHLY FEE`, categorize: false },
  { pattern: `MORTGAGE PAYMENT`, categorize: false },
  { pattern: `MULTIPRODUCT REBATE`, categorize: false },
  { pattern: `MUTUAL FUNDS`, categorize: true },
  { pattern: `Payment`, categorize: true, buckets: [`WWW PAYMENT - [0-9]+ (.*)`] },
  { pattern: `SCHEDULED PAYMENT`, categorize: true },
  { pattern: `STAFF - PAYROLL`, categorize: true },
  { pattern: `TAX REFUND`, categorize: true },
  { pattern: `Transfer`, credit: false, categorize: false },
  { pattern: `Transfer`, credit: true, categorize: false },
  { pattern: `WWW PAYMENT - .*`, categorize: true },
  { pattern: `WWW TRF DDA - .*`, categorize: true },
  { pattern: `Withdrawal`, categorize: true, buckets: [`(PTB WD) --- .*`] },
];

function prepareRegex(regexDefns: any) {
  regexDefns.forEach((rd: any) => {
    rd.regex = new RegExp(rd.pattern);
    if (rd.buckets) {
      rd.bucketsRegex = [];
      rd.buckets.forEach((brd: any) => {
        rd.bucketsRegex.push(new RegExp(brd));
      });
    }
  });
}

function descMapToCSV(json: any) {
  console.log(`"DESCRIPTION",COUNT,TOTAL`);
  for (const key in json) {
    if (json[key].desc2Map) {
      let desc2Map: any = json[key].desc2Map;
      for (const key2 in desc2Map) {
        const subcategory = key2 ? ` - [${key2}]` : "";
        console.log(`"${key}${subcategory}", ${desc2Map[key2].count}, ${desc2Map[key2].value.toFixed(2)}`);
      }
    } else {
      console.log(`"${key}", ${json[key].count}, ${json[key].value.toFixed(2)}`);
    }
  }
}

function bucketSubCategories(bucketsRegex: any, desc2Map: any, tx: any, value: Number) {
  let match = false;
  let desc = tx["Description 2"].trim();
  for (let i=0; i<bucketsRegex.length; i++) {
    let matches = desc.match(bucketsRegex[i]);
    if (matches && matches.length > 1) {
      desc = matches[1];
      match = true;
      break;
    }
  }

  if (!match) {
    console.warn(desc)
  }

  if (desc2Map[desc] === undefined) {
    desc2Map[desc] = { count: 1, value: value };
  } else {
    desc2Map[desc].count += 1;
    desc2Map[desc].value += value;
  }
}

function categorize(regexDefn: any, desc1Map: any, tx: any, key: any, value: Number) {
  let desc2Map: any = desc1Map[key].desc2Map;
  if (regexDefn.bucketsRegex) {
    bucketSubCategories(regexDefn.bucketsRegex, desc2Map, tx, value);
  } else {
    const key2 = tx["Description 2"].trim();
    if (desc2Map[key2] === undefined) {
      desc2Map[key2] = { count: 1, value: value };
    } else {
      desc2Map[key2].count += 1;
      desc2Map[key2].value += value;
    }
  }
}

async function categorizeFiles(args: any, files: string[], regexDefns: any) {
  let desc1Map: any = {};
  let TOTAL_DEBITS = 0;
  let TOTAL_CREDITS = 0;

  for (let i = 0; i < files.length; i++) {
    try {
      const filename = basename(files[i]);
      const json = await parseCSVFile(files[i]);
      let credit: boolean;

      let count = 0;
      let debits = 0;
      let credits = 0;
      let totalDebits = 0;
      let totalCredits = 0;

      json.forEach((tx) => {
        if (tx["CAD$"]) {
          count++;

          const value = Number(tx["CAD$"]);
          if (value < 0) {
            debits++;
            totalDebits += value;
          } else if (value > 0) {
            credits++;
            totalCredits += value;
          } else {
            throw new Error("Unexpected Zero value!");
          }

          credit = (value > 0);
          let matched = false;
          regexDefns.every((rd: any) => {

            let key = rd.credit === undefined ? rd.pattern : rd.credit ? rd.pattern + " - CR" : rd.pattern + " - DR";
            if (rd.regex.test(tx["Description 1"].trim()) && (rd.credit === undefined || rd.credit === credit)) {
              matched = true;
              if (desc1Map[key] === undefined) {
                desc1Map[key] = { count: 1, credit: credit, value: value, desc2Map: rd.categorize ? {} : undefined };
              } else {
                if (desc1Map[key].credit != credit) {
                  console.debug(tx);
                  console.debug(desc1Map[key]);
                  throw new Error(`Unexpected credit/debit for "${key}" with credit=${credit}!`);
                }

                desc1Map[key].count += 1;
                desc1Map[key].value += value;
              }

              if (rd.categorize) {
                categorize(rd, desc1Map, tx, key, value);
              } else if (rd.categorize == undefined && tx["Description 2"]) {
                console.warn(key + ": " + tx["Description 2"]);
              }

              // break loop
              return false;
            }

            return true;
          });

          if (!matched) {
            console.warn(tx["Description 1"]);
          }
        } else if (tx["USD$"]) {
          throw new Error("Unexpected USD transaction!");
        }
      });

      TOTAL_DEBITS += totalDebits;
      TOTAL_CREDITS += totalCredits;

      if (args.summary) {
        console.info(`File: "${filename}"`);
        console.info(`--> Processed ${count} transactions (debits=${debits}, credits=${credits}) for total of ${CUR(totalDebits)} + ${CUR(totalCredits)} = ${CUR(totalDebits + totalCredits)}`);
      }
    } catch (err) {
      console.error(`Error processing CSV file "${files[i]}".`);
      if (args.debug) {
        console.error(err);
      } else {
        console.error(err.message ?? err);
      }
      return;
    }
  }

  if (args.summary) {
    console.log(`\nTOTAL DEBITS: ${CUR(TOTAL_DEBITS)} CREDITS: ${CUR(TOTAL_CREDITS)} = BALANCE: ${CUR(TOTAL_DEBITS + TOTAL_CREDITS)}`);
  }

  console.log();
  if (args.debug) {
    console.debug(desc1Map);
  } else {
    descMapToCSV(desc1Map);
  }
  console.log();
}

function checkUsage(args: any) {
  if (args["_"].length > 0) {
    return false;
  }
  return true;
}

function checkFiles(args: any, filePaths: string[]) {
  const dir = normalize(args.dir);
  const dirInfo = Deno.statSync(dir);
  //console.log(dirInfo);
  if (!dirInfo || !dirInfo.isDirectory) {
    throw new Error(`Invalid or inaccessible directory ${dir}`);
  }

  if (args.file) {
    //console.log(args.file);
    let files: string[];
    if (Array.isArray(args.file)) {
      files = args.file;
    } else {
      files = [];
      files.push(args.file);
    }

    files.forEach((file) => {
      if (isAbsolute(file)) {
        filePaths.push(normalize(file));
      } else {
        filePaths.push(join(dir, normalize(file)));
      }
    });
  } else {
    for (const dirEntry of Deno.readDirSync(args.dir)) {
      if (dirEntry.isFile && dirEntry.name.endsWith(".csv")) {
        filePaths.push(join(dir, dirEntry.name));
      }
    }
  }

  if (filePaths.length < 1) {
    throw new Error(`No CSV files found in directory: "${dir}"`);
  }

  //console.log(filePaths);

  filePaths.forEach((filePath) => {
    const fileInfo = Deno.statSync(filePath);
    //console.log(fileInfo);
    if (!fileInfo || !fileInfo.isFile) {
      throw new Error(`Invalid or inaccessible file ${filePath}`);
    }
  });
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
  csvCategorize.exe -d c:\\laundromat\\bank -f "2020 - banking.csv" -f "2021 - banking.csv"
  csvCategorize.exe -d c:\\laundromat\\bank -summary

Usage:
  -f or -file <CSV file> : specify the path to CSV file (repeat option to specify multiple files)
  -d or -dir <source dir> : specify the folder containing CSV file(s) to parse (defaults to current directory)
  -s or summary: print transaction summary for each CSV file as well as grand totals
  -debug : print diagnostics for validating the processing
  -h or -help : show this usage help`);
} else {
  const files: string[] = [];
  try {
    checkFiles(args, files);
    prepareRegex(DESC_1_REGEX);
    await categorizeFiles(args, files, DESC_1_REGEX);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}
