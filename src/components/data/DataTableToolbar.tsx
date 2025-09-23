/**
 * The strip above a table: filters on the left, actions on the right.
 *
 * It is a `<search>`-flavoured region rather than a bare div so that a screen-reader user can
 * jump straight to the filters, and so the selection summary has somewhere polite to announce
 * itself from.
 *
 * Two call shapes, because the migration is half done:
 *
 *   <DataTableToolbar filters={<FilterBar/>} actions={<ExportCsvButton/>} resourceLabel="charges" />
 *   <DataTableToolbar label="Charge actions"><ExportCsvButton/></DataTableToolbar>
 *
 * The second is the older one: `children` land in the actions slot and `label` names the
 * region verbatim. TODO(rrefactor): converge on the first — PAY-1968.
 */
