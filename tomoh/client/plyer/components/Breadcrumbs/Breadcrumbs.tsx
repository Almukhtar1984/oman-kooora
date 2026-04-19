import { BreadcrumbsProps, Breadcrumbs as BreadcrumbsUI } from "@mantine/core";
import React from "react";

type Props = {} & BreadcrumbsProps;

const Breadcrumbs = (props: Props) => {
  return (
    <BreadcrumbsUI
      {...props}
      sx={({ colors, fontSizes }) => ({
        "& .mantine-rtl-Anchor-root": {
          color: colors.slate[4],
          fontSize: fontSizes.md + "px",
          "&:last-child": {
            color: colors.slate[6],
            cursor: "default",
            textDecoration: "none",
          },
        },
      })}
    >
      {props.children}
    </BreadcrumbsUI>
  );
};

export default Breadcrumbs;
