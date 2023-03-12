import { parse as parseArgs } from "https://deno.land/std@0.134.0/flags/mod.ts"
import { checkFiles, transformFiles } from "./csvTransform.ts"

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
  boolean: ["debug", "json", "diff"],
  string: ["f", "d", "base", "feat", "assignee", "exclude"],
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
  console.log(`Parse Jira CSV export files and transform to JSON output\n
Examples:
  csv2json -f "test/sample.csv" -f "test/sample2.csv"
  csv2json -d test --summary
  csv2json -d test -s --exclude "JIRA-1234" --feat "FEAT-9105"
  csv2json -d test --json

Usage:
  -f or --file <CSV file> : specify the path to CSV file (repeat option to specify multiple files)
  -d or --dir <source dir> : specify the folder containing CSV file(s) to parse (defaults to current directory)
  -s or --summary : print issue summary for each CSV file as well as grand totals
  --base : specify the base snapshot JSON file for comparison
  --feat : specify the feature ID(s) to include
  --assignee : specify the feture assignee to include
  --exclude : specify the feature or epic parent IDs to exclude
  --diff : compare items with base snapshot and show differences
  --json : output JSON file for import into pippi and serve as new base snapshot
  --debug : print diagnostics for validating the processing
  -h or --help : show this usage help`);
} else {
  const files: string[] = [];
  try {
    checkFiles(args, files);
    await transformFiles(args, files, null);
  } catch (err) {
    if (args.debug) {
      console.error(err);
    }
    console.error(`Error: ${err.message}`);
  }
}
