import { Box, createStyles, Table as TableUI } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  header: {
    tr: {
      borderRadius: 20,
    },
    backgroundColor: theme.colors.slate[0],
    th: {
      padding: "0 20px !important",
      textAlign: "right !important" as any,
      height: 44,
      border: "unset !important",
      color: theme.colors.slate[5] + "!important",
      fontWeight: (400 + "!important") as any,
      fontSize: theme.fontSizes.md + "px !important",
    },
  },
}));

function TableOld() {
  const { classes } = useStyles();
  const elements = [
    {
      name: "name",
      position: "position",
      symbol: "symbol",
      mass: "mass",
    },
  ];
  const rows = elements.map((element) => (
    <tr key={element.name}>
      <td>{element.position}</td>
      <td>{element.name}</td>
      <td>{element.symbol}</td>
      <td>{element.mass}</td>
    </tr>
  ));

  return (
    <TableUI>
      <thead className={classes.header}>
        <tr>
          <th>إسم الموظف</th>
          <th>رقم</th>
          <th>صفحة</th>
          <th>عنوان</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </TableUI>
  );
}

export default TableOld;
