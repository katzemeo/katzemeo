import { Component, h } from "https://deno.land/x/nano_jsx@v0.1.0/mod.ts";

const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format;
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "America/Toronto";

function DATE(dt: Date, timeZone=TIME_ZONE) {
  return dt ? new Date(dt).toLocaleDateString('en-us', { timeZone: timeZone, year: "numeric", month: "short", day: "numeric" }) : "";
}

function formatDays(days: any) {
  return escapeSpecial(`Days 📅: ${days}`);
}

function formatAnnual(rate: any) {
  if (rate) {
    return escapeSpecial(`Annual (est.): ${CUR(rate*365.25)}`);
  }
  return "";
}

function formatTooltip(a: any) {
  if (a && a[0] !== a[1]) {
    return escapeSpecial(`Min: ${CUR(a[0])}, Max: ${CUR(a[1])}`);
  }
  return "";
}

function escapeSpecial(text: string) {
  var map: any = {
    '$': '💲', // Workaround Nano JSX bug with $ char
  };

  return text.replace(/[$]/g, function (m: string) { return map[m]; });
}

export class Grid extends Component {
  render() {
    let count = 1;
    return (
      <table class="table table-striped align-middle table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Description ℹ️</th>
            <th>Count #️⃣</th>
            <th>Total 💰</th>
            <th>From 📅</th>
            <th>To 📅</th>
            <th>Daily 💸</th>

            {(() => { if (this.props.args.stats) {
              return <th>Average 🧮</th>
            } })()}

            {(() => { if (this.props.args.stats) {
              return <th>Std Dev 📊</th>
            } })()}
          </tr>
        </thead>
        {this.props.rows.map((row: any) => {
          return (
            <tr>
              <td class="text-muted">{count++}</td>
              <td>{row.desc}</td>
              <td>{row.count}</td>              
              <td class={row.value < 0 ? "text-danger" : "text-success"} title={formatDays(row.days)}>{CUR(row.value)}</td>
              <td><nobr>{DATE(row.from)}</nobr></td>
              <td><nobr>{DATE(row.to)}</nobr></td>
              <td class={row.rate < 0 ? "text-danger" : "text-success"} title={formatAnnual(row.rate)}>{row.rate ? CUR(row.rate) : ""}</td>

              {(() => { if (this.props.args.stats) {
                return <td class={row.mean < 0 ? "text-danger" : "text-success"} title={formatTooltip(row.extent)}>{CUR(row.mean)}</td>
              } })()}

              {(() => { if (this.props.args.stats) {
                if (row.count > 1) {
                  return <td class={row.stddev > 0 ? "text-primary" : "text-dark"}>{CUR(row.stddev)}</td>
                } else {
                  return <td class="text-muted">{CUR(row.stddev)}</td>
                }} })()}
            </tr>
          );
        })}
      </table>
    );
  }
}
