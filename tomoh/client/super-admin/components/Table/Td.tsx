import { ReactJSXElement } from "@emotion/react/types/jsx-namespace";
import { createStyles } from "@mantine/core";
import React from "react";

const useStyles = createStyles((theme) => ({
  Td: {
    "&:first-child": {
      borderTopLeftRadius: "6px",
      borderBottomLeftRadius: "6px",
    },
    "&:last-child": {
      borderTopRightRadius: "6px",
      borderBottomRightRadius: "6px",
    },
    paddingTop: "20px !important",
    paddingBottom: "20px !important",
    fontSize: theme.fontSizes.sm + "px !important",
    color: theme.colors.slate[7] + "!important",
    border: "unset !important",
    backgroundColor: "#FFFFFF",
    // marginBottom: 14,
  },
  ["th:first-child"]: {
    backgroundColor: "blue",
  },
  // tr:first-child td:last-child { border-top-right-radius: 10px; }
}));

type Props = {
  children?: any;
};

const Td = (props: any) => {
  const { classes } = useStyles();

  return (
    <>
      <td {...props} className={classes.Td}>
        {props.children}
      </td>
    </>
  );
};

export default Td;
