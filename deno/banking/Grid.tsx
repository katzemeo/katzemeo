import { h, Component } from 'https://deno.land/x/nano_jsx@v0.0.30/mod.ts'

const CUR = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format;

export class Grid extends Component {
  render() {
    let count=1;
    return (
      <table class="table table-striped align-middle table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Count</th>
            <th>Value</th>
          </tr>
        </thead>
        {this.props.rows.map((row: any) => {
          return <tr><td>{count++}</td><td>{row.desc}</td><td>{row.count}</td><td>{CUR(row.value)}</td></tr>
        })}
      </table>
    )
  }
}