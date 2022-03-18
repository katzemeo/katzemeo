import { normalize, isAbsolute, join, basename } from "https://deno.land/std@0.128.0/path/mod.ts";
import { parse as parseCSV } from "https://deno.land/std@0.128.0/encoding/csv.ts";
import { StringReader } from "https://deno.land/std@0.128.0/io/readers.ts";
import { BufReader } from "https://deno.land/std@0.128.0/io/bufio.ts";

const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format;
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Toronto";

function DATE(dt: Date, timeZone=TIME_ZONE) {
  return dt ? new Date(dt).toLocaleDateString('en-us', { timeZone: timeZone, weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "";
}

const parseCSVText = async (text: string) => {
  const bufReader = new BufReader(new StringReader(text));
  let json: Array<any> = await parseCSV(bufReader, {
    skipFirstRow: true
  });
  return json;
};

const parseCSVFile = async (csvFile: string) => {
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
  { pattern: `Bill Payment|BILL PAYMENT`, categorize: true, buckets: [`(TELPAY BILL)P[0-9]+`] },
  { pattern: `COMMERCIAL TAXES`, categorize: true },
  { pattern: `Cash withdrawal` },
  { pattern: `(Cheque|CHEQUE) - [0-9]+` },
  { pattern: `Cheque returned NSF` },
  { pattern: `Chq Printing Fee|CHQ PRINTING FEE`, categorize: true },
  { pattern: `Credit Memo`, categorize: true },
  { pattern: `Credit memo` },
  { pattern: `Deposit [' ']* [0-9]+` },
  { pattern: `Deposit`, credit: false, categorize: true },
  { pattern: `Deposit`, credit: true, categorize: true },
  { pattern: `Federal Payment`, categorize: true },
  { pattern: `ELECTRONIC ITEM FEE`, categorize: true },
  { pattern: `Electronic transaction fee`, categorize: false },
  { pattern: `Inactive account fee`, categorize: true },
  { pattern: `INTERAC e-Transfer cancel - [0-9]+` },
  { pattern: `INTERAC e-Transfer fee` },
  { pattern: `In branch cash deposited fee`, categorize: false },
  { pattern: `Interac purchase - [0-9]+`, categorize: true },
  { pattern: `Interac purchase refund - [0-9]+`, categorize: true },
  { pattern: `Item returned NSF` },
  { pattern: `Items on deposit fee`, categorize: false },
  { pattern: `Loan payment`, categorize: true },
  { pattern: `MINIMUM FEE`, categorize: true },
  { pattern: `Minimum monthly fee`, categorize: true },
  { pattern: `Misc Payment|MISC PAYMENT`, categorize: true },
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
  { pattern: `SERVICE FEE`, categorize: false },
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

function descMapToCSV(json: any, output: any = null) {
  if (!output) {
    console.log(`"DESCRIPTION",COUNT,TOTAL`);
  }
  for (const key in json) {
    if (json[key].desc2Map) {
      let desc2Map: any = json[key].desc2Map;
      for (const key2 in desc2Map) {
        const subcategory = key2 ? ` - [${key2}]` : "";
        const row = {desc: `"${key}${subcategory}"`, from: json[key].from, to: json[key].to, count: desc2Map[key2].count, value: desc2Map[key2].value.toFixed(2)};
        if (output) {
          output.push(row);
        } else {
          console.log(row.desc +", "+ row.count +", "+ row.value);
        }
      }
    } else {
      const row = {desc: `"${key}"`, from: json[key].from, to: json[key].to, count: json[key].count, value: json[key].value.toFixed(2)};
      if (output) {
        output.push(row);
      } else {
        console.log(row.desc +", "+ row.count +", "+ row.value);
      }
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

function match(regexDefns: any, desc1Map: any, tx: any, date: Date, value: Number) {
  const credit = (value > 0);
  let matched = false;
  regexDefns.every((rd: any) => {

    let key = rd.credit === undefined ? rd.pattern : rd.credit ? rd.pattern + " - CR" : rd.pattern + " - DR";
    if (rd.regex.test(tx["Description 1"].trim()) && (rd.credit === undefined || rd.credit === credit)) {
      matched = true;
      if (desc1Map[key] === undefined) {
        desc1Map[key] = { count: 1, credit: credit, from: date, to: date, value: value, desc2Map: rd.categorize ? {} : undefined };
      } else {
        if (desc1Map[key].credit != credit) {
          console.debug(tx);
          console.debug(desc1Map[key]);
          throw new Error(`Unexpected credit/debit for "${key}" with credit=${credit}!`);
        }

        desc1Map[key].count += 1;
        if (desc1Map[key].from.getTime() > date.getTime()) {
          desc1Map[key].from = date;
        } else if (desc1Map[key].to.getTime() < date.getTime()) {
          desc1Map[key].to = date;
        }

        desc1Map[key].value += value;
      }

      if (rd.categorize) {
        categorize(rd, desc1Map, tx, key, value);
      } else if (rd.categorize == undefined && tx["Description 2"]) {
        console.warn(`Unknown category: "${key}" : [${tx["Description 2"]}]`);
      }

      // break loop
      return false;
    }

    return true;
  });

  return matched;
}

export async function categorizeFiles(args: any, files: string[], output: any, regexDefns: any = DESC_1_REGEX) {
  prepareRegex(regexDefns);

  let desc1Map: any = {};
  let TOTAL_DEBITS = 0;
  let TOTAL_CREDITS = 0;
  let TOTAL_UNMATCHED_DEBITS = 0;
  let TOTAL_UNMATCHED_CREDITS = 0;
  let TOTAL_UNMATCHED = 0;
  let FROM: any = null;
  let TO: any = null;

  for (let i = 0; i < files.length; i++) {
    try {
      const filename = basename(files[i]);
      const json = await parseCSVFile(files[i]);

      let count = 0;
      let unmatched = 0;
      let debits = 0;
      let credits = 0;
      let totalDebits = 0;
      let totalCredits = 0;
      let totalUnmatchedDebits = 0;
      let totalUnmatchedCredits = 0;

      let accountNo: any = null;
      let date: any;
      let from: any = null;
      let to: any = null;

      json.forEach((tx) => {
        if (accountNo && accountNo !== tx["Account Number"]) {
          throw new Error(`Multiple account numbers ("${accountNo}" & "${tx["Account Number"]}") found!`);
        } else {
          accountNo = tx["Account Number"];
        }

        date = new Date(tx["Transaction Date"]);
        if (from && from.getTime() > date.getTime()) {
          from = date;
        } else if (!from) {
          from = date;
        }
  
        if (to && to.getTime() < date.getTime()) {
          to = date;
        } else if (!to) {
          to = date;
        }

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

          let matched = match(regexDefns, desc1Map, tx, date, value);
          if (!matched) {
            unmatched++;

            if (value < 0) {
              debits++;
              TOTAL_UNMATCHED_DEBITS += value;
            } else if (value > 0) {
              credits++;
              TOTAL_UNMATCHED_CREDITS += value;
            }

            console.warn(`Unknown category: "${tx["Description 1"]}" on ${DATE(date)} of ${CUR(value)} ignored!`);
          }
        } else if (tx["USD$"]) {
          throw new Error("Unexpected USD transaction!");
        }
      });

      TOTAL_DEBITS += totalDebits;
      TOTAL_CREDITS += totalCredits;
      TOTAL_UNMATCHED_DEBITS += totalUnmatchedDebits;
      TOTAL_UNMATCHED_CREDITS += totalUnmatchedCredits;
      TOTAL_UNMATCHED += unmatched;

      if (FROM && FROM.getTime() > from.getTime()) {
        FROM = from;
      } else if (!FROM) {
        FROM = from;
      }

      if (TO && TO.getTime() < to.getTime()) {
        TO = to;
      } else if (!TO) {
        TO = to;
      }

      if (args.summary) {
        console.info(`File: "${filename}" [From: ${DATE(from)} To: ${DATE(to)}]`);
        console.info(`--> Processed ${count} transactions (debits=${debits}, credits=${credits}) for balance of ${CUR(totalDebits)} + ${CUR(totalCredits)} = ${CUR(totalDebits + totalCredits)}`);
        if (unmatched > 0) {
          console.info(`--> WARNING: ${unmatched} Unmatched transactions (with balance of ${CUR(totalUnmatchedDebits)} + ${CUR(totalUnmatchedCredits)} = ${CUR(totalUnmatchedDebits + totalUnmatchedCredits)})`);
        }
      }
    } catch (err) {
      console.error(`Error processing CSV file "${files[i]}".`);
      if (args.debug) {
        console.error(err);
      } else {
        console.error(err.message ?? err);
      }
      return false;
    }
  }

  if (args.summary) {
    console.log(`\nTOTAL DEBITS: ${CUR(TOTAL_DEBITS)} CREDITS: ${CUR(TOTAL_CREDITS)} = BALANCE: ${CUR(TOTAL_DEBITS + TOTAL_CREDITS)}`);
  }

  if (TOTAL_UNMATCHED > 0) {
    console.info(`WARNING: TOTAL ${TOTAL_UNMATCHED} Unmatched transactions (with balance of ${CUR(TOTAL_UNMATCHED_DEBITS)} + ${CUR(TOTAL_UNMATCHED_CREDITS)} = ${CUR(TOTAL_UNMATCHED_DEBITS + TOTAL_UNMATCHED_CREDITS)})`);
  }

  if (!output) {
    console.log();
  }

  if (args.debug) {
    console.debug(desc1Map);
    if (output) {
      descMapToCSV(desc1Map, output);
    }
  } else {
    descMapToCSV(desc1Map, output);
  }

  if (!output) {
    console.log();
  }

  return true;
}

export function checkFiles(args: any, filePaths: string[]) {
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