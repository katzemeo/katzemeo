import { normalize, isAbsolute, join, basename } from "https://deno.land/std@0.177.0/path/mod.ts";
import { parse as parseCSV } from "https://deno.land/std@0.128.0/encoding/csv.ts";
//import { StringReader } from "https://deno.land/std@0.177.0/io/mod.ts";
//import { BufReader } from "https://deno.land/std@0.177.0/io/mod.ts";
import { StringReader } from "https://deno.land/std@0.128.0/io/readers.ts";
import { BufReader } from "https://deno.land/std@0.128.0/io/bufio.ts";
//import { parse } from "https://deno.land/std@0.177.0/datetime/parse.ts";
import { datetime } from "https://deno.land/x/ptera/mod.ts";

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
  { source: `Custom field (Story Points)`, dest: `sp`, convert_number: "0" },
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
    map[m.type] = { items: [], lookupByJira: {}, parent_type: m.parent_type, has_children: m.has_children, linkToParent: function(item: any) {
      if (item.parent_jira && map[item.type] && map[map[item.type].parent_type]) {
        const parentItem = map[map[item.type].parent_type].lookupByJira[item.parent_jira];
        if (parentItem && map[map[item.type].parent_type].has_children) {
          if (!parentItem.children) {
            parentItem.children = [];
          }
          parentItem.children.push(item);
        } else {
          console.log(`Warning: for ${item.jira}, ${item.parent_jira} not found or should not have any children!`);
        }        
      }
    }};
  });

  return map;
}

function computeTotalSP(item: any): number {
  if (item.children) {
    let computed_sp: number = 0;
    item.children.forEach((child:any) => {
      computed_sp += computeTotalSP(child);
    });
    item.computed_sp = computed_sp;
    return computed_sp;
  }
  return item.sp ?? 0;
}

function printItemSummary(item: any, prefix = "") {
  console.log(`${prefix}[${item.type}] - ${item.jira} [${item.computed_sp ?? item.sp ?? "N/A"} SP]: ${item.summary}`);
}

export async function transformFiles(args: any, files: string[], output: any, fieldMappings: any = FIELD_MAPPINGS, parentMappings: any = PARENT_MAPPINGS) {
  const mapFields = prepareFieldMappings(fieldMappings);
  const mapItems = prepareParentMappings(parentMappings);

  // First pass: For all CSV files, map and convert fields into appropriate buckets.
  for (let i = 0; i < files.length; i++) {
    try {
      const filename = basename(files[i]);
      const json = await parseCSVFile(files[i]);
      //console.log(json);

      console.info(`File: "${filename}"`);      
      json.forEach((row) => {
        //console.debug(row);
        const obj: any = {};
        for (const key in row) {
          if (row[key]) {
            if (mapFields.convert[key]) {
              obj[mapFields.field[key]] = mapFields.convert[key](row[key]);
            } else if (mapFields.field[key]) {
              obj[mapFields.field[key]] = row[key];
            }
          }
        }
        //console.debug(obj);

        if (mapItems[obj.type]) {
          mapItems[obj.type].lookupByJira[obj.jira] = obj;
          mapItems[obj.type].items.push(obj);
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
      mapItems[item.type].linkToParent(item);
    });
  });
  //console.log(mapItems);

  // Third pass: perform DFS of all features to compute total SP based on Epic/Story breakdown
  mapItems["FEAT"].items.forEach((feat) => {
    computeTotalSP(feat);
  });

  //console.log(mapItems["FEAT"].items);
  if (args.summary) {
    let count = 0;
    let computed_sp = 0;
    mapItems["FEAT"].items.forEach((feat) => {
      if (!args.assignee || feat.assignee == args.assignee) {
        count++;
        printItemSummary(feat);
        computed_sp += feat.computed_sp ?? feat.sp;
        if (feat.children) {
          feat.children.forEach((epic) => {
            printItemSummary(epic, "  * ");
            if (epic.children) {
              epic.children.forEach((item) => {
                printItemSummary(item, "    - ");
              });
            }
          });
        }
      }
    });

    console.log(`Features matching - Count: ${count}, Computed SP: ${computed_sp}`);
  }

  if (args.feat) {
    const feat = mapItems["FEAT"].lookupByJira[args.feat];
    if (feat) {
      console.log(feat);
    } else {
      console.log(`Warning: Feature ${args.feat} not found!`);
    }
  }

  if (!output) {
    console.log();
  }

  if (args.debug) {
    console.debug(fieldMappings);
    console.debug(parentMappings);
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