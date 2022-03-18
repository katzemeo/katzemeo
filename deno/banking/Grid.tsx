import { Component, h } from "https://deno.land/x/nano_jsx@v0.0.30/mod.ts";

const CUR =
  new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format;
  const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Toronto";

function DATE(dt: Date, timeZone=TIME_ZONE) {
  return dt ? new Date(dt).toLocaleDateString('en-us', { timeZone: timeZone, weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "";
}
  
export class Grid extends Component {
  render() {
    let count = 1;
    return (
      <table class="table table-striped align-middle table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>From</th>
            <th>To</th>
            <th>Count</th>
            <th>Value</th>
          </tr>
        </thead>
        {this.props.rows.map((row: any) => {
          return (
            <tr>
              <td>{count++}</td>
              <td>{row.desc}</td>
              <td>{DATE(row.from)}</td>
              <td>{DATE(row.to)}</td>
              <td>{row.count}</td>
              <td>{CUR(row.value)}</td>
            </tr>
          );
        })}
      </table>
    );
  }
}
