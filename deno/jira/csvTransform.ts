import { normalize, isAbsolute, join, basename } from "https://deno.land/std@0.177.0/path/mod.ts";
import { parse as parseCSV } from "https://deno.land/std@0.128.0/encoding/csv.ts";
//import { StringReader } from "https://deno.land/std@0.177.0/io/mod.ts";
//import { BufReader } from "https://deno.land/std@0.177.0/io/mod.ts";
import { StringReader } from "https://deno.land/std@0.128.0/io/readers.ts";
import { BufReader } from "https://deno.land/std@0.128.0/io/bufio.ts";
//import { parse } from "https://deno.land/std@0.177.0/datetime/parse.ts";
import { datetime } from "https://deno.land/x/ptera/mod.ts";

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

// Information to map fields and convert value types as needed
const DATE_TIME_FMT = "d-MMM-YYYY h:mm a";
const FIELD_MAPPINGS = [
  { source: `Summary`, dest: `summary` },
  { source: `Issue key`, dest: `jira` },
  { source: `Issue Type`, dest: `type`,
    convert_enum: [ { from: "Feature", to: "FEAT" }, { from: "Epic", to: "EPIC" }, { from: "Story", to: "STORY" },
      { from: "Spike", to: "SPIKE" } ]
  },
  { source: `Status`, dest: `status`,
    convert_enum: [ { from: "Backlog", to: "BACKLOG" }, { from: "Blocked", to: "BLOCKED" },
      { from: "To Do", to: "READY" }, { from: "In Review", to: "INPROGRESS" },
      { from: "In Progress", to: "INPROGRESS" }, { from: "Done", to: "COMPLETED" } ]
  },
  { source: `Priority`, dest: `priority`,
    convert_enum: [ { from: "Critical", to: 1 }, { from: "High", to: 2 }, { from: "Medium", to: 3 }, { from: "Low", to: 4 } ]
  },
  { source: `Custom field (LOB)`, dest: `client` },
  { source: `Assignee`, dest: `assignee` },
  { source: `Reporter`, dest: `reporter` },
  { source: `Creator`, dest: `creator` },
  { source: `Created`, dest: `created`, convert_date: DATE_TIME_FMT },
  { source: `Updated`, dest: `updated`, convert_date: DATE_TIME_FMT },
  { source: `Resolved`, dest: `resolved`, convert_date: DATE_TIME_FMT },
  { source: `Due Date`, dest: `due`, convert_date: DATE_TIME_FMT },
  { source: `Fix Version/s`, dest: `release` },
  { source: `Description`, dest: `description` },
  { source: `Sprint`, dest: `sprint` },
  { source: `Inward issue link (Blocks)`, dest: `blocks` },
  { source: `Inward issue link (Depends)`, dest: `is_depended_on_by` },
  { source: `Inward issue link (Relates)`, dest: `relates_to` },
  { source: `Outward issue link (Blocks)`, dest: `is_blocked_by` },
  { source: `Outward issue link (Depends)`, dest: `depends_on` },
  { source: `Outward issue link (Relates)`, dest: `relates_to` },
  { source: `Custom field (Parent Link)`, dest: `parent_jira` },
  { source: `Custom field (Epic Link)`, dest: `parent_jira` },
  { source: `Custom field (Acceptance Criteria)`, dest: `ac` },
  { source: `Custom field (T-Shirt Size)`, dest: `t_shirt_size` },
  { source: `Custom field (Story Points)`, dest: `estimate`, convert_number: "0" },
];

// Information to link child items to parent (if any)
const PARENT_MAPPINGS = [
  { type: `FEAT`, parent_link: `Custom Field (Parent Link)`, parent_type: `INIT`, has_children: true },
  { type: `EPIC`, parent_link: `Custom Field (Parent Link)`, parent_type: `FEAT`, has_children: true },
  { type: `STORY`, parent_link: `Custom Field (Epic Link)`, parent_type: `EPIC`, has_children: false },
  { type: `SPIKE`, parent_link: `Custom Field (Epic Link)`, parent_type: `EPIC`, has_children: false }
];

function prepareFieldMappings(mappings: any) {
  const fieldsMap = {};
  const convertMap = {};
  const map = { field: fieldsMap, convert: convertMap };
  mappings.forEach((m: any) => {
    fieldsMap[m.source] = m.dest;
    if (m.convert_enum) {
      convertMap[m.source] = function(v) {
        for (let i=0; i<m.convert_enum.length; i++) {
          if (v == m.convert_enum[i].from) {
            return m.convert_enum[i].to;
          }
        }
        return v;
      };
    } else if (m.convert_date) {
      convertMap[m.source] = function(v) {
        if (v) {
          //console.log(v);
          //console.log(m.convert_date);
          const yearIndex = v.lastIndexOf('/') + 1;
          let year = v.substring(yearIndex);
          year = year.substring(0, year.indexOf(' '));
          if (year.length == 2) {
            v = v.substring(0, yearIndex) + "20"+ year + v.substring(yearIndex + 2);
            //console.warn(`Converting 2 digits year "${year}" to date time with 4 digits ("${v}")!`);
          } else if (year.length !== 4) {
            console.error(`Error parsing date time for field ["${m.source}"]!  Please specify year with 4 digits ("${v}").`);
            return null;
          }
          return datetime().parse(v, m.convert_date).toISO();
          //return parse(v, m.convert_date);
        }
        return v;
      };
    } else if (m.convert_number) {
      convertMap[m.source] = function(v) {
        let num = Number(v);
        return Number(num.toFixed(Number(m.convert_number)));
      };
    }
  });
  return map;
}

function prepareParentMappings(mappings: any) {
  const map = {};

  // Initialize map hierarchy of all item types and build function to link to parent items
  mappings.forEach((m: any) => {
    map[m.type] = { items: [], lookupByJira: {}, parent_type: m.parent_type, has_children: m.has_children,
      linkToParent: function(item: any, exclude: string="") {
      if (item.parent_jira) {
        if ((!exclude || exclude.indexOf(item.parent) < 0) && map[item.type] && map[map[item.type].parent_type]) {
          const parentItem = map[map[item.type].parent_type].lookupByJira[item.parent_jira];
          if (parentItem && map[map[item.type].parent_type].has_children) {
            if (!parentItem.children) {
              parentItem.children = [];
            }
            parentItem.children.push(item);
          } else {
            console.warn(`Warning: for ${item.jira}, ${item.parent_jira} not found or should not have any children!`);
          }      
        }
      } else if (item.type !== "FEAT") {
        console.warn(`Warning: Item ${item.jira} does not specify a parent FEAT or EPIC!`);
      }
    }};
  });

  return map;
}

class Item extends Object {
  jira: string;
  summary: string;
  type: string;
  client: string;
  description: string;
  status: string;
  estimate: number;
  computed_sp: number;
  completed: number;
  remaining: number;
  children: [];

  toString(): string {
    if (this.children) {
      let str = fmtItemSummary(this, this.type === "FEAT" ? "" : "# ");
      this.children.forEach((child) => {
        str += "\n  ";
        str += child;
      });
      return str;
    }
    return fmtItemDetails(this, "    ");
  }
}

function fmtItemSummary(item: any, prefix = ""): string {
  if (item.type === "FEAT" || item.type === "EPIC") {
    return `${prefix}[${item.type}] - ${item.jira} : ${item.status} [completed: ${item.completed >= 0 ? item.completed : "N/A"}, remaining: ${item.remaining >= 0 ? item.remaining : "N/A"}, computed_sp: ${item.computed_sp >= 0 ? item.computed_sp : "N/A"}, estimate: ${item.estimate ?? "N/A"}, depends_on: ${item.depends_on ?? "None"}]: ${item.summary}]`;
  }
  return `${prefix}[${item.type}] - ${item.jira} : ${item.status} [SP: ${item.estimate ?? "N/A"}, depends_on: ${item.depends_on ?? "None"}]: ${item.summary}]`;
}

function fmtItemDetails(item: any, prefix = ""): string {
  return fmtItemSummary(item, item.type === "FEAT" ? "" : prefix +"+ ") +
  `\n${prefix}${prefix}client: ${item.client ?? "N/A"}, p: ${item.priority}, assignee: ${item.assignee ?? "N/A"}, release: ${item.release ?? "N/A"}` +
  `\n${prefix}${prefix}description: ${item.description ? item.description.substring(0, 80) : "N/A"}` +
  `\n${prefix}${prefix}ac: ${item.ac ? item.ac.substring(0, 80) : "N/A"}`;
}

function printItemSummary(item: any, prefix = "") {
  console.log(fmtItemSummary(item, prefix));
}

function computeTotalSP(item: any, sortChildren = true): number {
  if (item.children) {
    let computed_sp: number = 0;
    let completed = 0;
    let remaining = 0;
    item.children.forEach((child:any) => {
      computed_sp += computeTotalSP(child);
      completed += child.completed ?? 0;
      remaining += child.remaining ?? 0;
    });
    item.computed_sp = computed_sp;
    item.completed = completed;
    item.remaining = remaining;

    if (item.status === "COMPLETED" && item.remaining > 0) {
      console.warn(`computeTotalSP() - ${item.jira} is COMPLETED but remaining SP is ${item.remaining}!`);
    }
  
    if (sortChildren) {
      item.children.sort(function(a: any, b:any): number {
        const sortKey = "jira";
        a = a[sortKey];
        b = b[sortKey];
        if (!a) a = "";
        if (!b) b = "";
        return (a === b ? 0 : a > b ? 1 : -1);
      });
    }
    return computed_sp;
  }

  const sp = item.estimate ?? 0;
  if (item.status === "COMPLETED") {
    console.warn(`computeTotalSP() - ${item.jira} is already COMPLETED!`);
    item.completed = sp;
    item.remaining = 0;
  } else {
    item.remaining = sp; // Assume full estimate SP remains until item is completed!
  }
  return sp;
}

export async function transformFiles(args: any, files: string[], output: any, fieldMappings: any = FIELD_MAPPINGS, parentMappings: any = PARENT_MAPPINGS) {
  const mapFields = prepareFieldMappings(fieldMappings);
  const mapItems = prepareParentMappings(parentMappings);

  // First pass: For all CSV files, map and convert fields into appropriate buckets.
  for (let i = 0; i < files.length; i++) {
    try {
      const filename = basename(files[i]);
      const json = await parseCSVFile(files[i]);
      if (args.debug) {
        console.debug(`File: "${filename}"`);
      }
      json.forEach((row) => {
        //console.debug(row);
        const item: Item = new Item();
        for (const key in row) {
          if (row[key]) {
            if (mapFields.convert[key]) {
              item[mapFields.field[key]] = mapFields.convert[key](row[key]);
            } else if (mapFields.field[key]) {
              item[mapFields.field[key]] = row[key];
            }
          }
        }
        //console.debug(item);

        if (mapItems[item.type]) {
          mapItems[item.type].lookupByJira[item.jira] = item;
          mapItems[item.type].items.push(item);
        }
      });
      //console.log(mapItems);

    } catch (err) {
      console.log(err);
      console.error(`Error processing CSV file "${files[i]}".`);
      if (args.debug) {
        console.error(err);
      } else {
        console.error(err.message ?? err);
      }
      return false;
    }
  }
  //console.log(mapItems);

  // Second pass: For all objects of each type, locate parent (if any) add as a child
  Object.entries(mapItems).forEach(([key, entry]: [any, any]) => {
    entry.items.forEach((item: any) => {
      mapItems[item.type].linkToParent(item, args.exclude);
    });
  });
  //console.log(mapItems);

  // Third pass: perform DFS of all features to compute total SP based on Epic/Story breakdown
  mapItems["FEAT"].items.forEach((feat) => {
    computeTotalSP(feat);
  });

  let count = 0;
  let computed_sp = 0;
  let completed_sp = 0;
  let remaining_sp = 0;
  let feats: any = [];
  mapItems["FEAT"].items.sort(function(a: any, b:any): number {
    const sortKey = "summary";
    a = a[sortKey];
    b = b[sortKey];
    if (!a) a = "";
    if (!b) b = "";
    return (a === b ? 0 : a > b ? 1 : -1);
  });
  mapItems["FEAT"].items.forEach((feat: any) => {
    if ((!args.assignee || feat.assignee == args.assignee) &&
        (!args.feat || args.feat.indexOf(feat.jira) >= 0) &&
        (!args.exclude || args.exclude.indexOf(feat.jira) < 0)) {
      count++;
      feats.push(feat);
      if (args.summary) {
        console.log("=".repeat(150));
        printItemSummary(feat);
        console.log("=".repeat(150));
      }
      computed_sp += feat.computed_sp ?? feat.estimate;
      completed_sp += feat.completed ?? 0;
      remaining_sp += feat.remaining;

      if (feat.children) {
        feat.children.forEach((epic) => {
          if (args.summary) {
            printItemSummary(epic, "  # ");
          }
          if (epic.children) {
            epic.children.forEach((item) => {
              if (args.summary) {
                printItemSummary(item, "    + ");
              }
            });
          }
        });
      }
    }
  });

  if (feats.length > 0) {
    if (args.json) {
      const team: any = { name: "PI TEAM", squad: "My Squad", sp_per_day_rate: 0.8, capacity: 30, items: feats };
      console.log(JSON.stringify(team, null, 2));
    } else {
      if (!args.summary) {
        feats.forEach((feat: any) => {
          console.log("=".repeat(150));
          console.log(feat.toString());
        });  
      }
      console.log();
      console.log("*".repeat(150));
      console.log(`*** TOTALS *** Features matching - Count: ${count}, Computed SP: ${computed_sp}, Completed SP: ${completed_sp}, Remaining SP: ${remaining_sp}`);
      console.log("*".repeat(150));
    }
  } else {
    console.warn(`Warning: no matching features found!`);
  }

  if (args.debug) {
    console.debug(fieldMappings);
    console.debug(parentMappings);
  }

  return true;
}