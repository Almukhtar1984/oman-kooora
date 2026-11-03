// The table library lays every cell of every row into ONE grid, so the column
// widths must match the columns one for one. A column added without its width
// pushes each row's last cell onto the next line, and every row after it slides
// one step further — the loans and transfers pages rendered exactly that once a
// column was added. Each column now carries its own width and the grid is read
// from the columns, so the two cannot drift apart again.
//
// Widths are fixed pixels, not percentages: a percentage of a phone's width
// left a team name three letters wide. The table scrolls sideways instead.

export type GridColumn = { width?: string };

export const DEFAULT_COLUMN_WIDTH = "120px";

export const gridTemplate = (columns: GridColumn[]) =>
    columns.map((column) => column.width || DEFAULT_COLUMN_WIDTH).join(" ");

/** A stored date, or a dash — never the text "null" or the 1970 placeholder. */
export const dateCell = (value?: string | null) =>
    value && !String(value).startsWith("1970-01-01") ? String(value) : "—";

/** Search keys for a transfer/loan row: the member's name and civil number, and both teams. */
export const TRANSFER_SEARCH_KEYS = ["player", "technicalApparatus"].flatMap((subject) =>
    ["first_name", "second_name", "third_name", "tribe", "card_number"].map((field) => `${subject}.person.${field}`),
).concat(["team_from.name", "team_to.name", "club_to.name"]);
